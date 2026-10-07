import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCat,CAT_PROFILES,pawStep,legAngles,poseLegs,syncEyelids} from '../src/cat-model.js';
import {dressCat,undressCat,animateOutfit} from '../src/outfit-model.js';
import {SLOTS,WARDROBE} from '../src/wardrobe.js';
import {restartGame,restoreGame,BACKUP_KEY} from '../src/save-manager.js';
import {freshState,SAVE_KEY,FURNITURE,FURNITURE_BY_ID} from '../src/state.js';
const finiteGeometry=(root,label)=>root.traverse(o=>{if(o.geometry)for(const [key,a] of Object.entries(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite),`${label} invalid ${key} geometry`);});

test('thirty-four silhouettes each have four articulated paws and finite grounded gait',()=>{
 assert.equal(new Set(Object.values(CAT_PROFILES).map(p=>JSON.stringify([p.body,p.head,p.hip,p.ear]))).size,34);
 for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed);assert.equal(cat.userData.legs.length,4);finiteGeometry(cat,breed);
  // Eyes must sit just above the actual cheek surface, including at their edges.
  const face=cat.getObjectByName('sculpted-face');
  const surface=new THREE.Mesh(face.geometry,face.material);
  const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1));
  for(const eye of cat.userData.eyes){
   const mesh=eye.getObjectByName('fitted-eye'),positions=mesh.geometry.attributes.position;
   assert.ok(cat.userData.ownedGeometries.has(mesh.geometry));
   assert.ok(cat.userData.ownedMaterials.has(mesh.material));
   assert.ok(mesh.material.roughness>=.45&&mesh.material.clearcoat<=.2);
   for(let i=0;i<positions.count;i+=10){
    const x=eye.position.x+positions.getX(i),y=eye.position.y+positions.getY(i);
    ray.ray.origin.set(x,y,1.2);
    const skin=ray.intersectObject(surface,false)[0];assert.ok(skin,`${breed}: eye outside face`);
    const clearance=positions.getZ(i)-skin.point.z;
    assert.ok(clearance>=.003&&clearance<=.015,`${breed}: detached or buried eye (${clearance})`);
   }
   for(const scale of [.1,.44,1,.7,1]){
    eye.scale.y=scale;syncEyelids(cat);
    assert.equal(eye.visible,scale>.07);
    assert.equal(eye.userData.lid.visible,scale<.15);
    assert.ok(Math.abs(eye.scale.y*mesh.scale.y-1)<1e-6,'blinking must occlude the iris, not squash it');
    assert.equal(eye.userData.lids.length,2);
   }
  }
  for(const phase of [0,.12,.4,.66,.88,1]){
   poseLegs(cat,phase,.4,.12);cat.updateMatrixWorld(true);
   const planted=[];
   for(const leg of cat.userData.legs){assert.ok(Number.isFinite(leg.rotation.x));assert.ok(Number.isFinite(leg.userData.knee.rotation.x));const foot=leg.userData.ankle.getWorldPosition(cat.position.clone());assert.ok(foot.y>=-.001,`${breed} paw below floor ${foot.y}`);planted.push(foot.y<.02);}
   assert.ok(planted.filter(Boolean).length>=2,`${breed} lifts too many paws at phase ${phase}`);
  }
 }
});

test('every breed also builds as a cheap thumbnail model',()=>{
 for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed,{},{lod:'low'});
  assert.equal(cat.userData.breed,breed);assert.equal(cat.userData.legs.length,4);assert.equal(cat.userData.eyes.length,2);
  for(const part of ['rig','head','tail','body','top'])assert.ok(cat.userData[part],`${breed} missing ${part}`);
  assert.equal(cat.userData.ears.length,2);
  assert.ok(cat.getObjectByName('sculpted-face'));
  assert.deepEqual(cat.userData.outfit,{});
  finiteGeometry(cat,`${breed} low`);
 }
});

test('walk has a planted stance, raised swing and continuous stride boundary',()=>{
 for(const phase of [0,.2,.5,.63])assert.equal(pawStep(phase).y,0);
 assert.ok(pawStep(.82).y>.10);
 assert.ok(Math.abs(pawStep(.999999).z-pawStep(0).z)<.00001);
 const a=legAngles(.6,.16,.34,.34);assert.ok(Number.isFinite(a.hip+a.knee));
});

test('all one hundred pieces fit three different body types without breaking the mesh',()=>{
 const cats=['calico','persian','munchkin','norwegian'].map(b=>createCat(b,{},{lod:'low'}));
 for(const cat of cats)for(const piece of WARDROBE){
  dressCat(cat,{[piece.slot]:piece.id});
  const dress=cat.userData.dress;
  assert.ok(dress.meshes.length>0,`${piece.id} on ${cat.userData.breed} built nothing`);
  assert.deepEqual(cat.userData.outfit,{[piece.slot]:piece.id},piece.id);
  finiteGeometry(cat,`${cat.userData.breed} wearing ${piece.id}`);
  for(const g of dress.geometries)assert.ok(!cat.userData.ownedGeometries.has(g),`${piece.id} reuses the cat's own geometry`);
  animateOutfit(cat,1.7);animateOutfit(cat,4.2);
  finiteGeometry(cat,`${cat.userData.breed} animating ${piece.id}`);
 }
 // A full eight-slot outfit on one cat still only holds one piece per slot.
 const full=Object.fromEntries(SLOTS.map(s=>[s.id,WARDROBE.find(w=>w.slot===s.id).id]));
 dressCat(cats[0],full);assert.deepEqual(cats[0].userData.outfit,full);
 finiteGeometry(cats[0],'full outfit');
});

test('neck accessories hug the chest and do not lift away when the cat turns its head',()=>{
 const point=new THREE.Vector3(),local=new THREE.Vector3(),closest=new THREE.Vector3(),triangle=new THREE.Triangle();
 for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed,{},{lod:'low'}),{body,head,anchors}=cat.userData,skin=anchors.torsoGeometry.attributes.position;
  for(const piece of WARDROBE.filter(w=>w.slot==='neck')){
   head.rotation.set(0,0,0);dressCat(cat,{neck:piece.id});cat.updateMatrixWorld(true);
   const meshes=cat.userData.dress.meshes.filter(m=>m.isMesh);
   for(const mesh of meshes){
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i+=Math.max(1,Math.floor(positions.count/6))){
     local.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);body.worldToLocal(local);
     // Nearest skin distance also works on the sides, where a front-only projection overstates the gap.
     let gap=Infinity;
     for(let j=0;j<skin.count;j+=3){
      triangle.a.fromBufferAttribute(skin,j);triangle.b.fromBufferAttribute(skin,j+1);triangle.c.fromBufferAttribute(skin,j+2);
      triangle.closestPointToPoint(local,closest);gap=Math.min(gap,local.distanceTo(closest));
     }
     assert.ok(gap<.18,`${breed} ${piece.id} floats ${gap.toFixed(3)} away from the chest`);
    }
   }
   const resting=meshes.map(m=>point.fromBufferAttribute(m.geometry.attributes.position,0).applyMatrix4(m.matrixWorld).clone());
   head.rotation.set(-.55,.35,.25);cat.updateMatrixWorld(true);
   meshes.forEach((m,i)=>{
    point.fromBufferAttribute(m.geometry.attributes.position,0).applyMatrix4(m.matrixWorld);
    assert.ok(point.distanceTo(resting[i])<1e-6,`${breed} ${piece.id} lifts off the chest during a head turn`);
   });
  }
  undressCat(cat);
 }
});

test('a backpack and its straps stay over the torso instead of reaching the face or tail',()=>{
 const point=new THREE.Vector3(),origin=new THREE.Vector3(),direction=new THREE.Vector3(),ray=new THREE.Raycaster(),material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
 for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed,{back:'backpack'},{lod:'low'}),{body,anchors,dress}=cat.userData;
  cat.updateMatrixWorld(true);anchors.torsoGeometry.computeBoundingBox();
  const torso=anchors.torsoGeometry.boundingBox,bounds=new THREE.Box3();
  for(const mesh of dress.meshes.filter(m=>m.isMesh)){
   const positions=mesh.geometry.attributes.position;
   for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);body.worldToLocal(point);bounds.expandByPoint(point);}
  }
  for(const axis of ['x','z']){
   assert.ok(bounds.min[axis]>=torso.min[axis]-.12,`${breed} backpack extends too far along -${axis}`);
   assert.ok(bounds.max[axis]<=torso.max[axis]+.12,`${breed} backpack extends too far along +${axis}`);
  }
  assert.ok(bounds.min.y>=torso.min.y-.08,`${breed} backpack straps hang below the belly`);
  const surface=new THREE.Mesh(anchors.torsoGeometry,material),pouch=dress.meshes.find(m=>m.geometry instanceof THREE.BoxGeometry);
  pouch.geometry.computeBoundingBox();point.set(0,pouch.geometry.boundingBox.min.y,0).applyMatrix4(pouch.matrixWorld);body.worldToLocal(point);
  ray.set(origin.set(point.x,torso.max.y+1,point.z),direction.set(0,-1,0));
  const support=ray.intersectObject(surface,false)[0],clearance=point.y-support.point.y;
  assert.ok(clearance>=.025&&clearance<=.08,`${breed} pouch embeds in or floats above the back: ${clearance}`);
  for(const strap of dress.meshes.filter(m=>m.parent===body&&m.geometry instanceof THREE.TubeGeometry)){
   for(let i=1;i<10;i++){
    strap.geometry.parameters.path.getPoint(i/10,point).applyMatrix4(strap.matrixWorld);body.worldToLocal(point);
    ray.set(origin.set(0,0,0),direction.copy(point).normalize());
    const skin=ray.intersectObject(surface,false).at(-1),gap=point.length()-skin.distance;
    assert.ok(gap>=.035&&gap<=.09,`${breed} strap leaves the torso surface: ${gap}`);
   }
  }
  undressCat(cat);
 }
 material.dispose();
});

test('changing clothes disposes the old pieces and leaves the cat itself intact',()=>{
 const cat=createCat('ragdoll',{},{lod:'low'});
 dressCat(cat,{head:'crown-gold',back:'wings-angel',feet:'sneakers'});
 const old=cat.userData.dress,geometries=[...old.geometries],materials=[...old.materials.values()],meshes=[...old.meshes];
 assert.ok(geometries.length>2&&materials.length>0);
 let geometryDisposed=0,materialDisposed=0;
 for(const g of geometries){const inner=g.dispose.bind(g);g.dispose=()=>{geometryDisposed++;inner();};}
 for(const m of materials){const inner=m.dispose.bind(m);m.dispose=()=>{materialDisposed++;inner();};}
 dressCat(cat,{head:'beanie'});
 assert.equal(geometryDisposed,geometries.length);
 assert.equal(materialDisposed,materials.length);
 for(const m of meshes)assert.equal(m.parent,null,'old clothes still hanging on the rig');
 assert.notEqual(cat.userData.dress,old);
 for(const g of geometries)assert.ok(!cat.userData.dress.geometries.has(g));
 for(const g of cat.userData.ownedGeometries)assert.ok(g.attributes.position?.count>0,'the cat lost its own geometry');
 poseLegs(cat,.3,.4,.12);assert.ok(Number.isFinite(cat.userData.legs[0].rotation.x));
 undressCat(cat);assert.equal(cat.userData.dress,null);
 undressCat(cat);
 for(const g of cat.userData.ownedGeometries)assert.ok(g.attributes.position?.count>0);
});

test('closed helmets tuck the ears away and taking them off brings them back',()=>{
 for(const breed of ['calico','fold','sphynx']){
  const cat=createCat(breed,{head:'astronaut'},{lod:'low'});
  assert.deepEqual(cat.userData.ears.map(e=>e.visible),[false,false],`${breed} helmet`);
  dressCat(cat,{head:'beanie'});
  assert.deepEqual(cat.userData.ears.map(e=>e.visible),[false,false],`${breed} beanie`);
  dressCat(cat,{head:'crown-gold',neck:'bell-red'});
  assert.deepEqual(cat.userData.ears.map(e=>e.visible),[true,true],`${breed} crown`);
  dressCat(cat,{head:'astronaut'});undressCat(cat);
  assert.deepEqual(cat.userData.ears.map(e=>e.visible),[true,true],`${breed} undressed`);
 }
});

const fakeStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
test('restart creates a clean unadopted game and restores the exact previous progression',()=>{
 const storage=fakeStorage(),old={...freshState(),adopted:true,name:'团子',bond:73,hearts:28,collection:['leaf'],ownedFurniture:['box','bed'],outfit:{head:'crown-gold'},roomTheme:{wall:'night',floor:'cherry'}};
 const fresh=restartGame(storage,old);assert.equal(fresh.adopted,false);assert.equal(fresh.bond,0);assert.equal(fresh.hearts,6);assert.deepEqual(fresh.collection,[]);assert.deepEqual(fresh.outfit,{});assert.ok(storage.getItem(BACKUP_KEY));
 const restored=restoreGame(storage);assert.equal(restored.name,'团子');assert.equal(restored.bond,73);assert.equal(restored.hearts,28);assert.deepEqual(restored.collection,['leaf']);assert.deepEqual(restored.outfit,{head:'crown-gold'});assert.deepEqual(restored.roomTheme,{wall:'night',floor:'cherry'});assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).adopted,true);
});
test('restart cannot overwrite active save if the backup write fails',()=>{
 let writes=0;const storage={setItem:()=>{writes++;throw new Error('quota');}};
 assert.throws(()=>restartGame(storage,{...freshState(),adopted:true}));assert.equal(writes,1);
});

test('navigation routes around furniture and keeps every traversed segment clear',async()=>{
 const {route,clearSegment}=await import('../src/navigation.js');const obstacles=[{x:0,z:0,w:1.2,d:1.4}],start={x:-2,z:0},target={x:2,z:0};const path=route(start,target,obstacles,undefined,.38);assert.ok(path.length>1);let previous=start;for(const p of path){assert.ok(clearSegment(previous,p,obstacles,.38));previous=p;}assert.ok(Math.hypot(previous.x-target.x,previous.z-target.z)<.05);
});
test('navigation chooses a clear approach when the requested point is inside furniture',async()=>{
 const {route,blocked}=await import('../src/navigation.js');const obstacles=[{type:'circle',x:1,z:1,r:.65}],path=route({x:-1,z:1},{x:1,z:1},obstacles,undefined,.38);assert.ok(path.length);assert.ok(!blocked(path.at(-1).x,path.at(-1).z,obstacles,.38));
});

test('placement radii come straight from the furniture catalogue',async()=>{
 const {furnitureRadius}=await import('../src/furniture-layout.js');
 for(const f of FURNITURE)assert.equal(furnitureRadius(f.id),f.r,f.id);
 const unknown=furnitureRadius('not-a-thing');
 assert.ok(Number.isFinite(unknown)&&unknown>=0,`unknown types need a usable radius, got ${unknown}`);
});

test('two copies of one type are told apart by uid when checking a spot',async()=>{
 const {validPlacement}=await import('../src/furniture-layout.js');
 const a={uid:'box-1',id:'box',x:-2,z:1.2,rotation:0},b={uid:'box-2',id:'box',x:2,z:1.2,rotation:0},cat={x:0,z:-1};
 const items=[a,b];
 assert.ok(validPlacement(a,items,cat),'a piece must not collide with itself');
 assert.ok(validPlacement(b,items,cat));
 assert.ok(!validPlacement({...b,x:a.x+.2},items,cat),'overlapping copies should be rejected');
 assert.ok(!validPlacement({...a,x:cat.x,z:cat.z},items,cat),'must not drop furniture onto the cat');
 assert.ok(!validPlacement({...a,x:14,z:0},items,cat),'must stay inside the room');
 const rug=FURNITURE.find(f=>f.r===0);
 assert.ok(validPlacement({uid:'rug-1',id:rug.id,x:a.x,z:a.z},items,cat),'walk-over rugs can go anywhere');
});

test('the lamp corner is reserved so furniture never grows into it',async()=>{
 const {validPlacement,ROOM_OBSTACLES}=await import('../src/furniture-layout.js');
 const {blocked}=await import('../src/navigation.js');
 assert.ok(ROOM_OBSTACLES.some(o=>Math.abs(o.x+3.85)<.01&&Math.abs(o.z+1.7)<.01),'no lamp obstacle at (-3.85,-1.7)');
 assert.ok(blocked(-3.85,-1.7,ROOM_OBSTACLES,.1),'the lamp corner should read as occupied');
 assert.ok(!blocked(0,1.2,ROOM_OBSTACLES,.1),'the middle of the floor should stay free');
 assert.ok(!validPlacement({uid:'bed-1',id:'bed',x:-3.85,z:-1.7,rotation:0},[],null));
});

test('old crowded furniture layouts are separated from each other and the cat spawn',async()=>{
 const {fitFurniture,validPlacement}=await import('../src/furniture-layout.js');
 const items=fitFurniture(['box','bed','tower','toy','rug','cushion','table'].map((id,i)=>({uid:`${id}-${i}`,id,x:0,z:.55,rotation:0})));
 assert.equal(items.length,7);
 for(const item of items){assert.ok(FURNITURE_BY_ID.has(item.id));assert.ok(validPlacement(item,items,{x:0,z:1.65}),item.id);}
});

test('each species reads as itself: ears, tails, snouts, spikes and hopping',async()=>{
 const {BREEDS}=await import('../src/state.js');
 for(const b of BREEDS)assert.ok(CAT_PROFILES[b.id],`no model for ${b.id}`);
 const size=(o)=>new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
 const cat=createCat('calico'),lop=createCat('lop'),dwarf=createCat('dwarf'),dog=createCat('shiba'),hog=createCat('hedgehog');
 assert.ok(size(dwarf.userData.ears[0]).y>size(cat.userData.ears[0]).y*1.4,'rabbit ears should be long');
 assert.ok(lop.userData.ears[0].children[0].position.y<0,'lop ears hang down');
 const tip=c=>c.userData.anchors.noseZ;assert.ok(tip(dog)>tip(cat)+.05,'dogs need a snout');
 assert.equal(dwarf.userData.hop,true);assert.deepEqual(dwarf.userData.gaitOffsets,[0,0,.5,.5]);assert.equal(cat.userData.hop,false);
 assert.equal(hog.userData.spikes.length,2);assert.ok(hog.userData.spikes.every(m=>m.count>20));
 dressCat(hog,{top:'hoodie'});assert.ok(!hog.getObjectByName('back-spikes').visible,'spikes hide under a top');
 undressCat(hog);assert.ok(hog.getObjectByName('back-spikes').visible);
 for(const id of ['goldenretriever','glider','ferret'])finiteGeometry(createCat(id,{head:'crown-gold',top:'stripe-tee',feet:'sneakers',tail:'tailbow'}),id);
});
