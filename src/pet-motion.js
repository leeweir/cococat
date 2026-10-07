export function updatePetMotion(cat,t,{mode,behavior,moving=0,petting=false,portraitAction=null,reduced=false}={}){
  const d=cat.userData,{head,tail,ears,rig,profile}=d,species=d.species,motion=reduced?0:1;
  const warmth=petting||['sleep','sun','sofa','nuzzle','follow'].includes(behavior)||['head','chin','blink'].includes(portraitAction)?1:.12;
  d.expression={warmth,alert:['wand','fetch','explore'].includes(mode)?1:0};
  const activePortrait=mode==='portrait'&&portraitAction;
  if(species==='dog'){
    tail.rotation.y=Math.sin(t*(petting?11:6.5))*(.14+.25*warmth)*motion;
    rig.rotation.z+=Math.sin(d.gait*Math.PI*2)*.028*moving*motion;
    if(!activePortrait)head.rotation.z+=Math.sin(t*.8)*.018*motion;
    if(d.tongue)d.tongue.scale.y=.028*(1+Math.sin(t*3.3)*.13*motion);
  }else if(species==='rabbit'){
    tail.rotation.y=0;
    if(!activePortrait)head.rotation.x+=Math.sin(t*5.5)*.008*motion;
    const hop=Math.sin(d.gait*Math.PI*2);
    rig.rotation.x+=hop*.045*moving*motion;
    ears.forEach((ear,i)=>{ear.rotation.x=(profile.earStyle==='lop'?.15:-.22)+Math.sin(t*2.2+i*.8)*(.025+.07*moving)*motion;});
  }else if(species==='cat'){
    tail.rotation.y=Math.sin(t*.7)*.065*motion;
    if(!activePortrait&&warmth>.8)head.rotation.x-=.025;
    if(mode==='free'&&moving<.04&&behavior==='watch'){
      const u=(t%17.5-15.5)/1.8,stretch=u>0&&u<1?Math.sin(u*Math.PI)**2*motion:0;
      rig.rotation.x-=stretch*.07;rig.position.y-=stretch*.025;head.rotation.x-=stretch*.1;
    }
    ears.forEach((ear,i)=>{ear.rotation.x=(profile.fold?.95:-.12)+(Math.sin(t*.72+i*2)>.96?Math.sin(t*8)*.04:0)*motion;});
  }else{
    tail.rotation.y=Math.sin(t*1.3)*.06*motion;
    if(!activePortrait)head.rotation.x+=Math.sin(t*4.7)*.012*motion;
    if(species==='ferret')rig.rotation.y+=Math.sin(d.gait*Math.PI*2)*.025*moving*motion;
    if(species==='hedgehog')head.rotation.y+=Math.sin(t*.9)*.028*motion;
  }
  d.mouthRoot.scale.y=1+(species==='rabbit'?Math.sin(t*6)*.045:Math.sin(t*1.8)*.018)*motion;
  if(warmth>.8)for(const eye of d.eyes)eye.scale.y=Math.min(eye.scale.y,.86);
}
