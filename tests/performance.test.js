import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSaveScheduler,qualitySettings,loadQuality,saveQuality} from '../src/performance.js';
import {CatWorld} from '../src/world.js';

test('drag saves coalesce and flush final live state on a boundary',()=>{
 let value=0,id=0;const calls=[],timers=new Map();
 const saver=createSaveScheduler(()=>calls.push(value),{setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)});
 for(let i=1;i<=50;i++){value=i;saver.schedule();}
 assert.equal(timers.size,1);assert.deepEqual(calls,[]);assert.equal(saver.pending,true);
 saver.flush();saver.flush();assert.deepEqual(calls,[50]);assert.equal(timers.size,0);assert.equal(saver.pending,false);
 value=51;saver.schedule();timers.values().next().value();assert.deepEqual(calls,[50,51]);
});
test('quality is bounded and storage denial does not break startup',()=>{
 assert.deepEqual(qualitySettings('low',3),{pixelRatio:1,shadowSize:512});
 assert.equal(qualitySettings('standard',3).pixelRatio,2);
 assert.equal(loadQuality(()=>{throw new Error('denied');}),'standard');
 assert.equal(saveQuality('low',()=>{throw new Error('denied');}),false);
 const db={value:null,getItem(){return this.value;},setItem(k,v){this.value=v;}};
 assert.equal(saveQuality('low',()=>db),true);assert.equal(loadQuality(()=>db),'low');
 db.value='tampered';assert.equal(loadQuality(()=>db),'standard');
});
test('scene factories build each environment once and tv reuses home',()=>{
 const world={environments:{home:{}},built:0,buildBath(){this.built++;this.environments.bath={};}};
 for(const name of ['home','tv','bath','bath'])CatWorld.prototype.ensureEnvironment.call(world,name);
 assert.equal(world.built,1);assert.throws(()=>CatWorld.prototype.ensureEnvironment.call(world,'unknown'));
});
test('cancelling drops a queued save so a replaced game is never overwritten',()=>{
 const disk={value:'old'};let live='old',id=0;const timers=new Map();
 const saver=createSaveScheduler(()=>{disk.value=live;},{setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)});
 saver.schedule();
 disk.value='fresh';saver.cancel();saver.flush();live='fresh';
 assert.equal(disk.value,'fresh');assert.equal(timers.size,0);assert.equal(saver.pending,false);
});
