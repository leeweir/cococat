import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,applyAction,normalizeSave,BREEDS,FAVORITES,PERSONALITIES,INGREDIENTS,reward,purchase,ownsFurniture,placeFurniture,newFurnitureUid,removeFurniture,serveRecipe,makeOuting,collectTreasure,bondLevel,REGIONS,TREASURES,FURNITURE,FURNITURE_BY_ID,MAX_FURNITURE,WALL_THEMES,FLOOR_THEMES,FLOOR_LIMITS} from '../src/state.js';
const text=v=>typeof v==='string'&&v.trim().length>0;
const clone=s=>JSON.parse(JSON.stringify(s));

test('twenty adoptable breeds each carry a full personality card',()=>{
 assert.equal(BREEDS.length,20);
 assert.equal(new Set(BREEDS.map(b=>b.id)).size,20);
 assert.equal(new Set(BREEDS.map(b=>b.color)).size,20);
 assert.equal(new Set(BREEDS.map(b=>b.name)).size,20);
 const foods=INGREDIENTS.map(i=>i.id);
 for(const b of BREEDS){
  for(const k of ['id','name','tag','description','quote','personality'])assert.ok(text(b[k]),`${b.id} missing ${k}`);
  assert.match(b.color,/^#[0-9a-f]{6}$/i,`${b.id} colour`);
  assert.ok(foods.includes(b.favorite),`${b.id} favourite ${b.favorite} is not an ingredient`);
  assert.ok(Array.isArray(b.activities)&&b.activities.length>=3&&b.activities.every(text),`${b.id} activities`);
  assert.ok(Number.isFinite(b.voice)&&b.voice>.5&&b.voice<2,`${b.id} voice ${b.voice}`);
  assert.equal(FAVORITES[b.id],b.favorite);
  assert.equal(PERSONALITIES[b.id].name,b.personality);
  assert.deepEqual(PERSONALITIES[b.id].activities,b.activities);
 }
 assert.equal(Object.keys(FAVORITES).length,20);assert.equal(Object.keys(PERSONALITIES).length,20);
});

test('the furniture catalogue is well formed and free pieces need no purchase',()=>{
 assert.equal(FURNITURE.length,23);assert.equal(new Set(FURNITURE.map(f=>f.id)).size,23);assert.equal(FURNITURE_BY_ID.size,23);
 const behaviors=new Set(['box','sleep','tower','roll','toy','paw','sniff','watch']),s=freshState();
 for(const f of FURNITURE){
  for(const k of ['id','name','icon','hint'])assert.ok(text(f[k]),`${f.id} missing ${k}`);
  assert.ok(behaviors.has(f.behavior),`${f.id} behaviour ${f.behavior}`);
  for(const k of ['cost','r','h','perch','approach'])assert.ok(Number.isFinite(f[k])&&f[k]>=0,`${f.id} ${k}`);
  assert.equal(ownsFurniture(s,f.id),f.cost===0,`${f.id} ownership at start`);
 }
 assert.ok(FURNITURE.some(f=>f.r===0),'at least one walk-over rug');
 assert.equal(ownsFurniture(s,'nope'),false);
 assert.equal(WALL_THEMES.length>=5&&FLOOR_THEMES.length>=4,true);
 for(const t of WALL_THEMES)assert.match(t.color,/^#[0-9a-f]{6}$/i);
 for(const t of FLOOR_THEMES){assert.equal(t.colors.length,2);for(const c of t.colors)assert.match(c,/^#[0-9a-f]{6}$/i);}
});

test('a v1 save keeps its cat and promotes the single outfit id to a head piece',()=>{
 const s=normalizeSave({version:1,adopted:true,breed:'blue',name:'团子',outfit:'crown',hearts:13,bond:40,fullness:82,clean:98,mood:97,memories:['first']});
 assert.equal(s.version,3);assert.equal(s.adopted,true);assert.equal(s.breed,'blue');assert.equal(s.name,'团子');
 assert.deepEqual(s.outfit,{head:'crown-gold'});
 assert.equal(s.hearts,13);assert.equal(s.bond,40);assert.deepEqual(s.memories,['first']);
 assert.deepEqual(s.furniture,[{uid:'box',id:'box',x:2.45,z:1.25,rotation:0}]);
 assert.deepEqual(s.roomTheme,{wall:'cream',floor:'oak'});
});

test('a v2 save spreads its old costume across the matching new slots',()=>{
 assert.deepEqual(normalizeSave({version:2,outfit:'sailor'}).outfit,{neck:'bow-berry',top:'sailor'});
 assert.deepEqual(normalizeSave({version:2,outfit:'cape'}).outfit,{head:'wizard',back:'cape'});
 assert.deepEqual(normalizeSave({version:2,outfit:'bow'}).outfit,{neck:'bow-berry'});
 assert.deepEqual(normalizeSave({version:1,outfit:'none'}).outfit,{});
 assert.deepEqual(normalizeSave({version:1,outfit:'bogus'}).outfit,{});
});

test('a v3 outfit drops unknown ids and pieces worn in the wrong slot',()=>{
 const s=normalizeSave({version:3,outfit:{head:'sailor',top:'crown-gold',neck:'bow-berry',face:'not-a-thing',bottom:null,feet:'socks-rainbow',nose:'crown-gold'}});
 assert.deepEqual(s.outfit,{neck:'bow-berry',feet:'socks-rainbow'});
 assert.deepEqual(normalizeSave({version:3,outfit:['crown-gold']}).outfit,{});
 assert.deepEqual(normalizeSave({version:3,outfit:42}).outfit,{});
 assert.deepEqual(normalizeSave({version:3}).outfit,{});
});

test('corrupt, empty and future saves fall back to a fresh unadopted cottage',()=>{
 for(const data of [null,undefined,{},{version:4,adopted:true,name:'团子',hearts:99},{version:'3',adopted:true}]){
  const s=normalizeSave(data);assert.equal(s.adopted,false);assert.equal(s.name,'糯米');assert.equal(s.hearts,6);assert.deepEqual(s.outfit,{});
 }
 const s=normalizeSave({version:2,adopted:true,breed:'bad',fullness:999,clean:-3,mood:'NaN',bond:-1,name:'  咪咪  ',memories:['valid',2],ownedFurniture:['bed','bogus','bed'],recipes:['fish+shrimp',7],collection:['leaf','fake'],friends:['park','nowhere'],discoveredFoods:['fish','rock']});
 assert.equal(s.breed,'calico');assert.equal(s.fullness,100);assert.equal(s.clean,0);assert.equal(s.mood,75);assert.equal(s.bond,0);assert.equal(s.name,'咪咪');
 assert.deepEqual(s.memories,['valid']);assert.deepEqual(s.ownedFurniture,['box','bed']);assert.deepEqual(s.recipes,['fish+shrimp']);
 assert.deepEqual(s.collection,['leaf']);assert.deepEqual(s.friends,['park']);assert.deepEqual(s.discoveredFoods,['fish']);
});

test('loaded furniture is clamped to the floor, keyed by uid and limited to what you own',()=>{
 const s=normalizeSave({version:3,ownedFurniture:['bed'],furniture:[
  {uid:'bed-1',id:'bed',x:999,z:-999,rotation:7},
  {uid:'bed-2',id:'bed',x:-999,z:999,rotation:'spin'},
  {uid:'bed-1',id:'bed',x:0,z:0},
  {id:'cushion',x:1.2,z:.4},
  {uid:'tower-1',id:'tower',x:0,z:0},
  {uid:'nope',id:'not-a-thing',x:0,z:0},
  {uid:'bad uid!',id:'lamp',x:-1,z:-1},
  null
 ]});
 assert.deepEqual(s.furniture.map(f=>f.uid),['bed-1','bed-2','cushion','lamp']);
 assert.deepEqual(s.furniture[0],{uid:'bed-1',id:'bed',x:FLOOR_LIMITS.maxX,z:FLOOR_LIMITS.minZ,rotation:7%(Math.PI*2)});
 assert.deepEqual(s.furniture[1],{uid:'bed-2',id:'bed',x:FLOOR_LIMITS.minX,z:FLOOR_LIMITS.maxZ,rotation:0});
 assert.deepEqual(s.furniture[2],{uid:'cushion',id:'cushion',x:1.2,z:.4,rotation:0});
 assert.deepEqual(s.furniture[3],{uid:'lamp',id:'lamp',x:-1,z:-1,rotation:0});
 const many=normalizeSave({version:3,furniture:Array.from({length:MAX_FURNITURE+9},(_,i)=>({uid:`cushion-${i}`,id:'cushion',x:0,z:0}))});
 assert.equal(many.furniture.length,MAX_FURNITURE);
 const pair=normalizeSave({version:3,furniture:[{uid:'box',id:'box',x:1,z:1},{uid:'box-2',id:'box',x:-1,z:1}]});
 assert.equal(pair.furniture.length,2);assert.deepEqual(pair.furniture.map(f=>f.id),['box','box']);
 const missing=normalizeSave({version:3,furniture:[{uid:'cushion-1',id:'cushion'}]});
 assert.deepEqual(missing.furniture,[{uid:'cushion-1',id:'cushion',x:0,z:1,rotation:0}]);
});

test('room themes only accept ids from the catalogue',()=>{
 assert.deepEqual(normalizeSave({version:3,roomTheme:{wall:'night',floor:'cherry'}}).roomTheme,{wall:'night',floor:'cherry'});
 assert.deepEqual(normalizeSave({version:3,roomTheme:{wall:'neon',floor:9}}).roomTheme,{wall:'cream',floor:'oak'});
 assert.deepEqual(normalizeSave({version:3,roomTheme:'dark'}).roomTheme,{wall:'cream',floor:'oak'});
});

test('care effects and memories remain correct; one completion cannot pay twice',()=>{for(const [id,stat]of [['feed','fullness'],['bath','clean'],['tv','mood'],['play','mood']]){const s=freshState(),n=applyAction(s,id,'completion');assert.ok(n[stat]>s[stat]);assert.equal(n.hearts,s.hearts+1);assert.equal(n.bond,5);assert.equal(n.memories.length,1);assert.equal(s.bond,0);assert.equal(applyAction(n,id,'completion'),n);assert.equal(applyAction(n,id,'another').memories.length,1);}});

test('purchases charge exactly once and insufficient balance changes nothing',()=>{
 let s=freshState();assert.equal(s.hearts,6);
 const fail=purchase(s,'furniture','tower');assert.equal(fail.ok,false);assert.equal(fail.state,s);assert.match(fail.reason,/还差 2 颗爱心/);
 const bought=purchase(s,'furniture','bed');assert.equal(bought.ok,true);s=bought.state;
 assert.equal(s.hearts,2);assert.ok(s.ownedFurniture.includes('bed'));
 const again=purchase(s,'furniture','bed');assert.equal(again.ok,true);assert.equal(again.state,s);
 assert.equal(purchase(s,'furniture','cushion').state,s);
 assert.equal(purchase(s,'furniture','not-a-thing').ok,false);
 assert.equal(purchase(s,'outfit','crown-gold').ok,false);
});

test('placing furniture moves a piece by uid, adds new copies and refuses locked types',()=>{
 let s=freshState();
 assert.equal(placeFurniture(s,{uid:'tower-1',id:'tower',x:1,z:1}),s);
 s=placeFurniture(s,{uid:'box',id:'box',x:1.1,z:1.4,rotation:.7});
 assert.equal(s.furniture.length,1);assert.deepEqual(s.furniture[0],{uid:'box',id:'box',x:1.1,z:1.4,rotation:.7});
 const uid=newFurnitureUid(s,'box');assert.equal(uid,'box-1');
 s=placeFurniture(s,{uid,id:'box',x:2,z:1.6,rotation:1.5});
 assert.equal(s.furniture.length,2);assert.equal(newFurnitureUid(s,'box'),'box-2');
 s=placeFurniture(s,{uid:'box',x:9,z:-9});
 assert.deepEqual(s.furniture[0],{uid:'box',id:'box',x:FLOOR_LIMITS.maxX,z:FLOOR_LIMITS.minZ,rotation:0});
 const loaded=normalizeSave(clone(s));
 assert.equal(loaded.furniture.length,2);assert.deepEqual(loaded.furniture[1],{uid:'box-1',id:'box',x:2,z:1.6,rotation:1.5});
 let full=freshState();
 for(let i=0;i<MAX_FURNITURE;i++)full=placeFurniture(full,{uid:`cushion-${i}`,id:'cushion',x:0,z:0});
 assert.equal(full.furniture.length,MAX_FURNITURE);
 assert.equal(placeFurniture(full,{uid:'cushion-99',id:'cushion',x:0,z:0}),full);
 assert.equal(placeFurniture(full,{uid:'cushion-0',id:'cushion',x:1,z:1}).furniture.length,MAX_FURNITURE);
 const gone=removeFurniture(s,'box');assert.deepEqual(gone.furniture.map(f=>f.uid),['box-1']);
 assert.equal(removeFurniture(gone,'box').furniture.length,1);
 assert.equal(removeFurniture(gone,'box-1').furniture.length,0);
 assert.equal(s.furniture.length,2);
});

test('every placed piece keeps its own uid, even when the caller never picks one',()=>{
 let s=freshState();
 for(let i=0;i<5;i++)s=placeFurniture(s,{id:'cushion',x:i*.4,z:1});
 s=placeFurniture(s,{id:'box',x:-2,z:1});
 assert.equal(s.furniture.length,7);
 assert.equal(new Set(s.furniture.map(f=>f.uid)).size,7,'uid collision would lose a piece on reload');
 assert.equal(normalizeSave(clone(s)).furniture.length,7);
 // An explicit uid that is already on the floor must not quietly overwrite the other piece either.
 const before=s.furniture.length;
 const collided=placeFurniture({...s,furniture:s.furniture.map(f=>f.uid==='cushion'?{...f,id:'bed'}:f),ownedFurniture:[...s.ownedFurniture,'bed']},{uid:'cushion-9',id:'cushion',x:0,z:0});
 assert.equal(collided.furniture.length,before+1);
 assert.equal(new Set(collided.furniture.map(f=>f.uid)).size,before+1);
});

test('recipes teach a stable breed preference and grant one extra heart; duplicate completion pays nothing',()=>{let s={...freshState(),breed:'calico',bond:28};const disliked=serveRecipe(s,['fish'],'meal-1');assert.equal(disliked.liked,false);assert.equal(disliked.state.hearts,7);const liked=serveRecipe(s,['shrimp','pumpkin'],'meal-2');assert.equal(liked.liked,true);assert.equal(liked.state.hearts,8);assert.equal(liked.state.bond,35);assert.ok(liked.state.milestones.includes(35));assert.equal(bondLevel(liked.state).name,'黏人的搭档');assert.ok(liked.state.discoveredFoods.includes('shrimp'));assert.equal(serveRecipe(liked.state,['shrimp'],'meal-2').state,liked.state);assert.equal(s.bond,28);});

test('every breed has a reachable favourite recipe',()=>{for(const b of BREEDS){const r=serveRecipe({...freshState(),breed:b.id},[b.favorite],`meal-${b.id}`);assert.equal(r.liked,true,b.id);assert.ok(r.state.memories.some(m=>m.includes('发现最爱')),b.id);}});

test('all 12 collectibles are discoverable across repeat outings in 3 maps',()=>{const seen=new Set();for(const r of REGIONS)for(let i=1;i<=4;i++){const o=makeOuting(r.id,i);assert.equal(o.spots.length,3);assert.equal(new Set(o.spots.map(s=>s.id)).size,3);o.spots.forEach(s=>seen.add(s.id));}assert.equal(seen.size,TREASURES.length);});

test('same treasure cannot be collected twice on one outing; repeat trips give smaller rewards',()=>{let s=freshState(),o=makeOuting('park',1);const id=o.spots[0].id;let r=collectTreasure(s,o,id);assert.equal(r.state.hearts,8);assert.equal(r.state.collection.length,1);assert.equal(collectTreasure(r.state,r.outing,id).state,r.state);const o2=makeOuting('park',5);r=collectTreasure(r.state,o2,id);assert.equal(r.state.hearts,9);assert.equal(r.state.collection.length,1);});

test('relationship milestones are awarded once and persist through reload',()=>{let s=freshState();s=reward(s,{id:'first',bond:80});assert.deepEqual(s.milestones,[12,35,70]);assert.equal(bondLevel(s).name,'认定的家人');const n=reward(s,{id:'next',bond:2});assert.equal(n.memories.length,3);assert.deepEqual(normalizeSave(n).milestones,[12,35,70]);});
