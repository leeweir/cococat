// Tiny WebAudio voice box: no audio files, every sound is synthesised on the spot.
const KEY='miaow-sound';
let ctx=null,master=null,voiceWave=null,on=true;
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
// A rounded harmonic voice, a small pitch scoop and a soft "mi-ow" release.
export function meow(voice=1,mood='happy'){
 if(!on)return;const c=ac();if(!c)return;
 try{
  const t=c.currentTime+.01,r=Math.random(),r2=Math.random(),sleepy=mood==='sleepy',question=mood==='question';
  const dur=sleepy?.46+r*.1:mood==='hungry'?.5+r*.1:question?.34+r*.08:.38+r*.1;
  const base=(sleepy?510+r*40:mood==='hungry'?590+r*50:650+r*50)*voice*(.98+r2*.04);
  const peak=sleepy?.012:.03;
  // Cache a gently rolled-off spectrum instead of beating two bright oscillators together.
  if(!voiceWave)voiceWave=c.createPeriodicWave(new Float32Array(8),new Float32Array([0,1,.32,.14,.065,.028,.012,.004]));
  const o=c.createOscillator();o.setPeriodicWave(voiceWave);
  const body=c.createGain();body.gain.value=.48;
  const f1=c.createBiquadFilter(),f2=c.createBiquadFilter();f1.type=f2.type='bandpass';f1.Q.value=1.5;f2.Q.value=2;
  const g1=c.createGain(),g2=c.createGain();g1.gain.value=.7;g2.gain.value=.22;
  f1.frequency.setValueAtTime(base*1.6,t);f1.frequency.exponentialRampToValueAtTime(base*1.05,t+dur*.72);
  f2.frequency.setValueAtTime(2350+r*160,t);f2.frequency.exponentialRampToValueAtTime(1150+r2*100,t+dur*.84);
  const soft=c.createBiquadFilter();soft.type='lowpass';soft.Q.value=.55;
  soft.frequency.setValueAtTime(sleepy?1900:2800,t);soft.frequency.exponentialRampToValueAtTime(1450,t+dur);
  const out=c.createGain();out.gain.value=0;
  o.connect(body);body.connect(soft);o.connect(f1);f1.connect(g1);g1.connect(soft);o.connect(f2);f2.connect(g2);g2.connect(soft);soft.connect(out);out.connect(master);
  o.frequency.setValueAtTime(base*.86,t);
  o.frequency.exponentialRampToValueAtTime(base*(sleepy?1.03:1.14),t+dur*.22);
  o.frequency.exponentialRampToValueAtTime(base*.98,t+dur*.48);
  o.frequency.exponentialRampToValueAtTime(base*(question?1.03:.72),t+dur*.82);
  o.frequency.exponentialRampToValueAtTime(base*(question?1.2:sleepy?.66:.8),t+dur);
  // A few cents of late vibrato keep the voice warm without a buzzy wobble.
  const vib=c.createOscillator(),vibGain=c.createGain();vib.frequency.value=5.2+r2;
  vibGain.gain.setValueAtTime(0,t);vibGain.gain.linearRampToValueAtTime(sleepy?3:7,t+dur*.45);vibGain.gain.linearRampToValueAtTime(2,t+dur);
  vib.connect(vibGain);vibGain.connect(o.detune);
  out.gain.setValueAtTime(0,t);out.gain.linearRampToValueAtTime(peak,t+dur*.16);
  out.gain.linearRampToValueAtTime(peak*.82,t+dur*.42);out.gain.exponentialRampToValueAtTime(peak*.18,t+dur*.8);out.gain.exponentialRampToValueAtTime(.0001,t+dur);out.gain.linearRampToValueAtTime(0,t+dur+.015);
  o.onended=()=>{o.disconnect();body.disconnect();f1.disconnect();f2.disconnect();g1.disconnect();g2.disconnect();soft.disconnect();out.disconnect();vib.disconnect();vibGain.disconnect();};
  o.start(t);vib.start(t);o.stop(t+dur+.025);vib.stop(t+dur+.025);
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
