import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalizeSave} from '../src/state.js';
import {recordWish,claimWishes,normalizeDaily} from '../src/daily-wishes.js';
const day=new Date(2026,9,7,12).getTime();
test('each successful category counts once and a reward requires all three',()=>{
 let s=freshState();assert.equal(recordWish(s,'invalid',day),s);assert.equal(claimWishes(s,day),s);
 s=recordWish(s,'care',day);assert.equal(recordWish(s,'care',day),s);
 s=recordWish(recordWish(s,'play',day),'explore',day);const before=s.hearts;
 s=claimWishes(s,day);assert.equal(s.hearts,before+3);assert.equal(claimWishes(s,day),s);
 assert.deepEqual(normalizeDaily(s.dailyWishes,day).completed,['care','play','explore']);
});
test('new days reset optional progress, remember claims and never penalize missed days',()=>{
 let s=freshState();for(const kind of ['care','play','explore'])s=recordWish(s,kind,day);
 s=claimWishes(s,day);const hearts=s.hearts;
 s=recordWish(s,'care',day+7*86400000);assert.deepEqual(s.dailyWishes.completed,['care']);assert.equal(s.hearts,hearts);
 for(const kind of ['care','play','explore'])s=recordWish(s,kind,day);
 assert.equal(claimWishes(s,day),s);
});
test('old saves initialize safely and current wishes survive normalization/reload',()=>{
 const old=freshState();delete old.dailyWishes;assert.deepEqual(normalizeSave(old).dailyWishes.completed,[]);
 const current=recordWish(freshState(),'care');assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(current))).dailyWishes,current.dailyWishes);
 assert.deepEqual(normalizeDaily({completed:{},claimedDays:[null,'bad']}),normalizeDaily());
});
