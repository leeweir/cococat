import * as THREE from 'three';
import {sculptSurface,tintSurface,surfaceProjector} from './organic-surface.js';
import {dressCat} from './outfit-model.js';

// Anatomy is expressed in local units; all breeds share a four-paw rig, not a silhouette.
export const CAT_PROFILES = {
 calico:{body:[.33,.31,.56],head:[.50,.39,.41],hip:.50,front:.33,rear:-.36,headY:.92,headZ:.53,ear:.25,earWidth:.22,tail:.085,scale:.98,eye:.128,muzzle:.12,pattern:'calico'},
 ragdoll:{body:[.38,.35,.62],head:[.54,.415,.43],hip:.50,front:.36,rear:-.40,headY:.96,headZ:.58,ear:.23,earWidth:.23,tail:.12,scale:1.02,eye:.136,muzzle:.13,ruff:true,pattern:'ragdoll'},
 maine:{body:[.38,.36,.72],head:[.52,.415,.44],hip:.62,front:.46,rear:-.50,headY:1.10,headZ:.70,ear:.31,earWidth:.22,tail:.12,scale:1.10,eye:.124,muzzle:.15,ruff:true,tufts:true,pattern:'tabby',socks:true},
 persian:{body:[.42,.33,.54],head:[.58,.415,.38],hip:.40,front:.31,rear:-.34,headY:.84,headZ:.49,ear:.15,earWidth:.21,tail:.12,scale:.98,eye:.142,muzzle:.10,ruff:true,flat:true,pattern:'solid'},
 orange:{body:[.43,.37,.60],head:[.54,.405,.43],hip:.47,front:.36,rear:-.40,headY:.92,headZ:.57,ear:.23,earWidth:.24,tail:.10,scale:1.01,eye:.13,muzzle:.13,pattern:'tabby',socks:true},
 blue:{body:[.43,.36,.56],head:[.58,.425,.43],hip:.45,front:.33,rear:-.36,headY:.89,headZ:.54,ear:.19,earWidth:.23,tail:.11,scale:.99,eye:.134,muzzle:.13,chubby:true,pattern:'solid',dimFace:true},
 siamese:{body:[.31,.30,.62],head:[.47,.38,.42],hip:.53,front:.37,rear:-.40,headY:.95,headZ:.57,ear:.30,earWidth:.24,tail:.075,scale:.97,eye:.126,muzzle:.12,pattern:'points'},
 black:{body:[.35,.33,.58],head:[.51,.40,.42],hip:.50,front:.35,rear:-.38,headY:.93,headZ:.55,ear:.26,earWidth:.22,tail:.09,scale:1.0,eye:.134,muzzle:.12,pattern:'solid',dark:true},
 white:{body:[.36,.33,.58],head:[.52,.40,.42],hip:.49,front:.34,rear:-.38,headY:.92,headZ:.55,ear:.24,earWidth:.22,tail:.095,scale:.99,eye:.136,muzzle:.12,pattern:'solid',oddEye:'#7fc4ec'},
 cow:{body:[.37,.34,.6],head:[.52,.405,.42],hip:.49,front:.35,rear:-.39,headY:.93,headZ:.56,ear:.24,earWidth:.23,tail:.095,scale:1.0,eye:.13,muzzle:.12,pattern:'cow'},
 lihua:{body:[.36,.34,.62],head:[.51,.40,.43],hip:.51,front:.37,rear:-.40,headY:.95,headZ:.58,ear:.26,earWidth:.22,tail:.09,scale:1.0,eye:.13,muzzle:.13,pattern:'tabby',strong:true},
 fold:{body:[.40,.35,.56],head:[.57,.43,.42],hip:.46,front:.33,rear:-.36,headY:.89,headZ:.54,ear:.18,earWidth:.22,tail:.11,scale:.98,eye:.142,muzzle:.12,chubby:true,fold:true,pattern:'tabby',soft:true},
 sphynx:{body:[.32,.31,.6],head:[.48,.39,.41],hip:.52,front:.36,rear:-.39,headY:.94,headZ:.56,ear:.34,earWidth:.28,tail:.07,scale:.97,eye:.13,muzzle:.11,pattern:'hairless',hairless:true},
 bengal:{body:[.35,.34,.66],head:[.49,.39,.43],hip:.55,front:.40,rear:-.43,headY:.99,headZ:.61,ear:.25,earWidth:.21,tail:.095,scale:1.03,eye:.126,muzzle:.13,pattern:'spots'},
 russian:{body:[.33,.32,.6],head:[.49,.39,.42],hip:.52,front:.36,rear:-.39,headY:.94,headZ:.56,ear:.28,earWidth:.23,tail:.085,scale:.99,eye:.13,muzzle:.12,pattern:'solid',dimFace:true},
 aby:{body:[.32,.31,.62],head:[.48,.385,.42],hip:.54,front:.38,rear:-.41,headY:.96,headZ:.58,ear:.33,earWidth:.26,tail:.08,scale:.98,eye:.13,muzzle:.12,pattern:'ticked'},
 american:{body:[.39,.36,.6],head:[.53,.41,.43],hip:.49,front:.35,rear:-.39,headY:.93,headZ:.56,ear:.23,earWidth:.23,tail:.1,scale:1.01,eye:.132,muzzle:.13,pattern:'classic'},
 munchkin:{body:[.37,.33,.58],head:[.52,.405,.42],hip:.32,front:.34,rear:-.37,headY:.76,headZ:.55,ear:.24,earWidth:.23,tail:.095,scale:.98,eye:.136,muzzle:.12,pattern:'tabby',soft:true,socks:true},
 golden:{body:[.43,.36,.56],head:[.58,.42,.43],hip:.45,front:.33,rear:-.36,headY:.89,headZ:.54,ear:.2,earWidth:.23,tail:.11,scale:.99,eye:.138,muzzle:.13,chubby:true,pattern:'shaded'},
 norwegian:{body:[.39,.37,.7],head:[.52,.41,.44],hip:.6,front:.45,rear:-.49,headY:1.08,headZ:.69,ear:.29,earWidth:.22,tail:.13,scale:1.08,eye:.126,muzzle:.14,ruff:true,tufts:true,pattern:'tabby',soft:true,socks:true}
};
// coat, marking, deep marking, eyes, muzzle/belly, nose, inner ear
const COATS={
 calico:['#fff8ee','#eba35f','#4b3b37','#93c57c','#fffaf4','#f19da3','#f6bcbf'],
 ragdoll:['#fbf2e4','#a68673','#5c483e','#69b8e8','#fffaf3','#d69c9e','#eeb7b7'],
 maine:['#a7907d','#6a5446','#45362f','#c4ca62','#f3e9dd','#c98a83','#e6b0ab'],
 persian:['#f0cf9c','#dfab6c','#a77650','#e79a43','#fdf3e2','#eba49a','#f4c0b8'],
 orange:['#f3a75c','#d4752f','#8c4a29','#a9cc6a','#fff1dd','#ec9a8f','#f6bdb4'],
 blue:['#a2adbe','#8693a8','#5b6779','#eda843','#bcc5d3','#8f96ab','#cfadb9'],
 siamese:['#f1e2cc','#6b5244','#4e3a31','#5fa8e0','#fbf3e6','#8c6a62','#c79f9a'],
 black:['#3b3438','#2c2629','#1f1a1d','#e8c450','#4a4247','#6a5458','#8a6a72'],
 white:['#fbf8f3','#efe8de','#d9cfc2','#e8b450','#ffffff','#f2a5ab','#f7c3c6'],
 cow:['#fdfaf5','#3a3336','#2a2427','#e2c254','#ffffff','#f0a2a6','#f4bec1'],
 lihua:['#b8956b','#6d5238','#4a3626','#a8c860','#efe2cf','#c48a7a','#e2b0a6'],
 fold:['#ead8c2','#c9ab8d','#9c7e65','#e0a94e','#f8eee2','#e7a6a0','#f2c3bd'],
 sphynx:['#f2c9b7','#c9a69a','#a8857a','#9fd0a8','#f7d8ca','#e59a9a','#eeaeae'],
 bengal:['#e8b867','#8d5a2c','#5a3a20','#a9c860','#f8e6c4','#c98a6e','#e8b4a4'],
 russian:['#9eaab8','#8794a4','#5e6a7a','#7fc48a','#b3bdc9','#8a90a4','#c4a9b6'],
 aby:['#d99a64','#a8683a','#6e4426','#c2b85a','#f2d2b0','#d68a78','#ebb0a0'],
 american:['#c9cdd2','#3d3a3c','#2a2729','#a8c060','#eceef0','#c99090','#e2b4b6'],
 munchkin:['#f5c58e','#dc9a5a','#a8683a','#8fc4a0','#fff2e0','#ee9c90','#f6bdb4'],
 golden:['#f0cc8a','#d9a65e','#a8783e','#7fbe86','#fbeccc','#e6a090','#f2bcae'],
 norwegian:['#c4b4a2','#7e6a58','#54463a','#b8c06a','#f4ece2','#c9928a','#e6b6ae']
};
export function pawStep(phase,stride=.42,lift=.12){
 const p=((phase%1)+1)%1,stance=.64;
 if(p<stance)return {z:stride*(.5-p/stance),y:0};
 const u=(p-stance)/(1-stance),smooth=u*u*(3-2*u);
 return {z:stride*(-.5+smooth),y:Math.sin(Math.PI*u)*lift};
}
export function legAngles(down,z,upper,lower){
 const d=Math.min(upper+lower-.0001,Math.max(.05,Math.hypot(down,z)));
 const hip=Math.atan2(-z,down)-Math.acos(THREE.MathUtils.clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1));
 const knee=Math.PI-Math.acos(THREE.MathUtils.clamp((upper*upper+lower*lower-d*d)/(2*upper*lower),-1,1));
 return {hip,knee};
}
const ss=THREE.MathUtils.smoothstep,blob=(x,y,z,c)=>1-ss(Math.hypot((x-c[0])/c[3],(y-c[1])/c[4],(z-c[2])/c[5]),.82,1.05);
// Quiet iris colour and a soft window reflection, rather than a luminous jewel rim.
// THREE.Color channels below are linear, so this data texture stays in linear space.
function eyeTexture(hex){
 const size=128,data=new Uint8Array(size*size*4),iris=new THREE.Color(hex).lerp(new THREE.Color('#817a68'),.18),rim=new THREE.Color('#39312f'),pupil=new THREE.Color('#242322'),white=new THREE.Color('#fff9ed'),c=new THREE.Color();
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1,r=Math.hypot(u,v);
  c.copy(iris).multiplyScalar(.28+.46*ss(-v,-.25,.95)).lerp(rim,ss(r,.94,1)*.55);
  c.lerp(pupil,1-ss(Math.hypot(u/.74,(v-.12)/.86),.93,1.03));
  c.lerp(white,.92*(1-ss(Math.hypot((u+.25)/.145,(v-.34)/.18),.65,1.12)));
  c.lerp(white,.32*(1-ss(Math.hypot((u-.28)/.065,(v+.36)/.065),.5,1.15)));
  const i=(y*size+x)*4;data[i]=c.r*255;data[i+1]=c.g*255;data[i+2]=c.b*255;data[i+3]=255;
 }
 const t=new THREE.DataTexture(data,size,size);t.needsUpdate=true;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;return t;
}

function fittedEyeGeometry(project,x,y,rx,ry){
 const segments=40,rings=8,positions=[0,0,project(x,y)+.014],uvs=[.5,.5],indices=[];
 for(let ring=1;ring<=rings;ring++){
  const r=ring/rings;
  for(let j=0;j<segments;j++){
   const a=j/segments*Math.PI*2,u=Math.cos(a)*r,v=Math.sin(a)*r;
   const dy=v*ry*(1-.18*u*u);
   positions.push(u*rx,dy,project(x+u*rx,y+dy)+.004+.010*(1-r*r));
   uvs.push(u*.5+.5,v*.5+.5);
  }
 }
 for(let j=0;j<segments;j++)indices.push(0,1+j,1+(j+1)%segments);
 for(let ring=1;ring<rings;ring++)for(let j=0;j<segments;j++){
  const a=1+(ring-1)*segments+j,b=1+(ring-1)*segments+(j+1)%segments,c=a+segments,d=b+segments;
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
function earShape(w,h){const s=new THREE.Shape();s.moveTo(-w/2,0);s.quadraticCurveTo(-w*.38,h*.6,-w*.09,h*.95);s.quadraticCurveTo(0,h*1.05,w*.09,h*.95);s.quadraticCurveTo(w*.38,h*.6,w/2,0);s.quadraticCurveTo(0,-h*.1,-w/2,0);return s;}
const luminance=hex=>{const c=new THREE.Color(hex);return .2126*c.r+.7152*c.g+.0722*c.b;};
// lod:'low' sculpts coarser meshes for the small adoption portraits.
export function createCat(breed='calico',outfit={},{lod='full'}={}){
 const p=CAT_PROFILES[breed]||CAT_PROFILES.calico,palette=COATS[breed]||COATS.calico,[coat,patch,dark,eyeColor,light,noseColor,earPink]=palette;
 const low=lod==='low',kind=p.pattern;
 const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
 const owned=new Set(),sphere=new THREE.SphereGeometry(1,low?20:40,low?16:32);owned.add(sphere);
 const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:0}));return mats.get(c);};
 // A velvety sheen reads as soft plush instead of noisy hair strands; hairless skin is smoother and less fuzzy.
 const sheen=p.hairless?.15:.45,roughness=p.hairless?.66:.82;
 const plush=c=>{const key=`plush-${c}`;if(!mats.has(key))mats.set(key,new THREE.MeshPhysicalMaterial({color:c,roughness,sheen,sheenRoughness:.55,sheenColor:'#fff3e6'}));return mats.get(key);};
 function shape(parent,g,c,pos=[0,0,0],scale=[1,1,1]){owned.add(g);const m=new THREE.Mesh(g,material(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const ell=(parent,c,pos,s)=>shape(parent,sphere,c,pos,s);
 const soft=(parent,g,c,pos,s)=>{const m=shape(parent,g,c,pos,s);m.material=plush(c);return m;};
 const grp=(parent,pos=[0,0,0])=>{const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;};
 const line=(parent,c,pts,r=.012)=>shape(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v))),16,r,6,false),c);
 const softMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness,sheen,sheenRoughness:.55,sheenColor:'#fff3e6'});mats.set('sculpted-coat',softMaterial);
 // Pre-parsed colours: pattern functions run once per vertex.
 const K={coat:new THREE.Color(coat),patch:new THREE.Color(patch),dark:new THREE.Color(dark),light:new THREE.Color(light),blush:new THREE.Color('#f4a3a6')};
 const L=(c,target,amount)=>c.lerp(target,THREE.MathUtils.clamp(amount,0,1));
 const striped=['tabby','classic','spots'].includes(kind),stripeStrength=p.strong?1:p.soft?.55:.9;
 // Body: soft bean torso with rounded haunches and a puffed chest.
 const bodyPattern=(x,y,z)=>{
  const c=K.coat.clone();
  if(kind==='calico'){L(c,K.patch,Math.max(blob(x,y,z,[-.22,.2,-.02,.28,.3,.32]),blob(x,y,z,[.24,.05,.3,.18,.2,.16])));L(c,K.dark,blob(x,y,z,[.22,.24,-.28,.26,.26,.26]));}
  if(kind==='tabby')L(c,K.patch,(stripeStrength*.94)*ss(Math.cos(z*15+x*x*8),.35,.8)*ss(y,-.08,.14));
  if(kind==='ragdoll')L(c,K.patch,.35*ss(y,.05,.32)*ss(-z,0,.4));
  if(kind==='points')L(c,K.patch,.3*ss(-z,.05,.45)+.12*ss(y,.1,.3));
  if(kind==='cow')L(c,K.dark,Math.max(blob(x,y,z,[.05,.22,-.1,.34,.26,.3]),blob(x,y,z,[-.3,.05,.28,.16,.2,.18]),blob(x,y,z,[.28,0,-.38,.18,.22,.2])));
  if(kind==='classic'){const ring=Math.abs(Math.sin(Math.hypot(y-.04,z+.06)*13));L(c,K.patch,.9*ss(ring,.6,.9)*ss(Math.abs(x),.14,.24)+.85*ss(Math.cos(x*40),.6,.9)*ss(y,.2,.3)*(1-ss(Math.abs(x),.12,.18)));}
  if(kind==='spots'){const n=Math.sin(x*23+Math.sin(z*11)*1.6)*Math.sin(z*21+Math.sin(y*13)*1.4)*Math.sin(y*19+x*7),back=ss(y,-.12,.05);L(c,K.patch,ss(n,.1,.28)*back);L(c,K.dark,.8*ss(n,.3,.45)*back);}
  if(kind==='ticked')L(c,K.patch,.55*ss(y,.18,.32)*(1-ss(Math.abs(x),.05,.14)));
  if(kind==='shaded')L(c,K.patch,.55*ss(y,.05,.3));
  if(kind==='hairless')L(c,K.patch,.5*Math.max(blob(x,y,z,[.2,.15,-.15,.2,.2,.24]),blob(x,y,z,[-.25,0,.2,.16,.18,.16])));
  return L(c,K.light,Math.max(ss(-y,.08,.24),ss(z,p.front*.45,p.front*.95)*ss(-y,-.12,.06))*(p.dimFace?.6:1));
 };
 const body=grp(rig,[0,p.hip+.015,-.04]);
 const torsoForms=[[0,0,-.02,...p.body,.15],[0,.05,p.front*.8,p.body[0]*.82,p.body[1],.3,.17],[0,.2,p.front+.04,p.body[0]*.7,.28,.28,.17],[-p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6,p.body[1]*.85,.26,.12],[p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6,p.body[1]*.85,.26,.12]];
 if(p.ruff)torsoForms.push([0,.1,p.front+.1,p.body[0]*.92,.3,.24,.12]);
 const torsoGeometry=sculptSurface(torsoForms,[.8,.85,1.1],softMaterial,[],low?30:52);
 tintSurface(torsoGeometry,bodyPattern);owned.add(torsoGeometry);const torso=new THREE.Mesh(torsoGeometry,softMaterial);torso.castShadow=torso.receiveShadow=true;body.add(torso);
 const legs=[],legColor=kind==='calico'?light:coat,shinColor=kind==='points'?patch:legColor;
 const pawColor=kind==='points'?patch:(['calico','ragdoll','cow'].includes(kind)||p.socks)?light:coat;
 for(let i=0;i<4;i++){
  const front=i<2,side=i%2?-1:1,hip=grp(rig,[side*p.body[0]*.62,p.hip,front?p.front:p.rear]);
  const upper=p.hip*.52,lower=p.hip*.52;
  if(front)soft(hip,new THREE.CapsuleGeometry(.115,upper*.8,6,18),legColor,[0,-upper*.45,0]);else soft(hip,sphere,legColor,[0,-upper*.3,-.01],[.15,upper*.78,.19]);
  const knee=grp(hip,[0,-upper,0]);soft(knee,new THREE.CapsuleGeometry(.088,lower*.8,6,16),shinColor,[0,-lower*.5,0]);
  const ankle=grp(knee,[0,-lower,0]);soft(ankle,sphere,pawColor,[0,.06,.04],[.112,.075,.14]);
  hip.userData={knee,ankle,upper,lower,front,side,rest:hip.position.clone()};legs.push(hip);
 }
 // Tail: a tapered question-mark curve, striped for tabbies and fluffed for long-haired breeds.
 const tail=grp(rig,[0,p.hip+.05,p.rear-.13]);
 const tailCurve=new THREE.CatmullRomCurve3([[0,0,0],[0,.12,-.24],[.05,.42,-.44],[.09,.72,-.46],[.03,.9,-.32]].map(v=>new THREE.Vector3(...v)));
 const tailRadius=t=>p.tail*(1.15-.35*t)*(p.ruff?1+.4*Math.sin(Math.PI*Math.min(1,t*1.2)):1);
 const tailColor=t=>{
  if(['calico','cow'].includes(kind))return K.dark.clone();
  if(striped||kind==='tabby')return L(K.coat.clone(),kind==='spots'?K.dark:K.patch,stripeStrength*ss(Math.sin(t*Math.PI*9),.1,.6));
  if(['ragdoll','points'].includes(kind))return L(K.coat.clone(),K.patch,ss(t,.05,.35));
  if(['ticked','shaded'].includes(kind))return L(K.coat.clone(),K.dark,ss(t,.72,.92));
  return K.coat.clone();
 };
 const tailSegments=low?24:48,tailSides=low?10:18;
 const tailGeometry=new THREE.TubeGeometry(tailCurve,tailSegments,1,tailSides,false),tp=tailGeometry.attributes.position,center=new THREE.Vector3(),v=new THREE.Vector3(),tailColors=[];
 for(let i=0;i<=tailSegments;i++){const t=i/tailSegments,r=tailRadius(t),col=tailColor(t);tailCurve.getPointAt(t,center);for(let j=0;j<=tailSides;j++){const k=i*(tailSides+1)+j;v.fromBufferAttribute(tp,k).sub(center).multiplyScalar(r).add(center);tp.setXYZ(k,v.x,v.y,v.z);tailColors.push(col.r,col.g,col.b);}}
 tailGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tailColors,3));owned.add(tailGeometry);const tailMesh=new THREE.Mesh(tailGeometry,softMaterial);tailMesh.castShadow=true;tail.add(tailMesh);
 soft(tail,sphere,'#'+tailColor(1).getHexString(),tailCurve.getPointAt(1).toArray(),Array(3).fill(tailRadius(1)));
 // Head: round skull with chubby cheeks and a small muzzle, painted with soft-edged markings and blush.
 const head=grp(rig,[0,p.headY,p.headZ]);const [hw,hh,hd]=p.head;
 const headPattern=(x,y,z)=>{
  const c=K.coat.clone(),face=ss(z,.05,.22),blaze=w=>1-ss(Math.abs(x),w+(.2-y)*.18,w+.05+(.2-y)*.18);
  if(kind==='calico'){L(c,K.patch,blob(x,y,z,[-.3,.2,.1,.3,.3,.5]));L(c,K.dark,blob(x,y,z,[.34,.3,0,.26,.24,.5]));L(c,K.light,blaze(.05)*face);}
  if(kind==='ragdoll'){L(c,K.patch,(1-ss(Math.hypot(x*.8,(y+.02)*1.1),.24,.4))*ss(z,-.05,.12));L(c,K.light,(1-ss(Math.abs(x),.03+(.04-y)*.55,.07+(.04-y)*.55))*ss(-y,-.04,.02)*face);}
  if(kind==='points')L(c,K.patch,.92*(1-ss(Math.hypot(x*.85,(y+.1)*1.05),.18,.34))*ss(z,-.02,.14));
  if(kind==='cow'){L(c,K.dark,ss(y,.04,.12)*(1-blaze(.03)));L(c,K.dark,blob(x,y,z,[.2,.06,.3,.14,.12,.3]));}
  if(striped||kind==='tabby'){const s=stripeStrength;L(c,K.patch,s*ss(Math.cos(x*34),.5,.85)*ss(y,.14,.26)*face*(1-ss(Math.abs(x),.16,.22)));L(c,K.patch,.82*s*ss(Math.cos(y*38+.6),.55,.9)*ss(Math.abs(x),hw*.62,hw*.78)*ss(-y,-.06,.04));}
  if(['ticked','shaded'].includes(kind))L(c,K.patch,.45*ss(y,.12,.3));
  if(kind==='hairless')L(c,K.patch,.45*ss(Math.cos(y*70),.6,.95)*ss(y,.14,.22)*(1-ss(Math.abs(x),.12,.2))*face);
  if(kind!=='points')L(c,K.light,(1-ss(Math.hypot(x*.85,(y+.2)*1.15),.13,.22))*face*(p.dimFace?.5:p.dark?.35:1));
  if(kind==='cow')L(c,K.dark,1-ss(Math.hypot(x-.06,y+.205),.012,.026));
  return L(c,K.blush,(p.dark?.28:.5)*Math.max(0,...[-1,1].map(s=>1-ss(Math.hypot(x-s*hw*.52,y+.11),.02,.1)))*face);
 };
 const ch=p.chubby?1.12:1,headForms=[[0,.015,-.02,hw,hh,hd,.12],[-hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[-.075,-.175,hd*.78,p.muzzle*.98,.092,p.flat?.085:.13,.075],[.075,-.175,hd*.78,p.muzzle*.98,.092,p.flat?.085:.13,.075],[0,-.255,hd*.65,.105,.065,.11,.075]];
 const headGeometry=sculptSurface(headForms,[.86,.83,.8],softMaterial,[],low?36:60);
 tintSurface(headGeometry,headPattern);owned.add(headGeometry);const faceMesh=new THREE.Mesh(headGeometry,softMaterial);faceMesh.castShadow=faceMesh.receiveShadow=true;head.add(faceMesh);
 faceMesh.name='sculpted-face';
 // Fit facial details to the *sculpted* cheeks, not an approximate skull ellipsoid.
 const projectFace=surfaceProjector(headGeometry);
 // Plush ears: bevelled rounded triangles with a flat pink inner panel. Folds tip forward over the skull.
 const ew=p.earWidth*1.5,eh=p.ear+.12,earDepth=.035,earBevel=.03,ears=[];
 const earGeometry=new THREE.ExtrudeGeometry(earShape(ew,eh),{depth:earDepth,bevelEnabled:true,bevelThickness:earBevel,bevelSize:.026,bevelSegments:low?2:5,curveSegments:low?8:18}).translate(0,0,-earDepth/2);
 const innerGeometry=new THREE.ShapeGeometry(earShape(ew*.58,eh*.68),low?8:18);
 for(const side of [-1,1]){
  const ear=grp(head,[side*hw*.55,hh*.66,-.03]);ear.rotation.set(p.fold?.95:-.12,side*.28,-side*.3);if(p.fold)ear.scale.y=.72;
  const earColor=kind==='calico'?(side<0?patch:dark):['ragdoll','points','cow'].includes(kind)?dark:['tabby','classic','spots','ticked'].includes(kind)?patch:coat;
  soft(ear,earGeometry,earColor);soft(ear,innerGeometry,earPink,[0,eh*.12,earDepth/2+earBevel+.002]);
  if(p.tufts)for(let j=-1;j<=1;j++)line(ear,dark,[[0,eh*.92,0],[j*.025,eh*1.12+.03*(1-Math.abs(j)),-.01]],.006);
  ears.push(ear);
 }
 // Satin eyes follow the face; restrained specular light leaves the expression readable.
 const eyeMaterial=hex=>{const m=new THREE.MeshPhysicalMaterial({map:eyeTexture(hex),roughness:.52,clearcoat:.12,clearcoatRoughness:.38,specularIntensity:.28,envMapIntensity:.3});mats.set(`eye-${hex}`,m);return m;};
 const eyeMats=[eyeMaterial(eyeColor)];eyeMats.push(p.oddEye?eyeMaterial(p.oddEye):eyeMats[0]);
 const eyes=[],er=p.eye*.94,eyeX=hw*.405,eyeY=p.flat?.055:.045,lidColor=p.dark?'#c9b8a8':'#57443d';
 const whiskerColor=luminance(coat)<.44?'#e9e4dc':'#cbbcb2';
 for(const side of [-1,1]){
  const x=side*eyeX,eye=grp(head,[x,eyeY,0]);
  const eyeGeometry=fittedEyeGeometry(projectFace,x,eyeY,er*1.04,er*.97);owned.add(eyeGeometry);
  const dome=new THREE.Mesh(eyeGeometry,eyeMats[side>0?1:0]);dome.name='fitted-eye';eye.add(dome);
  const lid=grp(head,[x,eyeY,0]);
  const lidPoints=[[-.78,-.1],[-.4,.20],[0,.29],[.4,.20],[.78,-.1]].map(([u,v])=>[u*er,v*er,projectFace(x+u*er,eyeY+v*er)+.012]);
  line(lid,lidColor,lidPoints,.009);lid.visible=false;eye.userData.lid=lid;eyes.push(eye);
  for(let i=0;i<2;i++)line(head,whiskerColor,[[side*.15,-.19-i*.035,hd*.86],[side*(hw*.82),-.17-i*.06,hd*.6],[side*(hw+.1),-.15-i*.1,hd*.3]],.0035);
 }
 // A soft rounded-triangle nose and an ω mouth.
 const noseY=-.137,noseZ=projectFace(0,noseY)+.012;
 soft(head,sphere,noseColor,[0,noseY,noseZ],[.047,.028,.021]);soft(head,sphere,noseColor,[0,noseY-.02,noseZ-.002],[.026,.024,.019]);
 const noseShine=ell(head,'#fff3f0',[-.012,noseY+.007,noseZ+.019],[.011,.004,.002]);
 noseShine.material=new THREE.MeshBasicMaterial({color:'#fff3f0',transparent:true,opacity:.4});mats.set('nose-shine',noseShine.material);
 const mouthColor=p.dark?'#a88c88':'#73534e';
 const mouthLine=pts=>line(head,mouthColor,pts.map(([x,y])=>[x,y,projectFace(x,y)+.008]),.0065);
 for(const s of [-1,1])mouthLine([[0,-.181],[s*.014,-.205],[s*.039,-.213],[s*.065,-.196]]);
 mouthLine([[0,-.16],[0,-.185]]);
 const mouth=grp(head,[0,-.25,noseZ+.10]);const top=grp(head,[0,p.head[1]+.16,0]);
 root.scale.setScalar(p.scale);
 root.userData={breed,rig,head,tail,eyes,legs,body,ears,baseScale:p.scale,profile:p,palette,mouth,top,gait:0,ownedGeometries:owned,ownedMaterials:new Set(mats.values()),
  anchors:{torsoGeometry,tailCurve,tailRadius,projectFace,eyeX,eyeY,eyeRadius:er,noseY,noseZ}};
 dressCat(root,outfit);
 poseLegs(root,0,0,0);return root;
}
export function poseLegs(cat,phase,stride=0,lift=0,lowerBody=0){
 const {legs,rig}=cat.userData;const offsets=[0,.5,.75,.25];
 legs.forEach((leg,i)=>{const d=leg.userData,step=pawStep(phase+offsets[i],stride,lift);
  const angles=legAngles(d.rest.y+rig.position.y-lowerBody-step.y,step.z,d.upper,d.lower);
  leg.rotation.x=angles.hip;d.knee.rotation.x=angles.knee;d.ankle.rotation.x=-angles.hip-angles.knee;
 });
}

export function syncEyelids(cat){for(const eye of cat.userData.eyes){const closed=eye.scale.y<.45;eye.userData.lid.visible=closed;eye.visible=!closed;}}
