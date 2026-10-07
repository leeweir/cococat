import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,freshState} from '../src/state.js';
import {BACKUP_KEY,RECOVERY_KEY,MAX_IMPORT_BYTES,loadGame,parseSave,exportGame,replaceGame,restartGame,restoreGame} from '../src/save-manager.js';
const storage=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
const pet=()=>({...freshState(),adopted:true,name:'团子',hearts:23,bond:51,outfit:{head:'beanie'}});

test('exports round-trip and plain v1-v3 saves still import',()=>{
 const s=pet(),result=parseSave(exportGame(s));
 for(const key of ['adopted','name','hearts','bond','outfit'])assert.deepEqual(result[key],s[key]);
 for(const version of [1,2,3])assert.equal(parseSave(JSON.stringify({...s,version})).adopted,true);
});
test('invalid, future and oversized imports are rejected instead of reset',()=>{
 for(const text of ['{','null','[]','{}',JSON.stringify({version:4,adopted:true}),JSON.stringify({version:3,adopted:'yes'}),JSON.stringify({...pet(),hearts:'many'}),JSON.stringify({...pet(),memories:{}}),' '.repeat(MAX_IMPORT_BYTES+1)])assert.throws(()=>parseSave(text));
});
test('loading corrupt or inaccessible storage does not write over it',()=>{
 const db=storage();db.setItem(SAVE_KEY,'{broken');
 const result=loadGame(()=>db);assert.ok(result.error);assert.equal(result.state.adopted,false);assert.equal(db.getItem(SAVE_KEY),'{broken');
 assert.ok(loadGame(()=>{throw new Error('denied');}).error);
 assert.equal(loadGame(()=>storage()).error,null);
});
test('replacement first backs up the current pet and allows recovery',()=>{
 const db=storage(),s=pet(),incoming={...pet(),name:'新朋友'};db.setItem(SAVE_KEY,JSON.stringify(s));
 assert.equal(replaceGame(db,s,incoming),incoming);
 assert.equal(JSON.parse(db.getItem(SAVE_KEY)).name,'新朋友');
 assert.equal(JSON.parse(db.getItem(BACKUP_KEY)).name,'团子');
 assert.equal(restoreGame(db).name,'团子');
});
test('backup or active-write failure leaves the active save unchanged',()=>{
 for(const failKey of [BACKUP_KEY,SAVE_KEY]){
  const db=storage(),s=pet(),old=JSON.stringify(s);db.setItem(SAVE_KEY,old);const write=db.setItem;
  db.setItem=(key,value)=>{if(key===failKey)throw new Error('quota');write(key,value);};
  assert.throws(()=>replaceGame(db,s,{...s,name:'新朋友'}));assert.equal(db.getItem(SAVE_KEY),old);
 }
});
test('explicit restart archives unreadable raw data before overwriting',()=>{
 const db=storage();db.setItem(SAVE_KEY,'{broken');restartGame(db,freshState());
 assert.equal(db.getItem(RECOVERY_KEY),'{broken');assert.equal(JSON.parse(db.getItem(SAVE_KEY)).adopted,false);
});
