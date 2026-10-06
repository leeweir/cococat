// Tiny WebAudio voice box: no audio files, every sound is synthesised on the spot.
const KEY='miaow-sound';
let ctx=null,master=null,on=true;
function ac(){
 if(ctx)return ctx;
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ctx=new C();master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);}catch{ctx=null;}
 return ctx;
}
const wake=()=>{if(!on)return;const c=ac();if(c?.state==='suspended')c.resume().catch(()=>{});};
export function initSound(){
 try{on=localStorage.getItem(KEY)!=='0';}catch{on=true;}
 window.addEventListener('pointerdown',wake,{passive:true});window.addEventListener('keydown',wake);
 return on;
}
export function soundEnabled(){return on;}
export function setSoundEnabled(value){on=!!value;try{localStorage.setItem(KEY,on?'1':'0');}catch{}if(on)wake();return on;}
export function tone(f=523,d=.13){
 if(!on)return;const c=ac();if(!c)return;const t=c.currentTime+.005;
 try{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.8,t+d);g.gain.setValueAtTime(.09,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02);}catch{}
}
// Two detuned oscillators through sweeping formant filters: "ee" opens into "ow", pitch rises then falls.
export function meow(voice=1,mood='happy'){
 if(!on)return;const c=ac();if(!c)return;
 try{
  const t=c.currentTime+.01,r=Math.random(),r2=Math.random();
  const dur=mood==='hungry'?.64+r*.14:mood==='sleepy'?.34+r*.1:mood==='question'?.48+r*.14:.4+r*.18;
  const base=(mood==='hungry'?560+r*70:mood==='sleepy'?620+r*80:660+r*220)*voice*(.96+r2*.08);
  const peak=mood==='sleepy'?.075:mood==='hungry'?.15:.13;
  const out=c.createGain();out.gain.value=0;out.connect(master);
  const f1=c.createBiquadFilter(),f2=c.createBiquadFilter();f1.type=f2.type='bandpass';f1.Q.value=5.5;f2.Q.value=8;
  const g1=c.createGain(),g2=c.createGain();g1.gain.value=.95;g2.gain.value=.7;
  f1.connect(g1);g1.connect(out);f2.connect(g2);g2.connect(out);
  f1.frequency.setValueAtTime(2350+r*520,t);f1.frequency.exponentialRampToValueAtTime(650+r2*130,t+dur*.86);
  f2.frequency.setValueAtTime(860+r2*110,t);f2.frequency.linearRampToValueAtTime(1040+r*150,t+dur*.86);
  const vib=c.createOscillator(),vibGain=c.createGain();vib.frequency.value=5+r2*2.4;vibGain.gain.value=base*(mood==='sleepy'?.009:.017);vib.connect(vibGain);
  for(const [type,detune,level] of [['sawtooth',-7-r*7,.46],['triangle',6+r2*8,.58]]){
   const o=c.createOscillator(),g=c.createGain();o.type=type;o.detune.value=detune;g.gain.value=level;
   o.frequency.setValueAtTime(base*.82,t);
   o.frequency.linearRampToValueAtTime(base*(mood==='sleepy'?1.04:1.12),t+dur*.22);
   o.frequency.linearRampToValueAtTime(mood==='question'?base*1.26:base*.68,t+dur);
   vibGain.connect(o.frequency);o.connect(g);g.connect(f1);g.connect(f2);o.start(t);o.stop(t+dur+.05);
  }
  vib.start(t);vib.stop(t+dur+.05);
  out.gain.setValueAtTime(0,t);out.gain.linearRampToValueAtTime(peak,t+(mood==='sleepy'?.09:.055));out.gain.setValueAtTime(peak,t+dur*.55);out.gain.exponentialRampToValueAtTime(.0001,t+dur);
 }catch{}
}
// Low filtered noise, amplitude-modulated near 25Hz: the little motor.
export function purr(seconds=1.5){
 if(!on)return;const c=ac();if(!c)return;
 try{
  const t=c.currentTime+.01,len=Math.max(.3,Math.min(4,seconds));
  const buffer=c.createBuffer(1,Math.ceil(c.sampleRate*len),c.sampleRate),data=buffer.getChannelData(0);let last=0;
  for(let i=0;i<data.length;i++){last=last*.86+(Math.random()*2-1)*.14;data[i]=Math.max(-1,Math.min(1,last*3.4));}
  const src=c.createBufferSource();src.buffer=buffer;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=330;lp.Q.value=1.1;
  const am=c.createGain();am.gain.value=.05;
  const lfo=c.createOscillator(),lfoGain=c.createGain();lfo.type='sine';lfo.frequency.value=24+Math.random()*3;lfoGain.gain.value=.045;lfo.connect(lfoGain);lfoGain.connect(am.gain);
  const env=c.createGain();env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(1,t+.14);env.gain.setValueAtTime(1,t+Math.max(.18,len-.22));env.gain.linearRampToValueAtTime(0,t+len);
  src.connect(lp);lp.connect(am);am.connect(env);env.connect(master);
  src.start(t);src.stop(t+len);lfo.start(t);lfo.stop(t+len);
 }catch{}
}
