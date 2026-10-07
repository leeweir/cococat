import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {createCat,poseLegs,syncEyelids} from '../src/cat-model.js';
import {disposeCat} from '../src/world.js';
import {LivingWorld} from '../src/living-world.js';
import {BREEDS} from '../src/state.js';
import {dressCat} from '../src/outfit-model.js';

test('every shipped pet decodes with the runtime decoder and retains guides and normalized skinning',async()=>{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  for(const {id} of BREEDS){
    const bytes=await readFile(new URL(`../public/pets/${id}-full.glb`,import.meta.url));
    assert.ok(bytes.length<400000,`${id} exceeds the download budget`);
    const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const skin=gltf.scene.getObjectByName('pet-skin');
    assert.ok(skin.isSkinnedMesh);assert.equal(skin.skeleton.bones.length,14);
    for(const name of ['face-guide','torso-guide'])assert.ok(gltf.scene.getObjectByName(name));
    const g=skin.geometry,weights=g.attributes.skinWeight;
    assert.ok(g.index.count/3<24000,`${id} exceeds the skin geometry budget`);
    for(let i=0;i<weights.count;i+=13){
      const sum=[0,1,2,3].reduce((total,j)=>total+weights.getComponent(i,j),0);
      assert.ok(Math.abs(sum-1)<.002,`${id} has invalid weights`);
    }
    assert.equal((await readFile(new URL(`../public/pets/portraits/${id}.png`,import.meta.url))).readUInt32BE(0),0x89504e47);
  }
});

test('clothing on decoded skins stays visible and finite through head turns and walking',async()=>{
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  for(const breed of ['calico','corgi','lop']){
    const bytes=await readFile(new URL(`../public/pets/${breed}-full.glb`,import.meta.url));
    const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const cat=createCat(breed),geometry=gltf.scene.getObjectByName('pet-skin').geometry.clone();
    cat.userData.skin.geometry=geometry;cat.userData.ownedGeometries.add(geometry);
    dressCat(cat,{top:'stripe-tee',neck:'scarf-stripe',feet:'sneakers'});
    for(const phase of [0,.42,.76]){
      poseLegs(cat,phase,.32,.10);cat.userData.head.rotation.set(-.3,.35,.1);cat.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(cat);
      assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),`${breed} outfit has invalid visible bounds`);
      assert.ok(bounds.getSize(new THREE.Vector3()).length()<5,`${breed} outfit escapes the body`);
      for(const m of cat.userData.dress.meshes.filter(m=>m.isSkinnedMesh)){
        const p=m.geometry.attributes.position,w=m.geometry.attributes.skinWeight;
        assert.ok(p.count>0,'shirt must contain visible fabric');
        for(let i=0;i<p.count;i+=29){
          const sum=[0,1,2,3].reduce((n,j)=>n+w.getComponent(i,j),0);
          assert.ok(Math.abs(sum-1)<.002,`${breed} garment loses its bone weights`);
          assert.ok(m.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(p,i)).toArray().every(Number.isFinite));
        }
      }
    }
    disposeCat(cat);
    gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material))m.dispose();}if(o.isSkinnedMesh)o.skeleton.dispose();});
  }
});

test('touching the unified skin still picks head, chin, nose and paws from both camera angles',()=>{
  for(const breed of ['calico','corgi','lop']){
    const cat=createCat(breed),d=cat.userData;
    const world=Object.assign(Object.create(LivingWorld.prototype),{cat,mode:'portrait',currentScene:'adopt',uiBlocked:false,canvas:{getBoundingClientRect:()=>({left:0,top:0,right:800,bottom:800,width:800,height:800})},pointer:new THREE.Vector2(),portraitPoint:new THREE.Vector3(),portraitHits:[],ray:new THREE.Raycaster(),camera:new THREE.PerspectiveCamera(32,1,.1,20)});
    for(const angle of [0,.7]){
      world.camera.position.set(Math.sin(angle)*4,1.1,Math.cos(angle)*4);world.camera.lookAt(0,.7,.1);world.camera.updateMatrixWorld();cat.updateMatrixWorld(true);
      const a=d.anchors,headPoint=(x,y)=>d.head.localToWorld(new THREE.Vector3(x,y,a.projectFace(x,y)+.0001));
      const targets={head:headPoint(.08,.19),nose:headPoint(0,a.noseY),chin:headPoint(0,a.noseY-.095),paw:d.rig.localToWorld(new THREE.Vector3(d.legs[0].position.x,.055,d.profile.front+.075))};
      for(const [expected,point] of Object.entries(targets)){
        const screen=point.project(world.camera),actual=world.portraitActionAt({clientX:(screen.x+1)*400,clientY:(1-screen.y)*400});
        assert.equal(actual,expected,`${breed}, camera ${angle}, ${expected}`);
      }
    }
    disposeCat(cat);
  }
});

test('the three primary skins remain continuous and finite through walking and eye closure',()=>{
  for(const breed of ['calico','corgi','lop']){
    const cat=createCat(breed),skin=cat.userData.skin,p=skin.geometry.attributes.position;
    for(const phase of [0,.18,.42,.76]){
      poseLegs(cat,phase,.32,.10);cat.updateMatrixWorld(true);
      for(let i=0;i<p.count;i+=31){const v=skin.applyBoneTransform(i,new THREE.Vector3().fromBufferAttribute(p,i));assert.ok(v.toArray().every(Number.isFinite));assert.ok(v.y>-.06,`${breed} deformed below floor`);}
    }
    const eye=cat.userData.eyes[0],upper=eye.userData.lids[0].geometry.attributes.position,mid=14;
    eye.scale.y=1;syncEyelids(cat);const openY=upper.getY(mid);
    eye.scale.y=.5;syncEyelids(cat);const halfY=upper.getY(mid);
    eye.scale.y=.1;syncEyelids(cat);const shutY=upper.getY(mid);
    assert.ok(openY>halfY&&halfY>shutY,'upper lid must smoothly close over the eye');
    assert.ok(Math.abs(eye.scale.y*eye.children[0].scale.y-1)<1e-6,'iris must keep its shape');
    const iris=new THREE.Mesh(eye.children[0].geometry,eye.children[0].material),cover=new THREE.Mesh(eye.userData.lids[0].geometry,eye.userData.lids[0].material);
    iris.position.copy(eye.position);cover.position.copy(eye.position);iris.updateMatrixWorld();cover.updateMatrixWorld();
    const radius=cat.userData.anchors.eyeRadius,ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1));
    for(const x of [-.65,0,.65])for(const y of [.4,.7]){
      ray.ray.origin.set(eye.position.x+x*radius,eye.position.y+y*radius,2);
      const eyeHit=ray.intersectObject(iris)[0],lidHit=ray.intersectObject(cover)[0];
      assert.ok(eyeHit&&lidHit&&lidHit.distance<eyeHit.distance,`${breed}: iris penetrates closed eyelid`);
    }
    disposeCat(cat);
  }
});
