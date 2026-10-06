import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PORTRAIT_ACTIONS,createPortraitSession,beginPortraitAction,finishPortraitAction} from '../src/portrait.js';

const ids=PORTRAIT_ACTIONS.map(action=>action.id);
const lcg=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('each wish round asks for three distinct playable interactions',()=>{
 for(let seed=1;seed<=50;seed++){
  const session=createPortraitSession(`round-${seed}`,lcg(seed));
  assert.equal(session.requests.length,3);
  assert.equal(new Set(session.requests).size,3);
  for(const action of session.requests)assert.ok(ids.includes(action));
 }
});

test('only the pending animation can satisfy a wish, and rapid inputs cannot replace it',()=>{
 const session=createPortraitSession('round',lcg(1));
 const wanted=session.requests[0],other=ids.find(id=>id!==wanted);
 assert.equal(finishPortraitAction(session,wanted),'ignored');
 assert.equal(beginPortraitAction(session,'unknown'),false);
 assert.equal(beginPortraitAction(session,wanted),true);
 assert.equal(beginPortraitAction(session,other),false);
 assert.equal(finishPortraitAction(session,other),'ignored');
 assert.equal(session.pending,wanted);
 assert.equal(session.count,0);
 assert.equal(finishPortraitAction(session,wanted),'progress');
 assert.equal(finishPortraitAction(session,wanted),'ignored');
 assert.equal(session.count,1);
});

test('a different interaction is still playable but does not skip the current wish',()=>{
 const session=createPortraitSession('round',lcg(2));
 const wanted=session.requests[0],other=ids.find(id=>id!==wanted);
 assert.equal(beginPortraitAction(session,other),true);
 assert.equal(finishPortraitAction(session,other),'miss');
 assert.equal(session.count,0);
 assert.equal(beginPortraitAction(session,wanted),true);
 assert.equal(finishPortraitAction(session,wanted),'progress');
 assert.equal(session.count,1);
});

test('a finished round completes only once while all interactions remain available for free play',()=>{
 const session=createPortraitSession('round',lcg(3));
 const outcomes=[];
 for(const action of session.requests){
  assert.equal(beginPortraitAction(session,action),true);
  outcomes.push(finishPortraitAction(session,action));
 }
 assert.deepEqual(outcomes,['progress','progress','complete']);
 assert.equal(session.done,true);
 assert.equal(finishPortraitAction(session,session.requests[2]),'ignored');
 for(const action of ids){
  assert.equal(beginPortraitAction(session,action),true);
  assert.equal(finishPortraitAction(session,action),'free');
 }
 assert.equal(session.count,3);
});

test('reentering starts an independent round and ignores an unfinished old animation',()=>{
 const previous=createPortraitSession('previous',lcg(4));
 beginPortraitAction(previous,previous.requests[0]);
 const next=createPortraitSession('next',lcg(5));
 assert.equal(finishPortraitAction(next,previous.pending),'ignored');
 assert.equal(next.count,0);
 const action=next.requests[0];
 assert.equal(beginPortraitAction(next,action),true);
 assert.equal(finishPortraitAction(next,action),'progress');
 assert.equal(previous.count,0);
 assert.equal(previous.pending,previous.requests[0]);
});
