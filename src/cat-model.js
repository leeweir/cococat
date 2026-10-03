import * as THREE from 'three';
import {sculptSurface,tintSurface} from './organic-surface.js';

// Anatomy is expressed in local units; all breeds share a four-paw rig, not a silhouette.
export const CAT_PROFILES = {
 calico:{body:[.33,.31,.56],head:[.50,.39,.41],hip:.50,front:.33,rear:-.36,headY:.92,headZ:.53,ear:.25,earWidth:.22,tail:.085,scale:.98,eye:.128,muzzle:.12},
 ragdoll:{body:[.38,.35,.62],head:[.54,.415,.43],hip:.50,front:.36,rear:-.40,headY:.96,headZ:.58,ear:.23,earWidth:.23,tail:.12,scale:1.02,eye:.136,muzzle:.13,ruff:true},
 maine:{body:[.38,.36,.72],head:[.52,.415,.44],hip:.62,front:.46,rear:-.50,headY:1.10,headZ:.70,ear:.31,earWidth:.22,tail:.12,scale:1.10,eye:.124,muzzle:.15,ruff:true,tufts:true},
 persian:{body:[.42,.33,.54],head:[.58,.415,.38],hip:.40,front:.31,rear:-.34,headY:.84,headZ:.49,ear:.15,earWidth:.21,tail:.12,scale:.98,eye:.142,muzzle:.10,ruff:true,flat:true},
 orange:{body:[.43,.37,.60],head:[.54,.405,.43],hip:.47,front:.36,rear:-.40,headY:.92,headZ:.57,ear:.23,earWidth:.24,tail:.10,scale:1.01,eye:.13,muzzle:.13},
 blue:{body:[.43,.36,.56],head:[.58,.425,.43],hip:.45,front:.33,rear:-.36,headY:.89,headZ:.54,ear:.19,earWidth:.23,tail:.11,scale:.99,eye:.134,muzzle:.13,chubby:true}
};
// coat, marking, deep marking, eyes, muzzle/belly, nose, inner ear
const COATS={
 calico:['#fff8ee','#eba35f','#4b3b37','#93c57c','#fffaf4','#f19da3','#f6bcbf'],
 ragdoll:['#fbf2e4','#a68673','#5c483e','#69b8e8','#fffaf3','#d69c9e','#eeb7b7'],
 maine:['#a7907d','#6a5446','#45362f','#c4ca62','#f3e9dd','#c98a83','#e6b0ab'],
 persian:['#f0cf9c','#dfab6c','#a77650','#e79a43','#fdf3e2','#eba49a','#f4c0b8'],
 orange:['#f3a75c','#d4752f','#8c4a29','#a9cc6a','#fff1dd','#ec9a8f','#f6bdb4'],
 blue:['#a2adbe','#8693a8','#5b6779','#eda843','#bcc5d3','#8f96ab','#cfadb9']
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

// Fit facial details to the *sculpted* cheeks, not an approximate skull ellipsoid.
// A shallow curved eye surface avoids both floating button eyes and buried rims.
function faceProjector(geometry,material){
 const surface=new THREE.Mesh(geometry,material);
 const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,0,-1),0,2.4);
 return (x,y)=>{
  ray.ray.origin.set(x,y,1.2);
  const hit=ray.intersectObject(surface,false)[0];
  if(!hit)throw new Error(`Facial detail outside head surface: ${x}, ${y}`);
  return hit.point.z;
 };
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
export function createCat(breed='calico',outfit='none'){
 const p=CAT_PROFILES[breed]||CAT_PROFILES.calico,[coat,patch,dark,eyeColor,light,noseColor,earPink]=COATS[breed]||COATS.calico;
 const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
 const owned=new Set(),sphere=new THREE.SphereGeometry(1,40,32);owned.add(sphere);
 const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:0}));return mats.get(c);};
 // A velvety sheen reads as soft plush instead of noisy hair strands.
 const plush=c=>{const key=`plush-${c}`;if(!mats.has(key))mats.set(key,new THREE.MeshPhysicalMaterial({color:c,roughness:.82,sheen:.45,sheenRoughness:.55,sheenColor:'#fff3e6'}));return mats.get(key);};
 function shape(parent,g,c,pos=[0,0,0],scale=[1,1,1]){owned.add(g);const m=new THREE.Mesh(g,material(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const ell=(parent,c,pos,s)=>shape(parent,sphere,c,pos,s);
 const soft=(parent,g,c,pos,s)=>{const m=shape(parent,g,c,pos,s);m.material=plush(c);return m;};
 const grp=(parent,pos=[0,0,0])=>{const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;};
 const line=(parent,c,pts,r=.012)=>shape(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v))),16,r,6,false),c);
 const softMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.82,sheen:.45,sheenRoughness:.55,sheenColor:'#fff3e6'});mats.set('sculpted-coat',softMaterial);
 const C=h=>new THREE.Color(h),mix=(a,b,t)=>C(a).lerp(C(b),THREE.MathUtils.clamp(t,0,1));
 const tabby=['orange','maine'].includes(breed);
 // Body: soft bean torso with rounded haunches and a puffed chest.
 const bodyPattern=(x,y,z)=>{
  let c=C(coat);
  if(breed==='calico'){c=mix(c,patch,Math.max(blob(x,y,z,[-.22,.2,-.02,.28,.3,.32]),blob(x,y,z,[.24,.05,.3,.18,.2,.16])));c.lerp(C(dark),blob(x,y,z,[.22,.24,-.28,.26,.26,.26]));}
  if(tabby)c.lerp(C(patch),.85*ss(Math.cos(z*15+x*x*8),.35,.8)*ss(y,-.08,.14));
  if(breed==='ragdoll')c.lerp(C(patch),.35*ss(y,.05,.32)*ss(-z,.0,.4));
  return c.lerp(C(light),Math.max(ss(-y,.08,.24),ss(z,p.front*.45,p.front*.95)*ss(-y,-.12,.06))*(breed==='blue'?.6:1));
 };
 const body=grp(rig,[0,p.hip+.015,-.04]);
 const torsoForms=[[0,0,-.02,...p.body,.15],[0,.05,p.front*.8,p.body[0]*.82,p.body[1],.3,.17],[0,.2,p.front+.04,p.body[0]*.7,.28,.28,.17],[-p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6,p.body[1]*.85,.26,.12],[p.body[0]*.48,-.03,p.rear*.72,p.body[0]*.6,p.body[1]*.85,.26,.12]];
 if(p.ruff)torsoForms.push([0,.1,p.front+.1,p.body[0]*.92,.3,.24,.12]);
 const torsoGeometry=sculptSurface(torsoForms,[.8,.85,1.1],softMaterial,[],52);
 tintSurface(torsoGeometry,bodyPattern);owned.add(torsoGeometry);const torso=new THREE.Mesh(torsoGeometry,softMaterial);torso.castShadow=torso.receiveShadow=true;body.add(torso);
 const legs=[],pawColor={calico:light,ragdoll:light,maine:light,orange:light}[breed]||coat;
 for(let i=0;i<4;i++){
  const front=i<2,side=i%2?-1:1,hip=grp(rig,[side*p.body[0]*.62,p.hip,front?p.front:p.rear]);
  const upper=p.hip*.52,lower=p.hip*.52,legColor=breed==='calico'?light:coat;
  if(front)soft(hip,new THREE.CapsuleGeometry(.115,upper*.8,6,18),legColor,[0,-upper*.45,0]);else soft(hip,sphere,legColor,[0,-upper*.3,-.01],[.15,upper*.78,.19]);
  const knee=grp(hip,[0,-upper,0]);soft(knee,new THREE.CapsuleGeometry(.088,lower*.8,6,16),legColor,[0,-lower*.5,0]);
  const ankle=grp(knee,[0,-lower,0]);soft(ankle,sphere,pawColor,[0,.06,.04],[.112,.075,.14]);
  hip.userData={knee,ankle,upper,lower,front,side,rest:hip.position.clone()};legs.push(hip);
 }
 // Tail: a tapered question-mark curve, striped for tabbies and fluffed for long-haired breeds.
 const tail=grp(rig,[0,p.hip+.05,p.rear-.13]);
 const tailCurve=new THREE.CatmullRomCurve3([[0,0,0],[0,.12,-.24],[.05,.42,-.44],[.09,.72,-.46],[.03,.9,-.32]].map(v=>new THREE.Vector3(...v)));
 const tailRadius=t=>p.tail*(1.15-.35*t)*(p.ruff?1+.4*Math.sin(Math.PI*Math.min(1,t*1.2)):1);
 const tailColor=t=>breed==='calico'?C(dark):tabby?mix(coat,patch,ss(Math.sin(t*Math.PI*9),.1,.6)):breed==='ragdoll'?mix(coat,patch,ss(t,.05,.35)):C(coat);
 const tailGeometry=new THREE.TubeGeometry(tailCurve,48,1,18,false),tp=tailGeometry.attributes.position,center=new THREE.Vector3(),v=new THREE.Vector3(),tailColors=[];
 for(let i=0;i<=48;i++){const t=i/48,r=tailRadius(t),col=tailColor(t);tailCurve.getPointAt(t,center);for(let j=0;j<=18;j++){const k=i*19+j;v.fromBufferAttribute(tp,k).sub(center).multiplyScalar(r).add(center);tp.setXYZ(k,v.x,v.y,v.z);tailColors.push(col.r,col.g,col.b);}}
 tailGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tailColors,3));owned.add(tailGeometry);const tailMesh=new THREE.Mesh(tailGeometry,softMaterial);tailMesh.castShadow=true;tail.add(tailMesh);
 soft(tail,sphere,'#'+tailColor(1).getHexString(),tailCurve.getPointAt(1).toArray(),Array(3).fill(tailRadius(1)));
 // Head: round skull with chubby cheeks and a small muzzle, painted with soft-edged markings and blush.
 const head=grp(rig,[0,p.headY,p.headZ]);const [hw,hh,hd]=p.head;
 const headPattern=(x,y,z)=>{
  let c=C(coat);const face=ss(z,.05,.22);
  if(breed==='calico'){c=mix(c,patch,blob(x,y,z,[-.3,.2,.1,.3,.3,.5]));c.lerp(C(dark),blob(x,y,z,[.34,.3,0,.26,.24,.5]));c.lerp(C(light),(1-ss(Math.abs(x),.05+(.2-y)*.18,.1+(.2-y)*.18))*face);}
  if(breed==='ragdoll'){c.lerp(C(patch),(1-ss(Math.hypot(x*.8,(y+.02)*1.1),.24,.4))*ss(z,-.05,.12));c.lerp(C(light),(1-ss(Math.abs(x),.03+(.04-y)*.55,.07+(.04-y)*.55))*ss(-y,-.04,.02)*face);}
  if(tabby){c.lerp(C(patch),.9*ss(Math.cos(x*34),.5,.85)*ss(y,.14,.26)*face*(1-ss(Math.abs(x),.16,.22)));c.lerp(C(patch),.75*ss(Math.cos(y*38+.6),.55,.9)*ss(Math.abs(x),hw*.62,hw*.78)*ss(-y,-.06,.04));}
  c.lerp(C(light),(1-ss(Math.hypot(x*.85,(y+.2)*1.15),.13,.22))*face*(breed==='blue'?.5:1));
  return c.lerp(C('#f4a3a6'),.5*Math.max(0,...[-1,1].map(s=>1-ss(Math.hypot(x-s*hw*.52,y+.11),.02,.1)))*face);
 };
 const ch=p.chubby?1.12:1,headForms=[[0,.015,-.02,hw,hh,hd,.12],[-hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[hw*.48,-.105,.05,hw*.51*ch,.245*ch,.28,.14],[-.075,-.175,hd*.78,p.muzzle*.98,.092,p.flat?.085:.13,.075],[.075,-.175,hd*.78,p.muzzle*.98,.092,p.flat?.085:.13,.075],[0,-.255,hd*.65,.105,.065,.11,.075]];
 const headGeometry=sculptSurface(headForms,[.86,.83,.8],softMaterial,[],60);
 tintSurface(headGeometry,headPattern);owned.add(headGeometry);const faceMesh=new THREE.Mesh(headGeometry,softMaterial);faceMesh.castShadow=faceMesh.receiveShadow=true;head.add(faceMesh);
 faceMesh.name='sculpted-face';
 const projectFace=faceProjector(headGeometry,softMaterial);
 // Plush ears: bevelled rounded triangles with a flat pink inner panel.
 const ew=p.earWidth*1.5,eh=p.ear+.12,earDepth=.035,earBevel=.03;
 const earGeometry=new THREE.ExtrudeGeometry(earShape(ew,eh),{depth:earDepth,bevelEnabled:true,bevelThickness:earBevel,bevelSize:.026,bevelSegments:5,curveSegments:18}).translate(0,0,-earDepth/2);
 const innerGeometry=new THREE.ShapeGeometry(earShape(ew*.58,eh*.68),18);
 for(const side of [-1,1]){
  const ear=grp(head,[side*hw*.55,hh*.66,-.03]);ear.rotation.set(-.12,side*.28,-side*.3);
  const earColor=breed==='calico'?(side<0?patch:dark):breed==='ragdoll'?dark:tabby?patch:coat;
  soft(ear,earGeometry,earColor);soft(ear,innerGeometry,earPink,[0,eh*.12,earDepth/2+earBevel+.002]);
  if(p.tufts)for(let j=-1;j<=1;j++)line(ear,dark,[[0,eh*.92,0],[j*.025,eh*1.12+.03*(1-Math.abs(j)),-.01]],.006);
 }
 // Satin eyes follow the face; restrained specular light leaves the expression readable.
 const eyeMap=eyeTexture(eyeColor),eyeMat=new THREE.MeshPhysicalMaterial({map:eyeMap,roughness:.52,clearcoat:.12,clearcoatRoughness:.38,specularIntensity:.28,envMapIntensity:.3});mats.set('eye',eyeMat);
 const eyes=[],er=p.eye*.94,eyeX=hw*.405,eyeY=p.flat?.055:.045;
 for(const side of [-1,1]){
  const x=side*eyeX,eye=grp(head,[x,eyeY,0]);
  const eyeGeometry=fittedEyeGeometry(projectFace,x,eyeY,er*1.04,er*.97);owned.add(eyeGeometry);
  const dome=new THREE.Mesh(eyeGeometry,eyeMat);dome.name='fitted-eye';eye.add(dome);
  const lid=grp(head,[x,eyeY,0]);
  const lidPoints=[[-.78,-.1],[-.4,.20],[0,.29],[.4,.20],[.78,-.1]].map(([u,v])=>[u*er,v*er,projectFace(x+u*er,eyeY+v*er)+.012]);
  line(lid,'#57443d',lidPoints,.009);lid.visible=false;eye.userData.lid=lid;eyes.push(eye);
  for(let i=0;i<2;i++)line(head,breed==='blue'||breed==='maine'?'#e9e4dc':'#cbbcb2',[[side*.15,-.19-i*.035,hd*.86],[side*(hw*.82),-.17-i*.06,hd*.6],[side*(hw+.1),-.15-i*.1,hd*.3]],.0035);
 }
 // A soft rounded-triangle nose and an ω mouth.
 const noseY=-.137,noseZ=projectFace(0,noseY)+.012;
 soft(head,sphere,noseColor,[0,noseY,noseZ],[.047,.028,.021]);soft(head,sphere,noseColor,[0,noseY-.02,noseZ-.002],[.026,.024,.019]);
 const noseShine=ell(head,'#fff3f0',[-.012,noseY+.007,noseZ+.019],[.011,.004,.002]);
 noseShine.material=new THREE.MeshBasicMaterial({color:'#fff3f0',transparent:true,opacity:.4});mats.set('nose-shine',noseShine.material);
 const mouthColor='#73534e';
 const mouthLine=pts=>line(head,mouthColor,pts.map(([x,y])=>[x,y,projectFace(x,y)+.008]),.0065);
 for(const s of [-1,1])mouthLine([[0,-.181],[s*.014,-.205],[s*.039,-.213],[s*.065,-.196]]);
 mouthLine([[0,-.16],[0,-.185]]);
 function coatLayer(color,include){const pos=torsoGeometry.attributes.position,norm=torsoGeometry.attributes.normal,vertices=[],normals=[];for(let i=0;i<pos.count;i+=3){const x=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,y=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3,z=(pos.getZ(i)+pos.getZ(i+1)+pos.getZ(i+2))/3;if(!include(x,y,z))continue;for(let j=0;j<3;j++){const k=i+j;vertices.push(pos.getX(k)+norm.getX(k)*.028,pos.getY(k)+norm.getY(k)*.028,pos.getZ(k)+norm.getZ(k)*.028);normals.push(norm.getX(k),norm.getY(k),norm.getZ(k));}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));const m=shape(body,g,color);m.material=material(color).clone();m.material.side=THREE.DoubleSide;mats.set(`garment-${color}`,m.material);return m;}
 const clothes=grp(rig),acc=grp(head);const neckY=p.headY-.29,neckZ=p.headZ-.18;
 if(outfit==='bow'||outfit==='sailor'){
  const color=outfit==='bow'?'#c76b89':'#497a9d';const collar=shape(clothes,new THREE.TorusGeometry(p.head[0]*.68,.036,8,40),color,[0,neckY,neckZ]);collar.rotation.x=Math.PI/2;
  for(const s of [-1,1]){const wing=ell(clothes,color,[s*.105,neckY-.02,neckZ+.33],[.14,.085,.058]);wing.rotation.z=s*.3;}ell(clothes,'#e9c981',[0,neckY-.02,neckZ+.39],[.055,.057,.035]);
 }
 if(outfit==='sailor'){
  coatLayer('#779fb8',(x,y,z)=>z<p.front-.10&&z>p.rear+.02);
  shape(acc,new THREE.CylinderGeometry(.23,.28,.09,32),'#fff5e5',[.04,p.head[1]+.08,-.04]);shape(acc,new THREE.CylinderGeometry(.17,.20,.07,32),'#608ca8',[.04,p.head[1]+.15,-.04]);
 }
 if(outfit==='cape'){
  coatLayer('#8466a2',(x,y,z)=>y>.10&&z<p.front-.02&&z>p.rear-.02);
  shape(acc,new THREE.ConeGeometry(.24,.50,24),'#8466a2',[0,p.head[1]+.27,-.07]);ell(acc,'#efd081',[0,p.head[1]+.24,.08],[.04,.05,.02]);
 }
 if(outfit==='crown'){
  shape(acc,new THREE.CylinderGeometry(.24,.23,.12,32),'#dab263',[0,p.head[1]+.10,0]);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;shape(acc,new THREE.ConeGeometry(.07,.22,4),'#e7c87e',[Math.cos(a)*.19,p.head[1]+.25,Math.sin(a)*.19]);}
 }
 const mouth=grp(head,[0,-.25,noseZ+.10]);const top=grp(head,[0,p.head[1]+.16,0]);
 root.scale.setScalar(p.scale);root.userData={breed,rig,head,tail,eyes,legs,body,baseScale:p.scale,outfit,profile:p,mouth,top,gait:0,ownedGeometries:owned,ownedMaterials:new Set(mats.values())};
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
