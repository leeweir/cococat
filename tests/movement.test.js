import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {LivingWorld} from '../src/living-world.js';
import {blocked} from '../src/navigation.js';

const dt=1/30,padding=.45;
const freeStep=dt*1.6*.72;
// Exercise the actual method without constructing a renderer or a scene.
function driveWorld({pos=[0,.06,0],drive=[0,1],obstacles=[],mode='free',camera=[0,3,5],target=[0,0,0]}={}){
 return {pos:new THREE.Vector3(...pos),drive:new THREE.Vector2(...drive),mode,
  camera:{position:new THREE.Vector3(...camera)},controls:{target:new THREE.Vector3(...target)},
  obstacles:()=>obstacles,navPadding:()=>padding,face:0,driveStep:0};
}
function updateDrive(world,delta=dt,time=1){
 LivingWorld.prototype.updateDrive.call(world,delta,time);
 for(const [name,value] of Object.entries({x:world.pos.x,y:world.pos.y,z:world.pos.z,face:world.face,driveStep:world.driveStep})){
  assert.ok(Number.isFinite(value),`${name} must remain finite`);
 }
}
function assertFree(world){assert.equal(blocked(world.pos.x,world.pos.z,world.obstacles(),padding*.85),false);}
function near(actual,expected){assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);}

test('updateDrive stops when the diagonal and both axis alternatives hit circular furniture',()=>{
 for(const mode of ['free','explore']){
  const world=driveWorld({pos:[.63,.06,.63],drive:[-1,1],obstacles:[{type:'circle',x:0,z:0,r:.5}],mode});
  const start=world.pos.clone();
  assertFree(world);
  for(let frame=0;frame<120;frame++){
   updateDrive(world,dt,frame*dt);
   assertFree(world);
   assert.deepEqual(world.pos,start);
   assert.equal(world.driveStep,0);
  }
  // A blocked step must not trap a later input pointing away from the furniture.
  world.drive.set(1,-1);
  updateDrive(world);
  assertFree(world);
  assert.ok(world.pos.x>start.x&&world.pos.z>start.z);
 }
});

test('updateDrive stops at all four inside corners formed by rectangular obstacles',()=>{
 for(const xSign of [-1,1])for(const zSign of [-1,1]){
  const world=driveWorld({pos:[xSign*.6,.06,zSign*.6],drive:[xSign,-zSign],obstacles:[
   {x:xSign*1.5,z:0,w:1,d:4},{x:0,z:zSign*1.5,w:4,d:1}
  ]});
  const start=world.pos.clone();
  assertFree(world);
  for(let frame=0;frame<60;frame++){
   updateDrive(world);
   assertFree(world);
   assert.deepEqual(world.pos,start);
   assert.equal(world.driveStep,0);
  }
 }
});

test('updateDrive retains valid sliding along either axis',()=>{
 for(const {pos,drive,obstacles,expected} of [
  {pos:[.6,.06,0],drive:[1,1],obstacles:[{x:1.5,z:0,w:1,d:4}],expected:[.6,.06,-freeStep/Math.SQRT2]},
  {pos:[0,.06,.6],drive:[1,-1],obstacles:[{x:0,z:1.5,w:4,d:1}],expected:[freeStep/Math.SQRT2,.06,.6]},
  {pos:[.89,.06,0],drive:[-1,1],obstacles:[{type:'circle',x:0,z:0,r:.5}],expected:[.89,.06,-freeStep/Math.SQRT2]}
 ]){
  const world=driveWorld({pos,drive,obstacles});
  assertFree(world);
  updateDrive(world);
  assertFree(world);
  world.pos.toArray().forEach((value,i)=>near(value,expected[i]));
  near(world.driveStep,freeStep/Math.SQRT2);
 }
});

test('updateDrive does not force an already overlapping position through furniture',()=>{
 const world=driveWorld({pos:[0,.06,0],obstacles:[{type:'circle',x:0,z:0,r:.5}]});
 const start=world.pos.clone();
 for(let frame=0;frame<60;frame++){
  updateDrive(world);
  assert.deepEqual(world.pos,start);
  assert.equal(world.driveStep,0);
 }
});

test('updateDrive preserves normal speed, diagonal normalization and the frame-step cap',()=>{
 for(const mode of ['free','explore'])for(const delta of [dt/2,dt,1]){
  const step=Math.min(delta,dt)*(mode==='explore'?2.2:1.6)*.72;
  for(const drive of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const world=driveWorld({drive,mode});
   updateDrive(world,delta);
   near(world.pos.x,drive[0]/Math.hypot(...drive)*step);
   near(world.pos.z,-drive[1]/Math.hypot(...drive)*step);
   near(world.driveStep,step);
   assertFree(world);
  }
 }
});

test('updateDrive remains camera-relative for rotated and translated camera targets',()=>{
 for(const {camera,target,drive,expected} of [
  {camera:[5,3,0],target:[0,0,0],drive:[0,1],expected:[-freeStep,0]},
  {camera:[5,3,0],target:[0,0,0],drive:[1,0],expected:[0,-freeStep]},
  {camera:[0,3,-5],target:[0,0,0],drive:[0,1],expected:[0,freeStep]},
  {camera:[4,3,2],target:[4,0,-3],drive:[0,1],expected:[0,-freeStep]}
 ]){
  const world=driveWorld({camera,target,drive});
  updateDrive(world);
  near(world.pos.x,expected[0]);near(world.pos.z,expected[1]);
  near(world.driveStep,freeStep);
 }
});

test('updateDrive stays finite with zero input, zero time or a directly overhead camera',()=>{
 for(const options of [{drive:[0,0]},{drive:[NaN,NaN]},{camera:[0,3,0]}]){
  const world=driveWorld(options);
  updateDrive(world);
  assert.deepEqual(world.pos.toArray(),[0,.06,0]);
  assert.equal(world.driveStep,0);
 }
 const world=driveWorld();
 updateDrive(world,0);
 assert.deepEqual(world.pos.toArray(),[0,.06,0]);
 assert.equal(world.driveStep,0);
});

test('updateDrive clamps at room and field corners without producing NaN',()=>{
 for(const {mode,x,z} of [{mode:'free',x:3.5,z:2.35},{mode:'explore',x:3.25,z:2.3}]){
  const world=driveWorld({mode,pos:[x,.06,z],drive:[1,-1]});
  updateDrive(world);
  assert.deepEqual(world.pos.toArray(),[x,.06,z]);
  assert.equal(world.driveStep,0);
 }
});

test('a spot that passes placement never traps the biggest cat, and old overlaps are stepped out',async()=>{
 const {validPlacement,bodyClearance,ROOM_OBSTACLES}=await import('../src/furniture-layout.js');
 const {FURNITURE_BY_ID}=await import('../src/state.js');
 for(const breed of ['maine','calico']){
  const pad=bodyClearance(breed),cat={x:0,z:1.65};
  for(const f of FURNITURE_BY_ID.values()){if(!f.r)continue;
   for(let x=-3.4;x<=3.4;x+=.1)for(let z=.6;z<=2.4;z+=.1){
    if(!validPlacement({uid:'p',id:f.id,x,z},[],cat,breed))continue;
    assert.ok(Math.hypot(x-cat.x,z-cat.z)>=f.r+pad,`${breed}: ${f.id} at (${x.toFixed(2)},${z.toFixed(2)}) overlaps the cat`);
   }
  }
 }
 // The reported save: a box at (1.55,1.47) with a Maine Coon spawning at (0,1.65).
 const obstacles=[...ROOM_OBSTACLES,{type:'circle',x:1.55,z:1.47,r:FURNITURE_BY_ID.get('box').r}];
 const world={pos:new THREE.Vector3(0,.06,1.65),currentScene:'home',stats:{breed:'maine'},obstacles:()=>obstacles,destination:null,waypoints:[]};
 assert.ok(blocked(0,1.65,obstacles,bodyClearance('maine')),'precondition: the old layout traps the cat');
 LivingWorld.prototype.clearSpawn.call(world);
 assert.ok(!blocked(world.pos.x,world.pos.z,obstacles,bodyClearance('maine')),'the cat must be moved to free floor');
 assert.ok(Math.hypot(world.pos.x,world.pos.z-1.65)<.5,'and only nudged, not teleported');
 const free=driveWorld({pos:world.pos.toArray(),obstacles,drive:[-1,0]});free.navPadding=()=>.95;
 const start=free.pos.clone();LivingWorld.prototype.updateDrive.call(free,1/30,1);
 assert.ok(free.pos.distanceTo(start)>0,'after recovery the cat can walk again');
});
