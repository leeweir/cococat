import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCat,CAT_PROFILES,pawStep,legAngles,poseLegs} from '../src/cat-model.js';
import {restartGame,restoreGame,BACKUP_KEY} from '../src/save-manager.js';
import {freshState,SAVE_KEY} from '../src/state.js';

test('six silhouettes each have four articulated paws and finite grounded gait',()=>{
 assert.equal(new Set(Object.values(CAT_PROFILES).map(p=>JSON.stringify([p.body,p.head,p.hip,p.ear]))).size,6);
 for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed);assert.equal(cat.userData.legs.length,4);cat.traverse(o=>{if(o.geometry)for(const [key,a] of Object.entries(o.geometry.attributes))assert.ok(a.array.every(Number.isFinite),`${breed} invalid ${key} geometry`);});
  for(const phase of [0,.12,.4,.66,.88,1]){
   poseLegs(cat,phase,.4,.12);cat.updateMatrixWorld(true);
   for(const leg of cat.userData.legs){assert.ok(Number.isFinite(leg.rotation.x));assert.ok(Number.isFinite(leg.userData.knee.rotation.x));const foot=leg.userData.ankle.getWorldPosition(cat.position.clone());assert.ok(foot.y>=-.001,`${breed} paw below floor ${foot.y}`);}
  }
 }
});
test('walk has a planted stance, raised swing and continuous stride boundary',()=>{
 for(const phase of [0,.2,.5,.63])assert.equal(pawStep(phase).y,0);
 assert.ok(pawStep(.82).y>.10);
 assert.ok(Math.abs(pawStep(.999999).z-pawStep(0).z)<.00001);
 const a=legAngles(.6,.16,.34,.34);assert.ok(Number.isFinite(a.hip+a.knee));
});
const fakeStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
test('restart creates a clean unadopted game and restores the exact previous progression',()=>{
 const storage=fakeStorage(),old={...freshState(),adopted:true,name:'团子',bond:73,hearts:28,collection:['leaf'],ownedFurniture:['box','bed']};
 const fresh=restartGame(storage,old);assert.equal(fresh.adopted,false);assert.equal(fresh.bond,0);assert.equal(fresh.hearts,6);assert.deepEqual(fresh.collection,[]);assert.ok(storage.getItem(BACKUP_KEY));
 const restored=restoreGame(storage);assert.equal(restored.name,'团子');assert.equal(restored.bond,73);assert.equal(restored.hearts,28);assert.deepEqual(restored.collection,['leaf']);assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).adopted,true);
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

test('old crowded furniture layouts are separated from each other and the cat spawn',async()=>{
 const {fitFurniture,validPlacement}=await import('../src/furniture-layout.js');const items=fitFurniture(['box','bed','tower','toy','rug'].map(id=>({id,x:0,z:.55,rotation:0})));for(const item of items)assert.ok(validPlacement(item,items,{x:0,z:1.65}),item.id);
});
