import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalizeSave,toggleTreasureDisplay} from '../src/state.js';
test('display only owned known treasures, max three, and toggle to remove',()=>{
 let s={...freshState(),collection:['leaf','bell','stone','shell']};
 assert.equal(toggleTreasureDisplay(s,'key'),s);assert.equal(toggleTreasureDisplay(s,'unknown'),s);
 for(const id of ['leaf','bell','stone'])s=toggleTreasureDisplay(s,id);
 assert.equal(toggleTreasureDisplay(s,'shell'),s);
 s=toggleTreasureDisplay(s,'bell');s=toggleTreasureDisplay(s,'shell');assert.deepEqual(s.displayedTreasures,['leaf','stone','shell']);
 assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(s))).displayedTreasures,s.displayedTreasures);
});
test('old and tampered saves cannot display unknown or unowned items',()=>{
 assert.deepEqual(normalizeSave({version:1,adopted:true}).displayedTreasures,[]);
 const s=normalizeSave({...freshState(),collection:['leaf'],displayedTreasures:['key','unknown','leaf','leaf']});
 assert.deepEqual(s.displayedTreasures,['leaf']);
});
