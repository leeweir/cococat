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

// ── 其他小动物的嗓子：同样只用振荡器与噪声，峰值和喵喵保持一致 ──
let noiseBuf=null;
function noise(c){
 if(noiseBuf)return noiseBuf;
 const b=c.createBuffer(1,Math.ceil(c.sampleRate*.6),c.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 return (noiseBuf=b);
}
// One rounded blip: a short glide through an optional band/low pass, cleaned up when it ends.
function blip(c,t,{type='sine',from=600,to=0,dur=.1,peak=.022,bp=0,q=1,lp=0,hold=.35}={}){
 const nodes=[],osc=c.createOscillator();osc.type=type;nodes.push(osc);
 const f0=Math.max(30,from),f1=Math.max(30,to||from);
 osc.frequency.setValueAtTime(f0,t);if(f1!==f0)osc.frequency.exponentialRampToValueAtTime(f1,t+dur*.92);
 let chain=osc;
 for(const [kind,freq,qq] of [['bandpass',bp,q],['lowpass',lp,.7]]){
  if(!freq)continue;
  const filter=c.createBiquadFilter();filter.type=kind;filter.frequency.value=freq;filter.Q.value=qq;
  chain.connect(filter);chain=filter;nodes.push(filter);
 }
 const g=c.createGain();nodes.push(g);chain.connect(g);g.connect(master);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+Math.min(dur*.3,.025));
 g.gain.setValueAtTime(peak,t+dur*hold);g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.012);
 osc.onended=()=>nodes.forEach(n=>n.disconnect());
 osc.start(t);osc.stop(t+dur+.02);
}
// One breathy puff of filtered noise: snuffles and the little transient in front of a bark.
function puff(c,t,{dur=.09,freq=700,q=1,peak=.016,type='bandpass'}={}){
 const src=c.createBufferSource();src.buffer=noise(c);src.playbackRate.value=.85+Math.random()*.3;
 const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
 const g=c.createGain();
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+Math.min(.018,dur*.35));g.gain.exponentialRampToValueAtTime(.0001,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.01);
 src.connect(f);f.connect(g);g.connect(master);
 src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};
 src.start(t,Math.random()*.4);src.stop(t+dur+.02);
}
// 狗狗：低沉的三角波快速下滑，配一点鼻音噪声，短而软。
function woof(c,t,voice,mood){
 const r=Math.random();
 if(mood==='hungry'){ // 撒娇的呜呜声
  blip(c,t,{type:'triangle',from:380*voice,to:520*voice,dur:.3,peak:.02,bp:820*voice,q:1.4,lp:1900,hold:.5});
  blip(c,t+.3,{type:'triangle',from:520*voice,to:330*voice,dur:.34,peak:.016,bp:760*voice,q:1.4,lp:1700,hold:.4});
  return;
 }
 const one=(at,drop,peak,dur)=>{
  const base=(mood==='sleepy'?250:330+r*40)*voice;
  puff(c,at,{dur:.045,freq:1150*voice,q:.8,peak:peak*.45});
  blip(c,at,{type:'triangle',from:base,to:base*drop,dur,peak,bp:(mood==='sleepy'?700:860+r*140)*voice,q:1.1,lp:mood==='sleepy'?1500:2400,hold:.3});
 };
 if(mood==='question'){ // 一声上扬的询问
  const base=330*voice;
  puff(c,t,{dur:.04,freq:1150*voice,q:.8,peak:.012});
  blip(c,t,{type:'triangle',from:base,to:base*1.5,dur:.2,peak:.028,bp:950*voice,q:1.1,lp:2400,hold:.45});
  return;
 }
 if(mood==='sleepy'){one(t,.62,.014,.18);return;}
 one(t,.5,.03,.15);one(t+.185+r*.03,.46,.026,.14); // 汪汪
}
// 兔兔 / 仓鼠：细细的小吱声。
function squeakVoice(c,t,voice,mood){
 const base=(mood==='sleepy'?1350:1750+Math.random()*250)*voice;
 const count=mood==='happy'?2+Math.round(Math.random()):mood==='hungry'?2:1;
 for(let i=0;i<count;i++)
  blip(c,t+i*(.1+Math.random()*.03),{type:'sine',from:base*(1+i*.05),to:base*(mood==='question'?1.3:mood==='sleepy'?.86:1.1),dur:mood==='sleepy'?.11:.075,peak:mood==='sleepy'?.012:.02,lp:4200,hold:.4});
}
// 刺猬：两到四下轻轻的鼻息。
function huffVoice(c,t,voice,mood){
 const count=mood==='sleepy'?2:mood==='happy'?3+Math.round(Math.random()):2+Math.round(Math.random());
 for(let i=0;i<count;i++){
  const at=t+i*(.11+Math.random()*.04);
  puff(c,at,{dur:.075+Math.random()*.03,freq:(520+Math.random()*180)*voice,q:1.5,peak:mood==='sleepy'?.011:.019});
  blip(c,at,{type:'triangle',from:190*voice,to:150*voice,dur:.07,peak:.009,lp:620,hold:.3});
 }
}
// 龙猫 / 蜜袋鼯：清亮的小啾声。
function chirpVoice(c,t,voice,mood){
 const count=mood==='happy'?2+Math.round(Math.random()):mood==='sleepy'?1:2;
 for(let i=0;i<count;i++)
  blip(c,t+i*(.085+Math.random()*.03),{type:'triangle',from:(1400+Math.random()*200)*voice,to:(mood==='question'?2400:mood==='sleepy'?1200:2100+Math.random()*300)*voice,dur:.055,peak:mood==='sleepy'?.012:.019,lp:5200,hold:.35});
}
// 雪貂：一串又快又闷的咯咯声。
function dookVoice(c,t,voice,mood){
 const count=mood==='sleepy'?2:3+Math.round(Math.random()*2);
 for(let i=0;i<count;i++){
  const at=t+i*(.075+Math.random()*.025),base=(350+Math.random()*100)*voice;
  blip(c,at,{type:'triangle',from:base*(mood==='question'?.9:1.05),to:base*(mood==='question'?1.25:.82),dur:.055,peak:mood==='sleepy'?.013:.022,bp:base*1.7,q:1.3,lp:1500,hold:.3});
  puff(c,at,{dur:.03,freq:900*voice,q:1.2,peak:.007});
 }
}
// 荷兰猪：一两声上扬的「吱——」。
function wheekVoice(c,t,voice,mood){
 const count=['happy','hungry'].includes(mood)?2:1;
 for(let i=0;i<count;i++)
  blip(c,t+i*.33,{type:'sine',from:(880+Math.random()*80)*voice,to:(mood==='sleepy'?1500:2300+Math.random()*200)*voice,dur:mood==='sleepy'?.3:.26,peak:mood==='sleepy'?.013:.024,lp:4600,hold:.6});
}
const VOICES={bark:woof,squeak:squeakVoice,huff:huffVoice,chirp:chirpVoice,dook:dookVoice,wheek:wheekVoice};
// One entry point for every species: kind picks the throat, mood picks the phrase.
export function speak(voice=1,kind='meow',mood='happy'){
 if(kind==='meow'||!VOICES[kind])return meow(voice,mood);
 if(!on)return;const c=ac();if(!c)return;
 try{VOICES[kind](c,c.currentTime+.01,voice>0?voice:1,mood);}catch{}
}
// The contented background noise: cats and guinea pigs rumble, everyone else murmurs softly.
export function content(seconds=1.5,kind='meow'){
 if(kind==='meow'||kind==='wheek')return purr(seconds);
 return speak(1,kind,'sleepy');
}
