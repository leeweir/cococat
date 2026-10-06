import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SLOTS,WARDROBE,WARDROBE_BY_ID,SLOT_QUIPS,normalizeOutfit,wearItem,randomOutfit} from '../src/wardrobe.js';
const text=v=>typeof v==='string'&&v.trim().length>0;
const lcg=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('a hundred unique pieces spread across eight named slots',()=>{
 assert.equal(WARDROBE.length,100);
 assert.equal(new Set(WARDROBE.map(w=>w.id)).size,100);
 assert.equal(WARDROBE_BY_ID.size,100);
 assert.equal(SLOTS.length,8);
 assert.equal(new Set(SLOTS.map(s=>s.id)).size,8);
 const slots=new Set(SLOTS.map(s=>s.id));
 for(const s of SLOTS){
  for(const k of ['id','name','icon'])assert.ok(text(s[k]),`slot ${s.id} missing ${k}`);
  const pool=WARDROBE.filter(w=>w.slot===s.id);
  assert.ok(pool.length>=8,`slot ${s.id} only has ${pool.length} pieces`);
  assert.ok(Array.isArray(SLOT_QUIPS[s.id])&&SLOT_QUIPS[s.id].length===3&&SLOT_QUIPS[s.id].every(text),`slot ${s.id} quips`);
 }
 assert.equal(Object.keys(SLOT_QUIPS).length,8);
 for(const w of WARDROBE){
  assert.ok(slots.has(w.slot),`${w.id} unknown slot ${w.slot}`);
  for(const k of ['id','name','icon','kind'])assert.ok(text(w[k]),`${w.id} missing ${k}`);
  assert.ok(Array.isArray(w.c)&&w.c.length>0,`${w.id} colours`);
  for(const c of w.c)assert.match(c,/^#[0-9a-f]{3,8}$/i,`${w.id} colour ${c}`);
  assert.equal(WARDROBE_BY_ID.get(w.id),w);
 }
});

test('wearing a piece toggles it off again and replaces whatever shared its slot',()=>{
 let o=wearItem({},'crown-gold');assert.deepEqual(o,{head:'crown-gold'});
 o=wearItem(o,'beanie');assert.deepEqual(o,{head:'beanie'});
 o=wearItem(o,'bow-berry');assert.deepEqual(o,{head:'beanie',neck:'bow-berry'});
 o=wearItem(o,'beanie');assert.deepEqual(o,{neck:'bow-berry'});
 o=wearItem(o,'bow-berry');assert.deepEqual(o,{});
 assert.deepEqual(wearItem({neck:'bow-berry'},'not-a-thing'),{neck:'bow-berry'});
 assert.deepEqual(wearItem({neck:'crown-gold'},'cape'),{back:'cape'});
 const base={head:'crown-gold'};wearItem(base,'beanie');assert.deepEqual(base,{head:'crown-gold'});
 for(const w of WARDROBE){const worn=wearItem({},w.id);assert.deepEqual(worn,{[w.slot]:w.id},w.id);assert.deepEqual(wearItem(worn,w.id),{},w.id);}
});

test('a random outfit is always wearable and never empty',()=>{
 const slots=new Set(SLOTS.map(s=>s.id));const used=new Set();
 for(let seed=1;seed<=400;seed++){
  const o=randomOutfit(lcg(seed)),keys=Object.keys(o);
  assert.ok(keys.length>0,`seed ${seed} gave nothing`);
  for(const k of keys){assert.ok(slots.has(k),`seed ${seed} bad slot ${k}`);assert.equal(WARDROBE_BY_ID.get(o[k])?.slot,k,`seed ${seed} ${o[k]} in ${k}`);used.add(o[k]);}
  assert.deepEqual(normalizeOutfit(o),o,`seed ${seed} did not survive normalising`);
 }
 assert.ok(used.size>80,`only ${used.size} pieces ever rolled`);
 assert.ok(Object.keys(randomOutfit(()=>1)).length>0,'all-skip fallback');
});

test('legacy costume names and junk both normalise to a clean slot map',()=>{
 assert.deepEqual(normalizeOutfit('none'),{});
 assert.deepEqual(normalizeOutfit('bow'),{neck:'bow-berry'});
 assert.deepEqual(normalizeOutfit('sailor'),{neck:'bow-berry',top:'sailor'});
 assert.deepEqual(normalizeOutfit('cape'),{head:'wizard',back:'cape'});
 assert.deepEqual(normalizeOutfit('crown'),{head:'crown-gold'});
 for(const junk of [undefined,null,'','bogus',7,[],['crown-gold'],{head:'sailor'},{feet:'crown-gold'},{nose:'crown-gold'},{head:undefined}])assert.deepEqual(normalizeOutfit(junk),{},JSON.stringify(junk));
 const full=Object.fromEntries(SLOTS.map(s=>[s.id,WARDROBE.find(w=>w.slot===s.id).id]));
 assert.deepEqual(normalizeOutfit(full),full);
 assert.deepEqual(normalizeOutfit(normalizeOutfit(full)),full);
});
