import {test} from 'node:test';
import assert from 'node:assert/strict';
import {THREE,ball,box,group,sign,makeCat,disposeCat} from '../src/world.js';
import {LivingWorld} from '../src/living-world.js';

function materialResources(materials){
 const resources=new Set(materials);
 for(const material of materials)for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
 return resources;
}
function catResources(cat){
 const {ownedGeometries,ownedMaterials,dress}=cat.userData;
 return new Set([...ownedGeometries,...materialResources(ownedMaterials),...dress.geometries,...materialResources([...dress.materials.values()])]);
}
function meshResources(root){
 const resources=new Set();
 root.traverse(o=>{if(o.isMesh){resources.add(o.geometry);for(const resource of materialResources(Array.isArray(o.material)?o.material:[o.material]))resources.add(resource);}});
 return resources;
}
function trackDisposals(t,resources){
 const counts=new Map();
 for(const resource of new Set(resources)){
  counts.set(resource,0);
  const onDispose=()=>counts.set(resource,counts.get(resource)+1);
  resource.addEventListener('dispose',onDispose);
  t.after(()=>resource.removeEventListener('dispose',onDispose));
 }
 return counts;
}
function assertDisposals(counts,expected){
 assert.ok(counts.size>0,'must observe resources');
 for(const [resource,count]of counts)assert.equal(count,expected,`${resource.type||'Texture'} ${resource.uuid} dispose count`);
}

for(const nested of [false,true])test(`disposeCat disposes all owned resources of a ${nested?'nested':'direct'} low-LOD cat exactly once`,t=>{
 const cat=makeCat('orange',{},{lod:'low'}),root=new THREE.Group();
 root.add(cat);
 const resources=catResources(cat),counts=trackDisposals(t,resources);
 const attached=meshResources(cat);
 assert.ok([...cat.userData.ownedMaterials].some(material=>!attached.has(material)),'registry includes replaced materials');
 assert.equal([...resources].filter(resource=>resource.isTexture).length,1,'the per-cat texture shared by both eyes is observed');
 disposeCat(nested?root:cat);
 assertDisposals(counts,1);
 assert.equal(cat.userData.dress,null);
 disposeCat(root);disposeCat(cat);disposeCat(root);
 assertDisposals(counts,1);
 t.diagnostic(`${cat.userData.ownedMaterials.size} cat materials and ${resources.size} total owned resources disposed exactly once`);
});

test('disposeCat discovers nested dressed owners before detaching clothes and deduplicates their resources',t=>{
 const root=new THREE.Group(),cat=makeCat('orange',{head:'beanie',neck:'bow-berry',feet:'sneakers',tail:'tailbow'},{lod:'low'});
 const inner=makeCat('blue','bow',{lod:'low'}),dress=cat.userData.dress,innerDress=inner.userData.dress;
 group(root).add(cat);
 // A descendant of an outfit branch must not be skipped when the clothes are detached.
 const branch=dress.meshes.find(mesh=>mesh.isGroup);assert.ok(branch);branch.add(inner);
 assert.ok(cat.userData.ears.every(ear=>!ear.visible));
 const clothMaterial=dress.materials.values().next().value;
 const eyeTexture=[...cat.userData.ownedMaterials].find(material=>material.map)?.map;
 clothMaterial.map=eyeTexture;clothMaterial.normalMap=eyeTexture;
 dress.materials.set('duplicate-material',clothMaterial);
 cat.userData.ownedMaterials.add(clothMaterial);
 cat.userData.ownedGeometries.add(dress.geometries.values().next().value);
 const counts=trackDisposals(t,[...catResources(cat),...catResources(inner)]);
 disposeCat(root);
 assertDisposals(counts,1);
 for(const owner of [cat,inner])assert.equal(owner.userData.dress,null);
 for(const mesh of [...dress.meshes,...innerDress.meshes])assert.equal(mesh.parent,null);
 assert.ok(cat.userData.ears.every(ear=>ear.visible));
 disposeCat(cat);disposeCat(inner);disposeCat(root);
 assertDisposals(counts,1);
});

test('disposeCat releases per-instance prop geometry, material arrays and all texture slots only once',t=>{
 const root=new THREE.Group(),geometry=new THREE.BoxGeometry(),texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1),normal=new THREE.Texture();
 const basic=new THREE.MeshBasicMaterial({map:texture}),standard=new THREE.MeshStandardMaterial({map:texture,normalMap:normal,roughnessMap:texture});
 standard.userData.own=true;
 const unflagged=new THREE.MeshPhysicalMaterial({emissiveMap:texture});
 const first=new THREE.Mesh(geometry,[basic,standard,basic,unflagged]);root.add(first);
 group(root).add(new THREE.Mesh(geometry,standard));
 const counts=trackDisposals(t,[geometry,basic,standard,unflagged,texture,normal]);
 disposeCat(root);assertDisposals(counts,1);
 disposeCat(first);disposeCat(root);assertDisposals(counts,1);
});

test('disposeCat preserves shared sphere, colour-cache materials and grain maps even on owned clones',t=>{
 const root=new THREE.Group(),survivor=new THREE.Group();
 const sphere=ball(root,0xc99f72,[0,0,0],[1,1,1],true),other=ball(survivor,0xc99f72,[0,0,0],[1,1,1]);
 const wood=box(root,0xc99f72,[0,0,0],[1,1,1]);
 assert.equal(sphere.geometry,other.geometry);assert.equal(sphere.material,other.material);
 wood.material=wood.material.clone();wood.material.userData.own=true;
 const privateTexture=new THREE.Texture();wood.material.normalMap=privateTexture;
 assert.equal(wood.material.map,sphere.material.map);assert.equal(wood.material.bumpMap,sphere.material.map);
 const shared=new Set([sphere.geometry,...materialResources([sphere.material])]);
 const sharedCounts=trackDisposals(t,shared);
 const ownedCounts=trackDisposals(t,[wood.geometry,wood.material,privateTexture,sphere.children[0].material]);
 // Cache identity wins over duplicate/erroneous ownership references.
 root.userData.ownedGeometries=new Set([sphere.geometry]);root.userData.ownedMaterials=new Set([sphere.material]);
 disposeCat(root);disposeCat(wood);disposeCat(sphere);disposeCat(root);
 assertDisposals(ownedCounts,1);assertDisposals(sharedCounts,0);
 const reused=ball(survivor,0xc99f72,[0,0,0],[1,1,1]);
 assert.equal(reused.geometry,other.geometry);assert.equal(reused.material,other.material);
 disposeCat(survivor);assertDisposals(sharedCounts,0);
});

test('disposeCat releases sign canvas textures along with their prop material and geometry',t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})}});
 const root=new THREE.Group();
 try{sign(root,'资源测试',[0,0,0]);}
 finally{if(previous)Object.defineProperty(globalThis,'document',previous);else delete globalThis.document;}
 const counts=trackDisposals(t,meshResources(root));
 assert.equal([...counts.keys()].filter(resource=>resource.isCanvasTexture).length,1);
 disposeCat(root);disposeCat(root);assertDisposals(counts,1);
});

test('setupExploration replacement and clearExploration release nested friends without disposing shared props',t=>{
 // Exercise cleanup without constructing a renderer, DOM or the main game loop.
 const world=Object.create(LivingWorld.prototype);world.scene=new THREE.Scene();
 const probes=new THREE.Group();
 for(const color of [0xa9b88f,0xf6d986,0xd7b084])ball(probes,color,[0,0,0],[1,1,1]);
 const shared=meshResources(probes),sharedCounts=trackDisposals(t,shared),retired=[];
 let previous=null;
 world.clearExploration();
 for(const [region,breed]of [['park','orange'],['garden','blue'],['street','ragdoll']]){
  const outing={region,spots:[{id:'one',x:0,z:0},{id:'two',x:1,z:1}]};
  world.setupExploration(outing);
  if(previous){assert.equal(previous.trail.parent,null);assert.equal(previous.friend.userData.dress,null);assertDisposals(previous.counts,1);retired.push(previous);}
  assert.equal(world.scene.children.length,1);assert.equal(world.trail.parent,world.scene);
  assert.equal(world.outing,outing);assert.equal(world.friend.userData.breed,breed);
  assert.deepEqual(world.friend.userData.outfit,{neck:'bow-berry'});
  assert.equal(world.eventProp.parent,world.trail);
  const resources=new Set([...meshResources(world.trail),...catResources(world.friend)]);
  const counts=trackDisposals(t,[...resources].filter(resource=>!shared.has(resource)));
  assertDisposals(counts,0);assertDisposals(sharedCounts,0);
  previous={trail:world.trail,friend:world.friend,counts};
 }
 world.clearExploration();world.clearExploration();
 assert.equal(world.scene.children.length,0);
 for(const key of ['trail','friend','eventProp','outing'])assert.equal(world[key],null,key);
 assert.equal(previous.trail.parent,null);assert.equal(previous.friend.userData.dress,null);
 for(const entry of [...retired,previous]){disposeCat(entry.trail);disposeCat(entry.friend);assertDisposals(entry.counts,1);}
 assertDisposals(sharedCounts,0);
});
