import * as THREE from 'three';
import {sculptSurface,tintSurface,fineFur} from './organic-surface.js';

// Anatomy is expressed in local units; all breeds share a four-paw rig, not a silhouette.
export const CAT_PROFILES = {
 calico:{body:[.34,.33,.61],head:[.49,.46,.41],hip:.55,front:.36,rear:-.39,headY:.94,headZ:.56,ear:.25,earWidth:.21,tail:.105,scale:.98,eye:.148,muzzle:.12},
 ragdoll:{body:[.40,.36,.66],head:[.55,.50,.43],hip:.54,front:.38,rear:-.42,headY:.97,headZ:.60,ear:.24,earWidth:.23,tail:.17,scale:1.02,eye:.164,muzzle:.13,ruff:true},
 maine:{body:[.39,.37,.77],head:[.52,.47,.44],hip:.67,front:.49,rear:-.52,headY:1.13,headZ:.72,ear:.33,earWidth:.22,tail:.17,scale:1.10,eye:.143,muzzle:.15,ruff:true,tufts:true},
 persian:{body:[.43,.33,.56],head:[.58,.49,.38],hip:.42,front:.32,rear:-.35,headY:.83,headZ:.49,ear:.17,earWidth:.22,tail:.15,scale:.98,eye:.163,muzzle:.10,ruff:true,flat:true},
 orange:{body:[.44,.38,.64],head:[.54,.47,.43],hip:.50,front:.37,rear:-.41,headY:.93,headZ:.58,ear:.24,earWidth:.24,tail:.125,scale:1.01,eye:.151,muzzle:.13},
 blue:{body:[.43,.36,.58],head:[.57,.50,.43],hip:.48,front:.34,rear:-.37,headY:.89,headZ:.54,ear:.20,earWidth:.23,tail:.135,scale:.99,eye:.158,muzzle:.13}
};
const COATS={calico:['#fff3df','#c88955','#463934','#8cae82'],ragdoll:['#fff1dc','#907866','#554639','#74b4d1'],maine:['#938074','#5d504c','#493e3c','#aec36e'],persian:['#edc894','#ca9e6d','#976f57','#c79043'],orange:['#df9247','#ad5b30','#85503c','#b99147'],blue:['#8e9cab','#728292','#526373','#cdaa6c']};
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
export function createCat(breed='calico',outfit='none'){
 const p=CAT_PROFILES[breed]||CAT_PROFILES.calico,[coat,patch,dark,eyeColor]=COATS[breed]||COATS.calico;
 const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
 const owned=new Set(),sphere=new THREE.SphereGeometry(1,40,32);owned.add(sphere);
 const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.84,metalness:0}));return mats.get(c);};
 function shape(parent,g,c,pos=[0,0,0],scale=[1,1,1]){owned.add(g);const m=new THREE.Mesh(g,material(c));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const ell=(parent,c,pos,s)=>shape(parent,sphere,c,pos,s);
 const grp=(parent,pos=[0,0,0])=>{const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;};
 const line=(parent,c,pts,r=.012)=>shape(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>new THREE.Vector3(...v))),16,r,6,false),c);
 function paint(mesh,pick){
  const geometry=mesh.geometry.clone();owned.add(geometry);const coords=geometry.attributes.position,colors=[];
  for(let i=0;i<coords.count;i++){const color=new THREE.Color(pick(coords.getX(i),coords.getY(i),coords.getZ(i)));colors.push(color.r,color.g,color.b);}
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));mesh.geometry=geometry;
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88});mats.set(`paint-${mats.size}`,m);mesh.material=m;
 }
 const softMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.98});mats.set('sculpted-coat',softMaterial);
 const bodyPattern=(x,y,z)=>breed==='calico'?(x<-.15&&z<.16?patch:x>.15&&z<-.13?dark:coat):['orange','maine'].includes(breed)&&Math.abs(x)>.21&&Math.cos(z*21+Math.abs(x)*2)>.76?patch:coat;
 const body=grp(rig,[0,p.hip+.015,-.04]);
 const torsoGeometry=sculptSurface([[0,0,-.02,...p.body,.15],[0,.055,p.front*.82,p.body[0]*.79,p.body[1]*1.02,.29,.17],[0,.18,p.front+.035,p.body[0]*.72,.29,.29,.17]],[.8,.85,1.1],softMaterial);
 tintSurface(torsoGeometry,bodyPattern);owned.add(torsoGeometry);const torso=new THREE.Mesh(torsoGeometry,softMaterial);torso.castShadow=torso.receiveShadow=true;body.add(torso);
 function addFur(parent,g,pattern,count,length,mask){const fur=fineFur(g,pattern,count,length,mask);parent.add(fur);owned.add(fur.geometry);mats.set(`fur-${mats.size}`,fur.material);return fur;}
 if(!['sailor','cape'].includes(outfit))addFur(body,torsoGeometry,bodyPattern,p.ruff?11000:7800,p.ruff?.065:.036);
 const legs=[];
 for(let i=0;i<4;i++){
  const front=i<2,side=i%2?-1:1,hip=grp(rig,[side*p.body[0]*.65,p.hip,front?p.front:p.rear]);
  const upper=p.hip*.52,lower=p.hip*.52,upperMesh=ell(hip,coat,[0,-upper*.43,0],[front?.132:.158,upper*.92,.150]);
  const knee=grp(hip,[0,-upper,0]);const shin=ell(knee,coat,[0,-lower*.43,0],[.119,lower*.83,.126]);
  const furUpper=upperMesh.geometry.clone().scale(...upperMesh.scale.toArray()).translate(...upperMesh.position.toArray());addFur(hip,furUpper,()=>coat,1700,.025);furUpper.dispose();
  const furShin=shin.geometry.clone().scale(...shin.scale.toArray()).translate(...shin.position.toArray());addFur(knee,furShin,()=>coat,1200,.02);furShin.dispose();
  const ankle=grp(knee,[0,-lower,0]);const pawColor=['blue','maine','persian'].includes(breed)?coat:'#fff5e8';const paw=ell(ankle,pawColor,[0,.07,.055],[.138,.094,.175]);
  for(let j=-1;j<=1;j++)line(ankle,breed==='blue'?'#65788f':'#c8b4a4',[[j*.038,.073,.194],[j*.038,.048,.196]],.005);
  hip.userData={knee,ankle,upper,lower,front,side,rest:hip.position.clone()};legs.push(hip);
 }
 const tail=grp(rig,[0,p.hip+.05,p.rear-.13]);
 const tailPoints=[[0,0,0],[.10,.18,-.35],[.24,.52,-.62],[.29,.85,-.70],[.13,1.01,-.59]];
 const tailMesh=line(tail,breed==='calico'?dark:patch,tailPoints,p.tail);addFur(tail,tailMesh.geometry,()=>breed==='calico'?dark:patch,4000,p.ruff?.075:.035);
 const tipMesh=ell(tail,breed==='calico'?dark:patch,tailPoints.at(-1),[p.tail,p.tail,p.tail]);const tipGeo=tipMesh.geometry.clone().scale(p.tail,p.tail,p.tail).translate(...tailPoints.at(-1));addFur(tail,tipGeo,()=>breed==='calico'?dark:patch,1400,p.ruff?.075:.03);tipGeo.dispose();
 if(breed==='orange')paint(tailMesh,(x,y,z)=>Math.sin(y*25)>.52?dark:patch);
 const head=grp(rig,[0,p.headY,p.headZ]);
 const rawHeadPattern=(x,y,z)=>breed==='ragdoll'?(Math.abs(x)>.075+(y+.12)*.27&&z>.06&&y<.30?patch:coat):breed==='calico'?(((x+.30)/.29)**2+((y-.17)/.40)**2<1?patch:((x-.33)/.25)**2+((y-.22)/.32)**2<1?dark:coat):['orange','maine'].includes(breed)&&y>.22&&z>.14&&Math.cos(x*27)>.78?patch:coat;
 const headPattern=(x,y,z)=>{const eh=(y-p.head[1]*.76)/(p.ear*.70),ex=p.head[0]*(.60+.12*eh);if(eh>0&&eh<1&&z>.005&&Math.abs(Math.abs(x)-ex)<p.earWidth*.34*(1-eh))return new THREE.Color('#d6afa5');if(y>p.head[1]*.66&&Math.abs(x)>p.head[0]*.39&&['ragdoll','calico'].includes(breed))return new THREE.Color(breed==='calico'&&x>0?dark:patch);const base=new THREE.Color(rawHeadPattern(x,y,z));if(breed==='ragdoll'){const edge=Math.abs(x)-(.075+(y+.12)*.27),amount=THREE.MathUtils.smoothstep(edge,-.035,.06)*THREE.MathUtils.smoothstep(z,.0,.09)*(1-THREE.MathUtils.smoothstep(y,.21,.34));return new THREE.Color(coat).lerp(new THREE.Color(patch),amount);}return base;};
 const earForms=[];for(const side of [-1,1])earForms.push([side*p.head[0]*.55,p.head[1]*.69,-.065,p.earWidth*.67,.14,.14,.09],[side*p.head[0]*.64,p.head[1]*.69+p.ear*.34,-.065,p.earWidth*.48,p.ear*.57,.095,.06],[side*p.head[0]*.72,p.head[1]*.69+p.ear*.79,-.075,p.earWidth*.20,p.ear*.24,.052,.04]);
 const sockets=[-1,1].map(side=>[side*p.head[0]*.43,.025,p.head[2]*.70,p.eye*1.13]);
 const headGeometry=sculptSurface([[0,.025,-.02,...p.head,.12],[-p.head[0]*.53,-.16,.12,p.head[0]*.48,.24,.28,.12],[p.head[0]*.53,-.16,.12,p.head[0]*.48,.24,.28,.12],[-.10,-.21,p.head[2]*.73,.16,.13,p.flat?.10:.18,.08],[.10,-.21,p.head[2]*.73,.16,.13,p.flat?.10:.18,.08],[0,-.32,.17,.23,.12,.21,.10],...earForms],[.86,.83,.8],softMaterial,sockets,54);
 tintSurface(headGeometry,headPattern);owned.add(headGeometry);const faceMesh=new THREE.Mesh(headGeometry,softMaterial);faceMesh.castShadow=faceMesh.receiveShadow=true;head.add(faceMesh);
 addFur(head,headGeometry,headPattern,p.ruff?19000:13000,(q,n)=>n.z>.65&&q.z>.20?.017:p.ruff?.050:.029,q=>!sockets.some(c=>Math.hypot(q.x-c[0],q.y-c[1],q.z-c[2])<c[3]+.016));
 if(p.tufts)for(const side of [-1,1])for(let j=0;j<3;j++)line(head,dark,[[side*p.head[0]*.72,p.head[1]*.69+p.ear*.89,-.06],[side*(p.head[0]*.72+(j-1)*.023),p.head[1]*.69+p.ear+.05,-.07]],.005);
 const eyes=[],eyeZ=p.head[2]*.43,eyeX=p.head[0]*.43;
 const eyeMat=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.025,metalness:.02,clearcoat:1,clearcoatRoughness:.015,envMapIntensity:2.4,transparent:true,opacity:.27});mats.set('cornea',eyeMat);
 for(const side of [-1,1]){
  const eye=grp(head,[side*eyeX,.025,p.head[2]*.83]);eye.rotation.y=side*.48;
  ell(eye,'#493e36',[0,0,0],[p.eye*1.10,p.eye*1.17,p.eye*.98]);

  ell(eye,eyeColor,[0,0,p.eye*.82],[p.eye*.96,p.eye*1.04,.028]);
  // A radial iris texture gives fine fibres without hundreds of tiny meshes.
  const size=128,data=new Uint8Array(size*size*4),rgb=[1,3,5].map(i=>parseInt(eyeColor.slice(i,i+2),16));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=(x-size/2)/(size/2),dy=(y-size/2)/(size/2),r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),fibre=.11*Math.sin(a*71+r*15)+.055*Math.sin(a*127-r*24),shade=.88+fibre+.25*Math.sin(r*6)-.35*THREE.MathUtils.smoothstep(r,.85,1);const index=(y*size+x)*4;for(let c=0;c<3;c++)data[index+c]=Math.min(255,rgb[c]*shade+(1-r)*28);data[index+3]=r<1?255:0;}
  const irisTexture=new THREE.DataTexture(data,size,size);irisTexture.colorSpace=THREE.SRGBColorSpace;irisTexture.needsUpdate=true;irisTexture.magFilter=THREE.LinearFilter;
  const irisMaterial=new THREE.MeshStandardMaterial({map:irisTexture,transparent:true,roughness:.28});mats.set(`iris-${side}`,irisMaterial);
  const irisGeometry=new THREE.CircleGeometry(p.eye*.96,64);owned.add(irisGeometry);const iris=new THREE.Mesh(irisGeometry,irisMaterial);iris.position.z=p.eye*.99;iris.scale.y=1.08;eye.add(iris);

  const pupil=ell(eye,'#101c21',[.006,-.004,p.eye*1.05],[p.eye*.61,p.eye*.73,.024]);const pupilMat=new THREE.MeshPhysicalMaterial({color:0x101c21,roughness:.08,clearcoat:1,envMapIntensity:1.8});mats.set(`pupil-${side}`,pupilMat);pupil.material=pupilMat;
  const glass=new THREE.Mesh(sphere,eyeMat);glass.position.set(0,0,p.eye*.99);glass.scale.set(p.eye*1.01,p.eye*1.10,.044);eye.add(glass);
  ell(eye,'#fffdf4',[-p.eye*.29,p.eye*.42,p.eye*1.27],[p.eye*.18,p.eye*.20,.008]);
  ell(eye,'#fffdf4',[p.eye*.32,-p.eye*.35,p.eye*1.27],[p.eye*.075,p.eye*.08,.006]);
  ell(eye,breed==='ragdoll'?'#bbdef0':'#e5d9ad',[0,-p.eye*.65,p.eye*1.20],[p.eye*.31,p.eye*.045,.004]);
  for(const part of eye.children)part.position.z-=p.eye*.99;eye.scale.z=.35;
  const lid=grp(head,[side*eyeX,.025,p.head[2]*.82]);lid.rotation.y=side*.48;
  ell(lid,headPattern(side*eyeX,.025,p.head[2]*.78),[0,0,0],[p.eye*1.12,p.eye*1.13,.036]);line(lid,dark,[[-p.eye*.70,.008,.032],[0,-p.eye*.12,.040],[p.eye*.70,.008,.032]],.007);lid.visible=false;eye.userData.lid=lid;eyes.push(eye);
  for(let i=0;i<3;i++){ell(head,breed==='blue'?'#6a7e96':'#bc9b8c',[side*(.12+i*.025),-.15-(i%2)*.034,eyeZ+.139],[.008,.007,.005]);line(head,'#9b8a80',[[side*.22,-.16-i*.035,eyeZ+.075],[side*(p.head[0]+.01),-.15-i*.07,eyeZ],[side*(p.head[0]+.12),-.14-i*.085,eyeZ-.06]],.0038);}
 }
 // A soft heart-shaped nose and tiny split lip, with a small satin highlight.
 const noseZ=p.head[2]+(p.flat?.024:.085),noseColor=breed==='blue'?'#73849a':'#c68d91';
 ell(head,noseColor,[-.023,-.177,noseZ],[.035,.028,.026]);ell(head,noseColor,[.023,-.177,noseZ],[.035,.028,.026]);ell(head,noseColor,[0,-.197,noseZ],[.032,.026,.024]);
 ell(head,'#ebc5be',[-.012,-.17,noseZ+.024],[.018,.006,.004]);
 const mouthZ=noseZ-.008;line(head,dark,[[0,-.22,mouthZ],[0,-.255,mouthZ],[-.06,-.27,mouthZ-.01]],.006);line(head,dark,[[0,-.255,mouthZ],[.06,-.27,mouthZ-.01]],.006);
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
