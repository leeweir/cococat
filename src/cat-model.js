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
 norwegian:{body:[.39,.37,.7],head:[.52,.41,.44],hip:.6,front:.45,rear:-.49,headY:1.08,headZ:.69,ear:.29,earWidth:.22,tail:.13,scale:1.08,eye:.126,muzzle:.14,ruff:true,tufts:true,pattern:'tabby',soft:true,socks:true},
 // Dogs: a forward snout, a big dark nose and species ears/tails; no whiskers.
 corgi:{species:'dog',body:[.38,.28,.66],head:[.5,.4,.42],hip:.32,front:.4,rear:-.44,headY:.78,headZ:.62,ear:.34,earWidth:.3,tail:.1,scale:1,eye:.116,muzzle:.13,snout:.1,earStyle:'erect',tailStyle:'stub',pattern:'corgi',socks:true,tongue:true},
 shiba:{species:'dog',body:[.36,.34,.62],head:[.49,.4,.42],hip:.5,front:.37,rear:-.4,headY:.95,headZ:.6,ear:.22,earWidth:.26,tail:.11,scale:1,eye:.11,muzzle:.13,snout:.11,earStyle:'erect',tailStyle:'curl',pattern:'urajiro',socks:true},
 goldenretriever:{species:'dog',body:[.4,.38,.74],head:[.52,.42,.44],hip:.62,front:.46,rear:-.5,headY:1.12,headZ:.72,ear:.26,earWidth:.3,tail:.1,scale:1.1,eye:.112,muzzle:.15,snout:.13,earStyle:'flop',tailStyle:'plume',ruff:true,pattern:'solid',tongue:true},
 pomeranian:{species:'dog',body:[.38,.34,.5],head:[.48,.4,.4],hip:.38,front:.3,rear:-.32,headY:.86,headZ:.5,ear:.17,earWidth:.2,tail:.13,scale:.92,eye:.13,muzzle:.1,snout:.05,earStyle:'erect',tailStyle:'curl',ruff:true,mane:true,pattern:'solid'},
 husky:{species:'dog',body:[.38,.36,.7],head:[.5,.41,.43],hip:.58,front:.44,rear:-.48,headY:1.06,headZ:.69,ear:.26,earWidth:.26,tail:.12,scale:1.06,eye:.116,muzzle:.14,snout:.13,earStyle:'erect',tailStyle:'curl',ruff:true,pattern:'husky'},
 // Rabbits hop: paired legs, big haunches and a pom tail.
 lop:{species:'rabbit',body:[.4,.31,.56],head:[.5,.42,.42],hip:.35,front:.32,rear:-.34,headY:.8,headZ:.5,ear:.5,earWidth:.2,tail:.12,scale:.98,eye:.13,muzzle:.12,earStyle:'lop',tailStyle:'pom',pattern:'broken',hop:true,haunch:1.25,teeth:true},
 dwarf:{species:'rabbit',body:[.36,.3,.5],head:[.5,.43,.42],hip:.34,front:.3,rear:-.32,headY:.77,headZ:.48,ear:.32,earWidth:.17,tail:.11,scale:.9,eye:.14,muzzle:.11,earStyle:'long',tailStyle:'pom',pattern:'solid',hop:true,haunch:1.2,teeth:true},
 lionhead:{species:'rabbit',body:[.38,.31,.54],head:[.5,.42,.42],hip:.35,front:.31,rear:-.33,headY:.79,headZ:.5,ear:.3,earWidth:.17,tail:.12,scale:.94,eye:.135,muzzle:.11,earStyle:'long',tailStyle:'pom',mane:true,ruff:true,pattern:'solid',hop:true,haunch:1.2,teeth:true},
 // Uncommon small pets: low bodies on tiny legs, rounder ears.
 hedgehog:{species:'hedgehog',body:[.4,.27,.52],head:[.4,.34,.38],hip:.3,front:.3,rear:-.32,headY:.52,headZ:.52,ear:.09,earWidth:.12,tail:.03,scale:.92,eye:.1,muzzle:.1,snout:.12,earStyle:'round',tailStyle:'none',spikes:true,pattern:'solid',whiskers:false},
 hamster:{species:'hamster',body:[.4,.28,.44],head:[.43,.38,.37],hip:.3,front:.26,rear:-.28,headY:.62,headZ:.4,ear:.09,earWidth:.12,tail:.03,scale:.9,eye:.11,muzzle:.1,earStyle:'round',tailStyle:'none',chubby:true,pouch:1.3,pattern:'solid',teeth:true},
 chinchilla:{species:'chinchilla',body:[.36,.31,.48],head:[.44,.4,.38],hip:.34,front:.28,rear:-.3,headY:.78,headZ:.44,ear:.17,earWidth:.16,tail:.12,scale:.94,eye:.13,muzzle:.1,earStyle:'round',tailStyle:'bushy',pattern:'solid',teeth:true},
 ferret:{species:'ferret',body:[.27,.27,.8],head:[.38,.32,.42],hip:.32,front:.52,rear:-.55,headY:.66,headZ:.86,ear:.1,earWidth:.13,tail:.075,scale:.95,eye:.1,muzzle:.11,snout:.08,earStyle:'round',tailStyle:'long',pattern:'ferret'},
 guineapig:{species:'guineapig',body:[.38,.26,.56],head:[.4,.34,.36],hip:.29,front:.32,rear:-.34,headY:.56,headZ:.55,ear:.09,earWidth:.12,tail:.03,scale:.92,eye:.11,muzzle:.11,earStyle:'petal',tailStyle:'none',chubby:true,pattern:'calico',teeth:true},
 glider:{species:'glider',body:[.33,.27,.46],head:[.44,.38,.38],hip:.3,front:.28,rear:-.3,headY:.68,headZ:.46,ear:.15,earWidth:.15,tail:.09,scale:.9,eye:.16,muzzle:.09,earStyle:'round',tailStyle:'bushy',pattern:'stripe'}
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
 norwegian:['#c4b4a2','#7e6a58','#54463a','#b8c06a','#f4ece2','#c9928a','#e6b6ae'],
 corgi:['#e7a35f','#c97f3c','#8a5530','#9a6a3e','#fff8ee','#3b302e','#efb7a8'],
 shiba:['#d9874a','#b86a34','#7a4626','#8f5e36','#fbefdd','#3b302e','#efb7a8'],
 goldenretriever:['#e5bd78','#c98f45','#9a6f3c','#94643a','#f6e3bd','#3b302e','#e3ae9c'],
 pomeranian:['#f2c38a','#e0a564','#a87444','#8a5a34','#fbe6c8','#3b302e','#efb7a8'],
 husky:['#f1f2f4','#6f7784','#414852','#7fbde8','#ffffff','#363238','#e9b4b4'],
 lop:['#f7efe4','#c99a6e','#8e6a4c','#5c4436','#fffaf3','#e6a3a3','#f2c3c3'],
 dwarf:['#cdb59a','#a8896a','#6f5744','#3e2f28','#efe3d4','#d99a9a','#eeb9b4'],
 lionhead:['#f6efe4','#e9dccb','#bba58e','#5a3f34','#fffbf5','#eba7a7','#f4c4c4'],
 hedgehog:['#c8b29a','#6e5848','#3f332c','#2e2522','#f3e6d6','#2f2a2a','#e9b9ad'],
 hamster:['#e8b878','#cf9a58','#9a6c3c','#2e2522','#fff6ea','#e69a9a','#f2bcb6'],
 chinchilla:['#b7b9bd','#9c9fa5','#6f737a','#2f2a2c','#eceae6','#d9a3a8','#e8bfc2'],
 ferret:['#efe2cc','#8e735c','#4e3e33','#3a2a24','#fff7ea','#e8a3a3','#f0c0b9'],
 guineapig:['#fbf3e6','#d8955a','#4e3b33','#2e2522','#fffaf3','#e3a0a0','#efbdb7'],
 glider:['#a9a6a8','#7c787b','#3a3437','#2a2224','#f4efe8','#d89aa0','#e9bcc0']
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
  if(kind==='husky')L(c,K.patch,ss(y,-.02,.14));
  if(kind==='broken')L(c,K.patch,Math.max(blob(x,y,z,[-.2,.16,-.1,.24,.24,.26]),blob(x,y,z,[.22,.12,.22,.16,.18,.16])));
  if(kind==='ferret')L(c,K.patch,ss(-z,-.1,.55)*.85);
  if(kind==='stripe')L(c,K.dark,(1-ss(Math.abs(x),.025,.06))*ss(y,.08,.18));
  if(kind==='corgi'||kind==='urajiro')L(c,K.light,ss(z,p.front*.3,p.front*.85)*ss(-y,-.2,.02));
  return L(c,K.light,Math.max(ss(-y,.08,.24),ss(z,p.front*.45,p.front*.95)*ss(-y,-.12,.06))*(p.dimFace?.6:1));
 };
 const body=grp(rig,[0,p.hip+.015,-.04]);
 const cs=p.species?p.body[1]/.33:1,hz=p.haunch||1;
 const torsoForms=[[0,0,-.02,...p.body,.15],[0,.05*cs,p.front*.8,p.body[0]*.82,p.body[1],.3,.17],[0,.2*cs,p.front+.04,p.body[0]*.7,.28*cs,.28*cs,.17],[-p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6*hz,p.body[1]*.85*hz,.26*hz,.12],[p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6*hz,p.body[1]*.85*hz,.26*hz,.12]];
 if(p.ruff)torsoForms.push([0,.1*cs,p.front+.1,p.body[0]*.92,.3*cs,.24,.12]);
 const torsoGeometry=sculptSurface(torsoForms,[.8,.85,1.1],softMaterial,[],low?30:52);
 tintSurface(torsoGeometry,bodyPattern);owned.add(torsoGeometry);const torso=new THREE.Mesh(torsoGeometry,softMaterial);torso.castShadow=torso.receiveShadow=true;body.add(torso);
 const legs=[],legColor=kind==='calico'?light:kind==='ferret'?patch:coat,shinColor=['points','ferret'].includes(kind)?(kind==='ferret'?dark:patch):legColor;
 const pawColor=kind==='points'?patch:kind==='ferret'?dark:(['calico','ragdoll','cow'].includes(kind)||p.socks)?light:coat;
 for(let i=0;i<4;i++){
  const front=i<2,side=i%2?-1:1,hip=grp(rig,[side*p.body[0]*.62,p.hip,front?p.front:p.rear]);
  const upper=p.hip*.52,lower=p.hip*.52;
  if(front)soft(hip,new THREE.CapsuleGeometry(.115,upper*.8,6,18),legColor,[0,-upper*.45,0]);else soft(hip,sphere,legColor,[0,-upper*.3,-.01],[.15*hz,upper*.78,.19*hz]);
  const knee=grp(hip,[0,-upper,0]);soft(knee,new THREE.CapsuleGeometry(.088,lower*.8,6,16),shinColor,[0,-lower*.5,0]);
  const ankle=grp(knee,[0,-lower,0]);soft(ankle,sphere,pawColor,[0,.06,.04],[.112,.075,.14]);
  hip.userData={knee,ankle,upper,lower,front,side,rest:hip.position.clone()};legs.push(hip);
 }
 // Tail: a tapered question-mark curve, striped for tabbies and fluffed for long-haired breeds.
 const tail=grp(rig,[0,p.hip+.05,p.rear-.13]);
 const tailStyle=p.tailStyle||'cat',TAILS={
  cat:[[0,0,0],[0,.12,-.24],[.05,.42,-.44],[.09,.72,-.46],[.03,.9,-.32]],
  curl:[[0,0,0],[0,.16,-.12],[.02,.34,-.08],[.05,.4,.06],[.03,.32,.15]],
  plume:[[0,0,0],[0,-.03,-.2],[.03,-.13,-.4],[.06,-.26,-.54],[.07,-.36,-.6]],
  stub:[[0,0,0],[0,.04,-.06],[0,.08,-.1]],
  pom:[[0,0,0],[0,.03,-.04],[0,.06,-.06]],
  none:[[0,0,0],[0,.01,-.02],[0,.02,-.03]],
  bushy:[[0,0,0],[0,.1,-.2],[.03,.3,-.33],[.05,.5,-.32],[.03,.62,-.2]],
  long:[[0,0,0],[0,.02,-.2],[.03,0,-.42],[.05,.03,-.6],[.04,.08,-.72]]};
 const tailCurve=new THREE.CatmullRomCurve3(TAILS[tailStyle].map(v=>new THREE.Vector3(...v)));
 const fluffy=['plume','bushy','curl'].includes(tailStyle);
 const tailRadius=tailStyle==='pom'?()=>.045:fluffy?t=>p.tail*(.75+.65*Math.sin(Math.PI*Math.min(1,.15+t*.95))):t=>p.tail*(1.15-.35*t)*(p.ruff?1+.4*Math.sin(Math.PI*Math.min(1,t*1.2)):1);
 const tailColor=t=>{
  if(['calico','cow'].includes(kind))return K.dark.clone();
  if(tailStyle==='pom')return K.light.clone();
  if(['ferret','stripe'].includes(kind))return L(K.coat.clone(),K.dark,ss(t,.2,.7));
  if(['husky','broken'].includes(kind))return L(K.coat.clone(),K.patch,.8);
  if(striped||kind==='tabby')return L(K.coat.clone(),kind==='spots'?K.dark:K.patch,stripeStrength*ss(Math.sin(t*Math.PI*9),.1,.6));
  if(['ragdoll','points'].includes(kind))return L(K.coat.clone(),K.patch,ss(t,.05,.35));
  if(['ticked','shaded'].includes(kind))return L(K.coat.clone(),K.dark,ss(t,.72,.92));
  return K.coat.clone();
 };
 const tailSegments=low?24:48,tailSides=low?10:18;
 const tailGeometry=new THREE.TubeGeometry(tailCurve,tailSegments,1,tailSides,false),tp=tailGeometry.attributes.position,center=new THREE.Vector3(),v=new THREE.Vector3(),tailColors=[];
 for(let i=0;i<=tailSegments;i++){const t=i/tailSegments,r=tailRadius(t),col=tailColor(t);tailCurve.getPointAt(t,center);for(let j=0;j<=tailSides;j++){const k=i*(tailSides+1)+j;v.fromBufferAttribute(tp,k).sub(center).multiplyScalar(r).add(center);tp.setXYZ(k,v.x,v.y,v.z);tailColors.push(col.r,col.g,col.b);}}
 tailGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tailColors,3));owned.add(tailGeometry);const tailMesh=new THREE.Mesh(tailGeometry,softMaterial);tailMesh.castShadow=true;tail.add(tailMesh);
 soft(tail,sphere,'#'+tailColor(1).getHexString(),tailCurve.getPointAt(1).toArray(),Array(3).fill(tailStyle==='pom'?p.tail:tailRadius(1)));
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
  if(kind==='corgi'){L(c,K.light,blaze(.035)*face);L(c,K.light,ss(-y,-.02,.1)*face);}
  if(kind==='urajiro'){L(c,K.light,ss(-y,-.07,.05)*face);for(const s of [-1,1])L(c,K.light,1-ss(Math.hypot(x-s*hw*.36,y-.16),.015,.035));}
  if(kind==='husky'){const cap=Math.max(ss(y,.06,.16),(1-ss(Math.abs(x),.035,.07))*ss(y,-.06,.02));L(c,K.patch,cap*(1-Math.max(...[-1,1].map(s=>1-ss(Math.hypot(x-s*hw*.41,y-.07),.07,.11)))));}
  if(kind==='broken'){L(c,K.patch,blob(x,y,z,[-.22,.08,.2,.16,.16,.3]));L(c,K.patch,(1-ss(Math.hypot(x,(y+.1)*1.4),.04,.08))*face);}
  if(kind==='ferret')L(c,K.dark,(1-ss(Math.abs(y-.045),.05,.11))*ss(Math.abs(x),.035,.085)*face);
  if(kind==='stripe'){L(c,K.dark,(1-ss(Math.abs(x),.015,.04))*ss(y,-.06,.04));for(const s of [-1,1])L(c,K.dark,.85*(1-ss(Math.abs(Math.hypot(x-s*hw*.405,y-.045)-p.eye*1.05),.012,.03)));}
  return L(c,K.blush,(p.dark?.28:.5)*Math.max(0,...[-1,1].map(s=>1-ss(Math.hypot(x-s*hw*.52,y+.11),.02,.1)))*face);
 };
 const ch=(p.chubby?1.12:1)*(p.pouch||1),sn=p.snout||0,headForms=[[0,.015,-.02,hw,hh,hd,.12],[-hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[-.075,-.175+sn*.25,hd*.78+sn,p.muzzle*.98,.092+sn*.15,(p.flat?.085:.13)+sn*.6,.075],[.075,-.175+sn*.25,hd*.78+sn,p.muzzle*.98,.092+sn*.15,(p.flat?.085:.13)+sn*.6,.075],[0,-.255+sn*.3,hd*.65+sn*.8,.105,.065,.11+sn*.5,.075]];
 if(sn)headForms.push([0,-.11,hd*.62+sn*.45,p.muzzle*1.15,.1,.14+sn*.5,.1]);
 const headGeometry=sculptSurface(headForms,[.86,.83,.8],softMaterial,[],low?36:60);
 tintSurface(headGeometry,headPattern);owned.add(headGeometry);const faceMesh=new THREE.Mesh(headGeometry,softMaterial);faceMesh.castShadow=faceMesh.receiveShadow=true;head.add(faceMesh);
 faceMesh.name='sculpted-face';
 // Fit facial details to the *sculpted* cheeks, not an approximate skull ellipsoid.
 const projectFace=surfaceProjector(headGeometry);
 // Plush ears: bevelled rounded triangles with a flat pink inner panel. Folds tip forward over the skull.
 const ew=p.earWidth*1.5,eh=p.ear+.12,earDepth=.035,earBevel=.03,ears=[],spikes=[];
 const earGeometry=new THREE.ExtrudeGeometry(earShape(ew,eh),{depth:earDepth,bevelEnabled:true,bevelThickness:earBevel,bevelSize:.026,bevelSegments:low?2:5,curveSegments:low?8:18}).translate(0,0,-earDepth/2);
 const innerGeometry=new THREE.ShapeGeometry(earShape(ew*.58,eh*.68),low?8:18);
 for(const side of [-1,1]){
  const earColor=kind==='calico'?(side<0?patch:dark):['ragdoll','points','cow','husky','ferret','stripe'].includes(kind)?dark:['tabby','classic','spots','ticked','broken'].includes(kind)?patch:coat;
  const style=p.earStyle||'cat';
  if(['flop','lop'].includes(style)){
   // Hanging ears: a soft paddle beside each cheek that swings a little when the head moves.
   const lop=style==='lop',ear=grp(head,[side*hw*(lop?.9:.93),hh*(lop?.6:.48),lop?.02:0]);ear.rotation.set(lop?.15:.08,0,side*(lop?.24:.32));
   soft(ear,sphere,earColor,[0,-p.ear*(lop?.62:.5),0],[lop?.085:.075,p.ear*(lop?.7:.62),lop?.15:.17]);
   if(lop)soft(ear,sphere,earPink,[-side*.03,-p.ear*.6,.015],[.045,p.ear*.55,.1]);
   ears.push(ear);continue;
  }
  if(['round','petal'].includes(style)){
   // Small-pet ears: shallow discs, or soft petals that fold forward on guinea pigs.
   const petal=style==='petal',ear=grp(head,[side*hw*(petal?.66:.6),hh*(petal?.62:.7),-.04]);ear.rotation.set(petal?-.5:-.15,side*.4,-side*(petal?.9:.35));
   const r=p.ear+.04;soft(ear,sphere,earColor,[0,r*.7,0],[r*(petal?1.1:1),r,.035]);soft(ear,sphere,earPink,[0,r*.7,.022],[r*.66,r*.64,.018]);
   ears.push(ear);continue;
  }
  const long=style==='long',erect=style==='erect',ear=grp(head,[side*hw*(long?.32:erect?.5:.55),hh*(long?.78:.66),-.03]);
  ear.rotation.set(p.fold?.95:long?-.22:-.12,side*(long?.12:erect?.22:.28),-side*(long?.12:erect?.22:.3));if(p.fold)ear.scale.y=.72;if(long)ear.scale.set(.7,1.9,1);
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
  if(p.whiskers!==false&&p.species!=='dog')for(let i=0;i<2;i++)line(head,whiskerColor,[[side*.15,-.19-i*.035,hd*.86],[side*(hw*.82),-.17-i*.06,hd*.6],[side*(hw+.1),-.15-i*.1,hd*.3]],.0035);
 }
 // A soft rounded-triangle nose and an ω mouth.
 const noseY=sn?-.1:-.137,noseZ=projectFace(0,noseY)+.012,bigNose=p.species==='dog'||p.species==='hedgehog';
 if(bigNose){const r=p.species==='dog'?1:.7;soft(head,sphere,noseColor,[0,noseY,noseZ+.004],[.064*r,.04*r,.034*r]);soft(head,sphere,noseColor,[0,noseY-.022*r,noseZ-.002],[.04*r,.03*r,.026*r]);}
 else{soft(head,sphere,noseColor,[0,noseY,noseZ],[.047,.028,.021]);soft(head,sphere,noseColor,[0,noseY-.02,noseZ-.002],[.026,.024,.019]);}
 const noseShine=ell(head,'#fff3f0',[-.012,noseY+.007,noseZ+.019],[.011,.004,.002]);
 noseShine.material=new THREE.MeshBasicMaterial({color:'#fff3f0',transparent:true,opacity:.4});mats.set('nose-shine',noseShine.material);
 const mouthColor=p.dark?'#a88c88':'#73534e';
 const mouthLine=pts=>line(head,mouthColor,pts.map(([x,y])=>[x,y,projectFace(x,y)+.008]),.0065);
 for(const s of [-1,1])mouthLine([[0,-.181],[s*.014,-.205],[s*.039,-.213],[s*.065,-.196]]);
 mouthLine([[0,-.16],[0,-.185]]);
 // Rodents and rabbits show two little front teeth; happy dogs show a tongue.
 if(p.teeth)for(const s of [-1,1])soft(head,sphere,'#fffdf8',[s*.011,-.222,projectFace(s*.011,-.222)+.005],[.01,.017,.006]);
 if(p.tongue){const tongue=soft(head,sphere,'#e98c94',[.004,-.228,projectFace(0,-.228)+.004],[.03,.036,.012]);tongue.rotation.x=-.4;}
 // Lion-head rabbits and pomeranians wear a fluffy mane ring around the face.
 if(p.mane)for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=.1+(i%2)*.025;soft(head,sphere,i%3?coat:light,[Math.cos(a)*hw*.98,Math.sin(a)*hh*.95-.03,-hd*.28],[r*1.2,r*1.2,r]);}
 if(p.spikes)addSpikes();
 function addSpikes(){
  const cone=new THREE.ConeGeometry(.045,.21,6).translate(0,.1,0);owned.add(cone);
  const pc=cone.attributes.position,tone=[],tipC=new THREE.Color(light),midC=new THREE.Color(patch),baseC=new THREE.Color(dark);
  for(let i=0;i<pc.count;i++){const y=pc.getY(i),c=baseC.clone().lerp(midC,ss(y,0,.12)).lerp(tipC,ss(y,.16,.21));tone.push(c.r,c.g,c.b);}
  cone.setAttribute('color',new THREE.Float32BufferAttribute(tone,3));
  const spikeMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});mats.set('spikes',spikeMat);
  const place=(parent,points,name)=>{const m=new THREE.InstancedMesh(cone,spikeMat,points.length),o=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
   points.forEach(([pos,n],i)=>{o.position.copy(pos);o.quaternion.setFromUnitVectors(up,n);o.rotateX(-.35);o.scale.setScalar(.8+((i*37)%10)/25);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
   m.castShadow=true;m.name=name;parent.add(m);return m;};
  const [bx,by,bz]=p.body,back=[];
  for(let i=0;i<300;i++){const u=(i*.618034)%1,v=i/300,a=Math.PI*(.08+.84*u),z=-.02-bz*.95+bz*1.7*v;const r=Math.sqrt(Math.max(0,1-((z+.02)/bz)**2));if(r<.25)continue;
   const pos=new THREE.Vector3(Math.cos(a)*bx*r,Math.sin(a)*by*r,z);if(pos.y<by*.1)continue;back.push([pos.multiplyScalar(.98),new THREE.Vector3(pos.x/bx**2,pos.y/by**2,(pos.z+.02)/bz**2).normalize()]);}
  const crown=[];for(let i=0;i<90;i++){const u=(i*.618034)%1,v=i/90,a=Math.PI*(.12+.76*u),z=-hd*.9+hd*.95*v,r=Math.sqrt(Math.max(0,1-(z/hd)**2));if(r<.3)continue;
   const pos=new THREE.Vector3(Math.cos(a)*hw*r,Math.sin(a)*hh*r,z);if(pos.y<hh*.15)continue;crown.push([pos.multiplyScalar(.97),new THREE.Vector3(pos.x/hw**2,pos.y/hh**2,pos.z/hd**2).normalize()]);}
  spikes.push(place(body,back,'back-spikes'),place(head,crown,'head-spikes'));
 }
 const mouth=grp(head,[0,-.25,noseZ+.10]);const top=grp(head,[0,p.head[1]+.16,0]);
 root.scale.setScalar(p.scale);
 root.userData={breed,species:p.species||'cat',hop:!!p.hop,gaitOffsets:p.hop?[0,0,.5,.5]:[0,.5,.75,.25],spikes,rig,head,tail,eyes,legs,body,ears,baseScale:p.scale,profile:p,palette,mouth,top,gait:0,ownedGeometries:owned,ownedMaterials:new Set(mats.values()),
  anchors:{torsoGeometry,tailCurve,tailRadius,projectFace,eyeX,eyeY,eyeRadius:er,noseY,noseZ}};
 dressCat(root,outfit);
 poseLegs(root,0,0,0);return root;
}
export function poseLegs(cat,phase,stride=0,lift=0,lowerBody=0){
 const {legs,rig}=cat.userData;const offsets=cat.userData.gaitOffsets||[0,.5,.75,.25];
 legs.forEach((leg,i)=>{const d=leg.userData,step=pawStep(phase+offsets[i],stride,lift);
  const angles=legAngles(d.rest.y+rig.position.y-lowerBody-step.y,step.z,d.upper,d.lower);
  leg.rotation.x=angles.hip;d.knee.rotation.x=angles.knee;d.ankle.rotation.x=-angles.hip-angles.knee;
 });
}

export function syncEyelids(cat){for(const eye of cat.userData.eyes){const closed=eye.scale.y<.45;eye.userData.lid.visible=closed;eye.visible=!closed;}}
