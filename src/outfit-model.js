import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {surfaceProjector} from './organic-surface.js';
import {SLOTS,WARDROBE_BY_ID,normalizeOutfit} from './wardrobe.js';

// Builds the 3D pieces for a mix-and-match outfit onto an existing cat rig.
// Every piece hangs off the rig part it belongs to (head, body, leg joints, tail) so it moves with the walk cycle.
const ss=THREE.MathUtils.smoothstep,V=(x,y,z)=>new THREE.Vector3(x,y,z);
const toon=(hex)=>new THREE.Color(hex);

function makeKit(){
 const geometries=new Set(),materials=new Map(),meshes=[],animators=[],sphere=new THREE.SphereGeometry(1,28,20);geometries.add(sphere);
 const looks={fabric:{roughness:.86,sheen:.35,sheenRoughness:.6,sheenColor:'#ffffff'},shiny:{roughness:.35,clearcoat:.5},metal:{roughness:.32,metalness:.75},glass:{roughness:.05,transmission:0,transparent:true,opacity:.28,depthWrite:false},tint:{roughness:.15,transparent:true,opacity:.72},glow:{roughness:.4,emissiveIntensity:.9}};
 const mat=(color,look='fabric',extra={})=>{const key=`${look}-${color}-${JSON.stringify(extra)}`;if(!materials.has(key)){const o={...looks[look],...extra};if(look==='glow')o.emissive=color;if(color!=='vertex')o.color=color;else o.vertexColors=true;materials.set(key,new THREE.MeshPhysicalMaterial(o));}return materials.get(key);};
 const add=(parent,geometry,color,pos=[0,0,0],scale=[1,1,1],look,extra)=>{geometries.add(geometry);const m=new THREE.Mesh(geometry,typeof color==='object'&&color.isMaterial?color:mat(color,look,extra));m.position.set(...pos);m.scale.set(...(typeof scale==='number'?[scale,scale,scale]:scale));m.castShadow=true;m.receiveShadow=true;parent.add(m);meshes.push(m);return m;};
 const group=(parent,pos=[0,0,0])=>{const g=new THREE.Group();g.position.set(...pos);parent.add(g);meshes.push(g);return g;};
 const k={geometries,materials,meshes,animators,mat,add,group,
  ball:(p,c,pos,s,look,extra)=>add(p,sphere,c,pos,s,look,extra),
  tube:(p,c,pts,r=.015,look,extra)=>add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v=>Array.isArray(v)?V(...v):v)),Math.max(12,pts.length*8),r,8,false),c,[0,0,0],1,look,extra),
  ring:(p,c,pos,r,t,rot=[Math.PI/2,0,0],look,extra)=>{const m=add(p,new THREE.TorusGeometry(r,t,10,40),c,pos,1,look,extra);m.rotation.set(...rot);return m;},
  cone:(p,c,pos,r,h,seg=24,look,extra)=>add(p,new THREE.ConeGeometry(r,h,seg),c,pos,1,look,extra),
  cyl:(p,c,pos,rt,rb,h,look,extra)=>add(p,new THREE.CylinderGeometry(rt,rb,h,32),c,pos,1,look,extra),
  capsule:(p,c,pos,r,len,scale=1,look,extra)=>add(p,new THREE.CapsuleGeometry(r,len,6,18),c,pos,scale,look,extra),
  rbox:(p,c,pos,size,r=.03,look,extra)=>add(p,new RoundedBoxGeometry(...size,3,r),c,pos,1,look,extra),
  extrude:(p,c,shape,depth,pos,look,extra)=>add(p,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2,curveSegments:16}).translate(0,0,-depth/2),c,pos,1,look,extra),
  flat:(p,c,shape,pos,look,extra)=>add(p,new THREE.ShapeGeometry(shape,16),c,pos,1,look,{side:THREE.DoubleSide,...extra}),
  animate:fn=>animators.push(fn)
 };
 return k;
}
// Per-vertex colour for any geometry from a position-based pattern.
function paint(geometry,colorAt){const p=geometry.attributes.position,colors=new Float32Array(p.count*3),v=new THREE.Vector3();for(let i=0;i<p.count;i++){const c=colorAt(v.fromBufferAttribute(p,i));colors.set([c.r,c.g,c.b],i*3);}geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return geometry;}
// A tube whose radius follows radiusAt(t); used for tails, flopping hats and wrapped sleeves.
function taperedTube(curve,radiusAt,segments=40,sides=14){
 const g=new THREE.TubeGeometry(curve,segments,1,sides,false),p=g.attributes.position,c=V(0,0,0),v=V(0,0,0);
 for(let i=0;i<=segments;i++){const t=i/segments;curve.getPointAt(t,c);for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;v.fromBufferAttribute(p,k).sub(c).multiplyScalar(radiusAt(t)).add(c);p.setXYZ(k,v.x,v.y,v.z);}}
 g.computeVertexNormals();return g;
}
const subCurve=(curve,a,b)=>Object.assign(new THREE.Curve(),{getPoint:(t,target=V(0,0,0))=>curve.getPointAt(a+(b-a)*t,target)});
// Loop subdivision-free densify: split each triangle into four so projected decals follow curved faces.
function densify(geometry,levels=3){
 let p=Array.from((geometry.index?geometry.toNonIndexed():geometry).attributes.position.array);
 for(let l=0;l<levels;l++){const n=[];for(let i=0;i<p.length;i+=9){const a=p.slice(i,i+3),b=p.slice(i+3,i+6),c=p.slice(i+6,i+9),m=(u,v)=>u.map((x,j)=>(x+v[j])/2),ab=m(a,b),bc=m(b,c),ca=m(c,a);n.push(...a,...ab,...ca,...ab,...b,...bc,...ca,...bc,...c,...ab,...bc,...ca);}p=n;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;
}

// Garment fabrics: c = [main, accent, third]. Coordinates are body-local (z forward, y up).
const PATTERNS={
 stripes:(c)=>v=>toon(Math.sin(v.z*38)>0?c[0]:c[1]),
 knit:(c)=>v=>toon(c[0]).lerp(toon(c[1]),ss(Math.sin(v.x*70+Math.sin(v.y*30)*2),.3,.9)),
 dots:(c)=>v=>toon(Math.hypot(((v.x*9+50)%1)-.5,((v.z*9+50)%1)-.5)<.22?c[1]:c[0]),
 stars:(c)=>v=>{const a=((v.x*8+50)%1)-.5,b=((v.z*8+Math.floor(v.x*8)*.5+50)%1)-.5;return toon(Math.hypot(a,b)<.16?c[1]:c[0]);},
 flowers:(c)=>v=>{const a=((v.x*7+50)%1)-.5,b=((v.z*7+50)%1)-.5,r=Math.hypot(a,b),ang=Math.atan2(b,a);return toon(r<.08?c[2]:r<.2+.06*Math.cos(ang*5)?c[1]:c[0]);},
 sakura:(c)=>v=>{const a=((v.x*6+50)%1)-.5,b=((v.z*6+.3*Math.floor(v.x*6)+50)%1)-.5,r=Math.hypot(a,b),ang=Math.atan2(b,a);return toon(r<.05?c[2]:r<.15+.05*Math.cos(ang*5)?c[1]:c[0]);},
 bands:(c)=>v=>toon(Math.sin(v.z*24)>.1?c[0]:c[1]),
 rainbow:(c)=>v=>toon(c[Math.max(0,Math.min(c.length-1,Math.floor((v.y+.4)*c.length/.9)))]),
 plaid:(c)=>v=>{const a=Math.sin(v.x*40)>.4,b=Math.sin(v.z*40)>.4;return toon(c[0]).lerp(toon(c[1]),(a?.45:0)+(b?.45:0));},
 grass:(c)=>v=>toon(c[0]).lerp(toon(c[1]),ss(Math.sin(Math.atan2(v.y,v.x)*26),.2,.9)),
 scales:(c)=>v=>{const a=Math.atan2(v.y,v.x)*5,row=Math.floor(v.z*16),u=((a+row*.5)%1+1)%1-.5,w=((v.z*16)%1+1)%1;return toon(c[0]).lerp(toon(c[1]),ss(Math.hypot(u,w-.1),.35,.5));}
};
const solid=hex=>()=>toon(hex);
function context(cat){
 const d=cat.userData,p=d.profile,a=d.anchors;
 a.front??=surfaceProjector(a.torsoGeometry,{u:0,v:1,w:2});// chest depth at (x,y)
 a.top??=surfaceProjector(a.torsoGeometry,{u:0,v:2,w:1});// back height at (x,z)
 const [hw,hh,hd]=p.head;
 return {d,p,a,hw,hh,hd,crown:hh*.93,
  get neck(){return a.neck??=neckline(d);},
  backY:(x,z)=>a.top(x,z,p.body[1]*.8),chestZ:(x,y)=>a.front(x,y,p.front+.2),
  // Vertex-coloured shell over part of the torso, slightly inflated.
  shell(k,include,colorAt,offset=.024,extra={}){
   const source=d.skin.geometry,pos=source.attributes.position,nor=source.attributes.normal,ix=source.index,skinIndex=source.attributes.skinIndex,skinWeight=source.attributes.skinWeight;
   const verts=[],norms=[],cols=[],bones=[],weights=[],base=d.body.position;
   const neckTop=p.headY-p.head[1]*.72;
   const inside=v=>v.y<=neckTop&&v.y>=p.hip*.38&&include(v.x-base.x,v.y-base.y,v.z-base.z);
   const vertex=j=>{
    const w=new Map();for(let n=0;n<4;n++){const bone=skinIndex.getComponent(j,n);w.set(bone,(w.get(bone)||0)+skinWeight.getComponent(j,n));}
    return {p:V(pos.getX(j),pos.getY(j),pos.getZ(j)),n:V(nor.getX(j),nor.getY(j),nor.getZ(j)),w};
   };
   const interpolate=(a,b,t)=>{
    const w=new Map();for(const [i,value] of a.w)w.set(i,value*(1-t));for(const [i,value] of b.w)w.set(i,(w.get(i)||0)+value*t);
    return {p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),w};
   };
   const emit=v=>{
    const c=colorAt(v.p.clone().sub(base)),pp=v.p.clone().addScaledVector(v.n,offset);
    verts.push(pp.x,pp.y,pp.z);norms.push(v.n.x,v.n.y,v.n.z);cols.push(c.r,c.g,c.b);
    const ws=[...v.w].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=ws.reduce((n,e)=>n+e[1],0);
    for(let i=0;i<4;i++){bones.push(ws[i]?.[0]||0);weights.push((ws[i]?.[1]||0)/sum);}
   };
   for(let i=0;i<ix.count;i+=3){
    const original=[vertex(ix.getX(i)),vertex(ix.getX(i+1)),vertex(ix.getX(i+2))],polygon=[];
    // Clip boundary triangles instead of dropping whole faces, so hems stay smooth.
    for(let j=0;j<3;j++){
     const a=original[j],b=original[(j+1)%3],aIn=inside(a.p),bIn=inside(b.p);
     if(aIn)polygon.push(a);
     if(aIn!==bIn){let lo=0,hi=1;for(let n=0;n<18;n++){const t=(lo+hi)/2;if(inside(a.p.clone().lerp(b.p,t))===aIn)lo=t;else hi=t;}polygon.push(interpolate(a,b,(lo+hi)/2));}
    }
    for(let j=1;j<polygon.length-1;j++)for(const v of [polygon[0],polygon[j],polygon[j+1]])emit(v);
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
   const garment=new THREE.SkinnedMesh(g,k.mat('vertex',extra.look||'fabric',{side:THREE.DoubleSide,...(extra.material||{})}));
   garment.castShadow=garment.receiveShadow=true;d.rig.add(garment);garment.bind(d.skeleton,d.skin.bindMatrix);k.geometries.add(g);k.meshes.push(garment);return garment;
  },
  // Flat outline (head-space x/y) fitted onto the sculpted face, `lift` above the skin.
  decal(k,shape,color,lift=.012,look='shiny',extra={}){
   const g=densify(new THREE.ShapeGeometry(shape,24),2),pp=g.attributes.position;
   for(let i=0;i<pp.count;i++)pp.setZ(i,a.projectFace(pp.getX(i),pp.getY(i),hd*.6)+lift);
   g.computeVertexNormals();return k.add(d.head,g,color,[0,0,0],1,look,{side:THREE.DoubleSide,...extra});
  },
  faceLine(k,color,pts,r,lift=.016,look='shiny'){return k.tube(d.head,color,pts.map(([x,y])=>[x,y,a.projectFace(x,y,hd*.6)+lift]),r,look);}
 };
}

const HEAD={
 beret(k,x,it){const c=it.c,g=k.group(x.d.head,[.04,x.crown-.02,-.02]);g.rotation.z=-.22;k.ball(g,c[0],[0,.03,0],[x.hw*.62,.1,x.hw*.58]);k.ball(g,c[1],[0,.14,0],[.035,.05,.035]);
  if(it.berry){for(let i=0;i<14;i++){const a=i*2.4,r=.1+(i%3)*.11;k.ball(g,c[2],[Math.cos(a)*r,.08+.03*(1-r/.35),Math.sin(a)*r],.014);}for(let i=0;i<5;i++){const leaf=k.ball(g,c[1],[Math.cos(i*1.26)*.06,.11,Math.sin(i*1.26)*.06],[.06,.015,.025]);leaf.rotation.y=-i*1.26;}}},
 crown(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.01,-.02]),r=x.hw*.46;k.cyl(g,c[0],[0,.04,0],r,r*.96,.09,'metal');
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;k.cone(g,c[0],[Math.cos(a)*r*.95,.15,Math.sin(a)*r*.95],.05,.15,4,'metal');k.ball(g,i%2?c[1]:c[2],[Math.cos(a)*r*1.0,.04,Math.sin(a)*r*1.0],.026,'shiny');}},
 cone(k,x,it){const c=it.c,h=it.height,g=k.group(x.d.head,[0,x.crown-.03,-.04]);g.rotation.x=-.18;g.rotation.z=-.1;
  if(it.brim){const b=k.cyl(g,c[0],[0,.0,0],x.hw*.95,x.hw*.95,.022);b.scale.z=.9;}
  const body=paint(new THREE.ConeGeometry(x.hw*.42,h,32,8).translate(0,h/2,0),v=>toon(it.stripes&&Math.sin(v.y*40)>0?c[1]:c[0]));
  if(it.flop){const curve=new THREE.CatmullRomCurve3([V(0,0,0),V(0,h*.55,0),V(.08,h*.82,-.05),V(.24,h*.7,-.1)]);k.add(g,taperedTube(curve,t=>x.hw*.42*(1-t*.86)),c[0]);k.ball(g,c[1],[.25,h*.68,-.1],.07);}
  else k.add(g,body,'vertex');
  if(it.fur)k.ring(g,c[1],[0,.02,0],x.hw*.43,.05);
  if(it.pom&&!it.flop)k.ball(g,c[1],[0,h+.03,0],.055);
  if(it.stars)for(let i=0;i<5;i++){const a=i*1.9,y=.08+i*.09,r=x.hw*.42*(1-y/h)+.005;k.ball(g,c[1],[Math.cos(a)*r,y,Math.sin(a)*r],.022,'glow');}},
 horn(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.02,.1]);g.rotation.x=.35;
  k.add(g,paint(new THREE.ConeGeometry(.06,.34,24,16).translate(0,.17,0),v=>toon(Math.sin(v.y*55+Math.atan2(v.z,v.x)*2)>0?c[0]:c[1])),'vertex',[0,0,0],1,'shiny');
  for(let i=0;i<5;i++)k.ball(g,i%2?c[1]:c[2],[Math.cos(i*1.25)*.11,.0,Math.sin(i*1.25)*.08-.02],.035);},
 tophat(k,x,it){const c=it.c,g=k.group(x.d.head,[.03,x.crown-.02,-.03]);g.rotation.z=-.12;k.cyl(g,c[0],[0,0,0],x.hw*.7,x.hw*.7,.022);k.cyl(g,c[0],[0,.15,0],x.hw*.36,x.hw*.38,.3);k.cyl(g,c[1],[0,.045,0],x.hw*.385,x.hw*.385,.05);k.ball(g,c[2],[x.hw*.3,.07,.06],.035);},
 chef(k,x,it){const c=it.c[0],g=k.group(x.d.head,[0,x.crown-.02,-.03]);k.cyl(g,c,[0,.06,0],x.hw*.4,x.hw*.42,.12);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;k.ball(g,c,[Math.cos(a)*.11,.22,Math.sin(a)*.11],.1);}k.ball(g,c,[0,.27,0],.12);},
 propeller(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.04,-.02]);k.ball(g,c[0],[0,0,0],[x.hw*.48,.13,x.hw*.46]);k.cyl(g,c[2],[0,.12,0],.012,.012,.12,'metal');const spin=k.group(g,[0,.19,0]);
  for(let i=0;i<4;i++){const blade=k.ball(spin,c[1+i%3],[Math.cos(i*Math.PI/2)*.12,0,Math.sin(i*Math.PI/2)*.12],[.12,.012,.04]);blade.rotation.y=-i*Math.PI/2;}k.animate(t=>spin.rotation.y=t*14);},
 wreath(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.06,0]),r=x.hw*.6;g.rotation.x=.1;k.ring(g,c[3],[0,0,0],r,.022);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,f=k.group(g,[Math.cos(a)*r,.02,Math.sin(a)*r]);for(let j=0;j<5;j++)k.ball(f,c[i%3],[Math.cos(j*1.26)*.03,.0,Math.sin(j*1.26)*.03],[.028,.014,.028]);k.ball(f,'#ffe08a',[0,.01,0],.016);}},
 frog(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown+.08,-.02]);k.ball(g,c[0],[0,0,0],[x.hw*.5,.11,x.hw*.46]);
  for(const s of [-1,1]){k.ball(g,c[0],[s*.13,.1,.05],.08);k.ball(g,c[1],[s*.13,.12,.11],.048);k.ball(g,c[2],[s*.13,.13,.15],.022);}k.tube(g,'#d05a5a',[[-.08,.02,x.hw*.45],[0,-.01,x.hw*.47],[.08,.02,x.hw*.45]],.008);},
 helmet(k,x,it){const c=it.c,g=k.group(x.d.head,[0,-.02,0]),r=Math.max(x.hw,x.hh)*1.42;k.ball(g,c[1],[0,0,0],[r,r*.94,r*.96],'glass');k.ring(g,c[0],[0,-r*.78,0],r*.62,.06,[Math.PI/2,0,0],'shiny');k.cyl(g,c[0],[r*.55,r*.55,-.05],.012,.012,.18,'metal');k.ball(g,c[2],[r*.62,r*.68,-.05],.03,'glow');},
 cowboy(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.01,-.04]);g.rotation.x=-.22;
  const brim=new THREE.LatheGeometry([[0,0],[x.hw*.95,0],[x.hw*1.12,.06],[x.hw*1.16,.09]].map(([r,y])=>new THREE.Vector2(r,y)),40);const b=k.add(g,brim,c[0],[0,0,0],1,'fabric',{side:THREE.DoubleSide});b.scale.z=.85;
  k.add(g,new THREE.LatheGeometry([[x.hw*.42,0],[x.hw*.42,.16],[x.hw*.3,.22],[0,.2]].map(([r,y])=>new THREE.Vector2(r,y)),32),c[0]);k.cyl(g,c[1],[0,.035,0],x.hw*.425,x.hw*.425,.04);},
 bunny(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.06,-.06]);k.tube(g,'#e7a6b8',[[-x.hw*.62,-.06,0],[-x.hw*.3,.05,0],[0,.08,0],[x.hw*.3,.05,0],[x.hw*.62,-.06,0]],.018,'shiny');
  for(const s of [-1,1]){const ear=k.group(g,[s*.11,.06,0]);ear.rotation.z=-s*.18;k.capsule(ear,c[0],[0,.18,0],.055,.26,[1,1,.5]);k.capsule(ear,c[1],[0,.18,.02],.032,.2,[1,1,.4]);k.animate(t=>ear.rotation.z=-s*(.18+Math.sin(t*2+s)*.06));}},
 halo(k,x,it){const g=k.group(x.d.head,[0,x.crown+.17,-.02]);k.ring(g,it.c[0],[0,0,0],x.hw*.36,.022,[Math.PI/2,0,0],'glow');k.animate(t=>{g.position.y=x.crown+.17+Math.sin(t*2.2)*.025;g.rotation.y=t*.6;});},
 pirate(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown+.01,-.03]);g.rotation.x=-.1;const s=new THREE.Shape(),w=x.hw*.98;s.moveTo(-w,0);s.bezierCurveTo(-w*.6,.08,-w*.4,.3,0,.3);s.bezierCurveTo(w*.4,.3,w*.6,.08,w,0);s.lineTo(-w,0);
  k.extrude(g,c[0],s,.14,[0,0,0]);k.tube(g,c[2],[[-w*.95,.02,.075],[-w*.4,.24,.075],[0,.285,.075],[w*.4,.24,.075],[w*.95,.02,.075]],.01,'metal');const skull=k.group(g,[0,.14,.08]);k.ball(skull,c[1],[0,0,0],[.05,.045,.012]);k.ball(skull,c[0],[-.018,.005,.01],.011);k.ball(skull,c[0],[.018,.005,.01],.011);},
 beanie(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.hh*.3,-.03]);const dome=paint(new THREE.SphereGeometry(1,36,24,0,Math.PI*2,0,Math.PI*.55),v=>toon(Math.sin(Math.atan2(v.z,v.x)*14)>0?c[0]:toon(c[0]).lerp(toon(c[1]),.25)));
  k.add(g,dome,'vertex',[0,0,0],[x.hw*1.04,x.hh*.88,x.hd*1.02]);k.ring(g,c[1],[0,x.hh*.06,0],x.hw*1.0,.04,[Math.PI/2,0,0]).scale.y=x.hd/x.hw;k.ball(g,c[1],[0,x.hh*.9,0],.08);
  for(const s of [-1,1])k.ball(g,c[0],[s*x.hw*.6,x.hh*.62,0],[.08,.1,.06]);return {hideEars:true};},
 mushroom(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown+.01,-.03]);k.ball(g,c[0],[0,.02,0],[x.hw*.75,.17,x.hw*.72]);k.cyl(g,c[1],[0,-.01,0],x.hw*.5,x.hw*.5,.04);
  for(let i=0;i<7;i++){const a=i*2.3,r=i?.15+(i%2)*.1:0;k.ball(g,c[1],[Math.cos(a)*r,.15-r*.25,Math.sin(a)*r],.035);}},
 sprout(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.02,.02]);k.tube(g,c[1],[[0,0,0],[.01,.08,0],[-.01,.14,0]],.012);for(const s of [-1,1]){const leaf=k.ball(g,c[0],[s*.06,.16,0],[.07,.022,.04]);leaf.rotation.z=s*.4;}k.animate(t=>g.rotation.z=Math.sin(t*2.6)*.12);},
 cake(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown+.04,-.03]);k.cyl(g,c[0],[0,0,0],x.hw*.42,x.hw*.44,.12);k.cyl(g,c[1],[0,.07,0],x.hw*.43,x.hw*.43,.03);k.cyl(g,c[0],[0,.13,0],x.hw*.28,x.hw*.3,.1);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.ball(g,c[1],[Math.cos(a)*x.hw*.43,.05,Math.sin(a)*x.hw*.43],.025);}
  k.cyl(g,'#9fd0f0',[0,.23,0],.012,.012,.1);const flame=k.ball(g,c[2],[0,.3,0],[.018,.03,.018],'glow');k.animate(t=>flame.scale.set(.018,.03+Math.sin(t*20)*.005,.018));k.ball(g,'#e5737f',[.07,.19,.05],.025,'shiny');},
 antenna(k,x,it){const c=it.c,g=k.group(x.d.head,[0,x.crown-.04,-.04]);k.tube(g,c[0],[[-x.hw*.6,-.08,0],[0,.04,0],[x.hw*.6,-.08,0]],.016,'shiny');
  for(const s of [-1,1]){const a=k.group(g,[s*.09,.03,0]);k.tube(a,c[0],[[0,0,0],[s*.03,.12,0],[s*.07,.2,.02]],.01);k.ball(a,c[1],[s*.07,.22,.02],.035,'glow');k.animate(t=>a.rotation.z=Math.sin(t*3+s)*.15);}}
};

// Frame outlines around one eye, in units of the eye radius.
const FRAMES={
 round:t=>[Math.cos(t),Math.sin(t)],
 square:t=>{const c=Math.cos(t),s=Math.sin(t),m=Math.max(Math.abs(c),Math.abs(s)*1.15);return [c/m*.95,s/m*.95];},
 heart:t=>{const x=16*Math.sin(t)**3,y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);return [x/14,y/14+.1];},
 star:t=>{const a=t+Math.PI/2,f=((t/(Math.PI*2)*10)%2+2)%2,r=f<1?1.25-f*.6:.65+(f-1)*.6;return [Math.cos(a)*r,Math.sin(a)*r];}
};
function frameAround(k,x,side,frame,color,{scale=1.32,r=.011,lens,lensLook='tint'}={}){
 const ex=side*x.a.eyeX,ey=x.a.eyeY,er=x.a.eyeRadius*scale,pts=[],shape=new THREE.Shape();
 for(let i=0;i<=72;i++){const [u,v]=FRAMES[frame](i/72*Math.PI*2);pts.push([ex+u*er,ey+v*er]);i?shape.lineTo(ex+u*er,ey+v*er):shape.moveTo(ex+u*er,ey+v*er);}
 const rim=x.faceLine(k,color,pts,r,.024,'shiny');
 if(lens)x.decal(k,shape,lens,.02,lensLook);
 return {rim,inner:[ex-side*er*.95,ey],outer:[ex+side*er,ey]};
}
const FACE={
 glasses(k,x,it){const [L,R]=[-1,1].map(s=>frameAround(k,x,s,it.frame,it.c[0],{r:it.frame==='square'?.016:.011,lens:'#e8f4fb',lensLook:'glass'}));x.faceLine(k,it.c[0],[L.inner,[0,x.a.eyeY+.03],R.inner],.009,.03);
  for(const s of [-1,1])k.tube(x.d.head,it.c[0],[[s*x.hw*.9,x.a.eyeY,x.hd*.42],[s*x.hw*.98,x.a.eyeY+.01,x.hd*.05]],.008,'shiny');},
 shades(k,x,it){const [L,R]=[-1,1].map(s=>frameAround(k,x,s,it.frame,it.c[0],{scale:it.frame==='round'?1.38:1.22,r:.012,lens:it.c[1]}));x.faceLine(k,it.c[0],[L.inner,[0,x.a.eyeY+.03],R.inner],.01,.03);},
 monocle(k,x,it){const m=frameAround(k,x,1,'round',it.c[0],{r:.012,lens:'#eef6f8',lensLook:'glass'});const [ox,oy]=m.outer;k.tube(x.d.head,it.c[0],[[ox,oy-.05,x.a.projectFace(ox-.02,oy-.05,0)+.02],[ox+.02,oy-.18,x.hd*.5],[ox-.02,-x.hh*.7,x.hd*.45]],.004,'metal');},
 goggles(k,x,it){const [L,R]=[-1,1].map(s=>frameAround(k,x,s,'round',it.c[1],{scale:1.48,r:.03,lens:it.c[0]}));x.faceLine(k,it.c[1],[L.inner,[0,x.a.eyeY+.02],R.inner],.02,.035);
  const band=k.ring(x.d.head,'#4a4a52',[0,x.a.eyeY+.01,-.02],1,.022,[Math.PI/2,0,0]);band.scale.set(x.hw*1.0,x.hd*1.05,1);},
 mustache(k,x,it){for(const s of [-1,1])x.faceLine(k,it.c[0],[[0,x.a.noseY-.03],[s*.05,x.a.noseY-.045],[s*.11,x.a.noseY-.03],[s*.14,x.a.noseY+.005],[s*.12,x.a.noseY+.02]],.016,.012,'fabric');},
 clown(k,x,it){k.ball(x.d.head,it.c[0],[0,x.a.noseY-.005,x.a.noseZ+.02],.055,'shiny');},
 stickers(k,x,it){for(const s of [-1,1]){const cx=s*x.hw*.55,cy=-.12,h=new THREE.Shape(),r=.045;h.moveTo(cx,cy-r);h.bezierCurveTo(cx-r*1.6,cy+r*.2,cx-r*.6,cy+r*1.3,cx,cy+r*.45);h.bezierCurveTo(cx+r*.6,cy+r*1.3,cx+r*1.6,cy+r*.2,cx,cy-r);x.decal(k,h,it.c[0],.006,'shiny');}},
 mask(k,x,it){const ex=x.a.eyeX,ey=x.a.eyeY,er=x.a.eyeRadius,w=Math.min(ex+er*2.2,x.hw*.92),s=new THREE.Shape();
  s.moveTo(0,ey-er*.55);s.bezierCurveTo(ex*.5,ey-er*1.3,ex+er,ey-er*1.5,w,ey-er*.4);s.bezierCurveTo(w+er*.2,ey+er*.8,ex+er*1.2,ey+er*1.9,ex*.3,ey+er*1.25);s.lineTo(-ex*.3,ey+er*1.25);
  s.bezierCurveTo(-ex-er*1.2,ey+er*1.9,-w-er*.2,ey+er*.8,-w,ey-er*.4);s.bezierCurveTo(-ex-er,ey-er*1.5,-ex*.5,ey-er*1.3,0,ey-er*.55);
  for(const side of [-1,1]){const hole=new THREE.Path();hole.absellipse(side*ex,ey,er*1.12,er*1.06,0,Math.PI*2,true);s.holes.push(hole);}
  x.decal(k,s,it.c[0],.02,'shiny');for(const side of [-1,1])k.ball(x.d.head,it.c[1],[side*(w-.01),ey+er*.3,x.a.projectFace(side*(w-.03),ey+er*.3,0)+.02],.022,'metal');}
};
// Reuse the same exact torso projection for collar sections and backpack straps.
function torsoSampler(d){
 const ray=new THREE.Ray(),a=V(0,0,0),b=V(0,0,0),c=V(0,0,0),hit=V(0,0,0),vertices=d.anchors.torsoGeometry.attributes.position;
 return (center,direction,target)=>{
  ray.set(center,direction);
  // Remove trig residue at cardinal axes, which otherwise misses the shared edge at x=0.
  for(let axis=0;axis<3;axis++)if(Math.abs(ray.direction.getComponent(axis))<1e-12)ray.direction.setComponent(axis,0);
  let radius=0;
  for(let j=0;j<vertices.count;j+=3){
   a.fromBufferAttribute(vertices,j);b.fromBufferAttribute(vertices,j+1);c.fromBufferAttribute(vertices,j+2);
   if(ray.intersectTriangle(a,b,c,false,hit))radius=Math.max(radius,hit.distanceTo(center));
  }
  if(!radius)throw new Error(`No torso surface for ${d.breed} clothing`);
  return target.copy(center).addScaledVector(ray.direction,radius);
 };
}
// Body-space attachment keeps a head turn from lifting the collar off the chest.
const NECK_STEPS=48,NECK_TILT=.42;
function neckline(d){
 const sample=d.anchors.sampleTorso??=torsoSampler(d),center=V(0,Math.max(-.04,Math.min(.17,d.profile.headY-d.body.position.y-d.profile.head[1]*.72)),d.profile.front+.02),sin=Math.sin(NECK_TILT),cos=Math.cos(NECK_TILT),points=[];
 for(let i=0;i<NECK_STEPS;i++){
  const angle=i/NECK_STEPS*Math.PI*2,direction=V(Math.cos(angle),-Math.sin(angle)*sin,Math.sin(angle)*cos);
  points.push({point:sample(center,direction,V(0,0,0)),direction});
 }
 return points;
}
const neckCurve=(x,thick)=>new THREE.CatmullRomCurve3(x.neck.map(({point,direction})=>point.clone().addScaledVector(direction,thick+.045)),true);
function collar(k,x,color,thick=.032){const curve=neckCurve(x,thick);return k.add(x.d.body,new THREE.TubeGeometry(curve,96,thick,10,true),color);}
const front=(x,dy=0)=>{const {point,direction}=x.neck[NECK_STEPS/4];x.a.torsoGeometry.computeBoundingBox();const y=Math.max(x.a.torsoGeometry.boundingBox.min.y+.10,point.y+direction.y*.077+dy);return [0,y,x.chestZ(0,y)+.07];};
// Subdivide hanging fabric so the middle follows the chest too, not just its corners.
function chestFabric(k,x,shape,color,anchor,depth=.012){
 const solid=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:20}),g=densify(solid,2);solid.dispose();
 const p=g.attributes.position;
 g.computeBoundingBox();x.a.torsoGeometry.computeBoundingBox();
 const drop=-g.boundingBox.min.y,available=anchor[1]-x.a.torsoGeometry.boundingBox.min.y-.025,fit=drop>0?Math.min(1,Math.max(.05,available/drop)):1;
 for(let i=0;i<p.count;i++){const cx=p.getX(i)+anchor[0],cy=p.getY(i)*fit+anchor[1];p.setXYZ(i,cx,cy,x.chestZ(cx,cy)+.045+p.getZ(i));}
 g.computeVertexNormals();return k.add(x.d.body,g,color);
}
function backpackFit(x){
 const p=x.p,width=Math.min(.30,p.body[0]*.75),height=width*.6,length=p.body[2]*.38,backZ=p.rear*.12;
 const tilt=Math.atan2(x.backY(0,backZ+length/2)-x.backY(0,backZ-length/2),length),sin=Math.sin(tilt),cos=Math.cos(tilt);
 let floor=-Infinity;
 for(const xx of [-width/2,0,width/2])for(let i=0;i<=4;i++){const zz=length*(i/4-.5);floor=Math.max(floor,x.backY(xx,backZ+zz*cos)-zz*sin);}
 const y=floor+.035+height/2*cos,z=backZ-height/2*sin,sample=x.a.sampleTorso??=torsoSampler(x.d),center=V(0,0,0),direction=V(0,0,0),paths=[];
 const attachment=(side,end)=>{const yy=-height*.32,zz=end*length*.38;return V(side*width*.38,y+yy*cos+zz*sin,z-yy*sin+zz*cos);};
 for(const side of [-1,1]){
  const raw=new THREE.CatmullRomCurve3([
   attachment(side,1),
   V(side*p.body[0]*.65,p.body[1]*.55,z+length*.45),
   V(side*p.body[0]*.95,-p.body[1]*.15,z+length*.28),
   V(side*p.body[0]*.9,-p.body[1]*.45,z-length*.25),
   V(side*p.body[0]*.65,p.body[1]*.35,z-length*.5),
   attachment(side,-1)
  ]),points=raw.getPoints(40);
  // Keep both ends inside the bag, and fit the intervening strap over skin and clothing.
  for(let i=1;i<points.length-1;i++){direction.copy(points[i]).sub(center).normalize();sample(center,direction,points[i]).addScaledVector(direction,.06);}
  paths.push(new THREE.CatmullRomCurve3(points));
 }
 return {width,height,length,y,z,tilt,paths};
}
const NECK={
 bow(k,x,it){const c=it.c;if(!it.small)collar(k,x,c[0]);const g=k.group(x.d.body,front(x)),s=it.small?.7:1;for(const side of [-1,1]){const w=k.ball(g,c[0],[side*.075*s,0,0],[.075*s,.05*s,.035*s],'shiny');w.rotation.z=side*.32;}k.ball(g,c[1],[0,0,.02],.03*s,'shiny');},
 bell(k,x,it){const c=it.c;collar(k,x,c[0],.026);const g=k.group(x.d.body,front(x,-.02));k.ball(g,c[1],[0,-.03,0],.045,'metal');k.ring(g,'#b48a36',[0,-.03,0],.046,.006,[Math.PI/2,0,0],'metal');k.ball(g,'#5a4a2a',[0,-.06,.03],.008);},
 scarf(k,x,it){const c=it.c,ring=collar(k,x,c[0],.06),uv=ring.geometry.attributes.uv;
  const colors=new Float32Array(uv.count*3),palette=c.map(toon);for(let i=0;i<uv.count;i++)palette[Math.floor(uv.getX(i)*12)%c.length].toArray(colors,i*3);ring.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));ring.material=k.mat('vertex');
  const anchor=ring.geometry.parameters.path.getPoint(.2),tail=k.group(x.d.body,[anchor.x,anchor.y,0]);
  x.a.torsoGeometry.computeBoundingBox();
  const step=Math.max(.025,Math.min(.24,anchor.y-x.a.torsoGeometry.boundingBox.min.y-.025))/4;
  for(let i=0;i<4;i++){const y=-step*(i+.5);k.rbox(tail,c[i%c.length],[0,y,x.chestZ(anchor.x,anchor.y+y)+.065],[.1,step*1.08,.035],Math.min(.015,step*.4));}
  k.animate(t=>tail.rotation.z=Math.sin(t*2.3)*.045);},
 pearls(k,x,it){const curve=neckCurve(x,.022);for(let i=0;i<18;i++)k.ball(x.d.body,it.c[0],curve.getPointAt(i/18).toArray(),.022,'shiny');},
 tie(k,x,it){const c=it.c;collar(k,x,'#ffffff',.018);const anchor=front(x,-.01);k.ball(x.d.body,c[0],anchor,[.035,.03,.025]);const s=new THREE.Shape();s.moveTo(-.025,-.02);s.lineTo(.025,-.02);s.lineTo(.04,-.17);s.lineTo(0,-.21);s.lineTo(-.04,-.17);s.closePath();chestFabric(k,x,s,c[0],anchor,.014);const y=anchor[1]-.11;k.ball(x.d.body,c[1],[0,y,x.chestZ(0,y)+.066],.009);},
 lei(k,x,it){const curve=neckCurve(x,.04),forward=V(0,0,1);for(let i=0;i<14;i++){const a=i/14*Math.PI*2,f=k.group(x.d.body,curve.getPoint(i/14).toArray());f.quaternion.setFromUnitVectors(forward,V(Math.cos(a),-Math.sin(a)*Math.sin(NECK_TILT),Math.sin(a)*Math.cos(NECK_TILT)));for(let j=0;j<5;j++)k.ball(f,it.c[i%it.c.length],[Math.cos(j*1.26)*.03,Math.sin(j*1.26)*.03,0],[.03,.03,.014]);k.ball(f,'#ffe08a',[0,0,.01],.014);}},
 medal(k,x,it){const c=it.c;collar(k,x,c[1],.022);const g=k.group(x.d.body,front(x,-.05));k.cyl(g,c[0],[0,-.03,0],.055,.055,.016,'metal').rotation.x=Math.PI/2;const st=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.016:.036;i?st.lineTo(Math.cos(a)*r,Math.sin(a)*r):st.moveTo(Math.cos(a)*r,Math.sin(a)*r);}k.extrude(g,'#f6e3a1',st,.008,[0,-.03,.012],'metal');},
 bib(k,x,it){const c=it.c,anchor=front(x),r=Math.min(x.p.body[0]*.7,x.p.body[1]*.72),s=new THREE.Shape();s.absarc(0,0,r,Math.PI,Math.PI*2,false);s.closePath();chestFabric(k,x,s,c[0],anchor);
  const y=anchor[1]-r*.48,fish=k.group(x.d.body,[0,y,x.chestZ(0,y)+.07]);k.ball(fish,c[1],[0,0,0],[.05,.03,.008]);k.cone(fish,c[1],[-.06,0,0],.025,.04,3).rotation.z=Math.PI/2;}
};

// Sleeves wrap a leg segment; `part` is 'hip' (upper) or 'knee' (lower).
function sleeve(k,x,leg,part,color,{scale=1.18,look='fabric',puffy=false}={}){
 const u=leg.userData,front=u.front,len=(part==='hip'?u.upper:u.lower);
 const parent=part==='hip'?leg:u.knee,r=part==='hip'?(front?.115:.13):.088;
 const m=k.capsule(parent,color,[0,part==='hip'?-len*.4:-len*.32,front||part==='knee'?0:-.01],r*scale*(puffy?1.25:1),len*(part==='hip'?.62:.55),1,look);
 if(part==='hip'&&!front)m.scale.set(1.1,1,1.3);return m;
}
const TOP={
 shirt(k,x,it){
  const c=it.c,p=x.p,z0=p.rear*.35,fabric=PATTERNS[it.pattern]?.(c)||solid(c[0]),look=it.metal?'metal':'fabric';
  x.shell(k,(cx,cy,cz)=>cz>z0&&!(cz>p.front+.02&&cy<-.1),fabric,.026,{look});
  for(const leg of x.d.legs.filter(l=>l.userData.front)){if(!x.d.skin)sleeve(k,x,leg,'hip',c[0],{look});if(it.pattern==='knit'||it.id==='pajama'||it.id==='spacesuit'||it.metal)sleeve(k,x,leg,'knee',c[0],{scale:1.2,look});}
  const chestTop=p.front+.02,neckY=p.body[1]*.55;
  if(it.turtle)x.shell(k,(cx,cy,cz)=>cz>p.front-.04&&cy>.12,v=>toon(c[1]).lerp(toon(c[0]),ss(Math.sin(v.x*80),.2,.8)*.5),.04);
  if(it.sailor){x.shell(k,(cx,cy,cz)=>cy>.12&&cz>p.front*.1&&cz<p.front+.05,v=>toon(Math.abs(v.z-p.front*.1)<.035||Math.abs(v.x)>p.body[0]*.62?c[0]:c[1]),.04);const knot=k.group(x.d.body,[0,.08,x.chestZ(0,.08)+.03]);for(const s of [-1,1])k.ball(knot,'#d4524f',[s*.05,0,0],[.055,.035,.02],'shiny');k.tube(knot,'#d4524f',[[0,0,0],[-.03,-.08,.01]],.012);k.tube(knot,'#d4524f',[[0,0,0],[.03,-.08,.01]],.012);}
  if(it.buttons)for(const col of it.double?[-.05,.05]:[0])for(let i=0;i<3;i++){const y=.1-i*.085;k.ball(x.d.body,c[1],[col,y,x.chestZ(col,y)+.03],.018,'shiny');}
  if(it.vneck){const s=new THREE.Shape();s.moveTo(-.07,.2);s.lineTo(.07,.2);s.lineTo(0,-.02);s.closePath();const shirt=k.flat(x.d.body,c[1],s,[0,0,x.chestZ(0,.1)+.035]);shirt.rotation.x=-.35;k.ball(x.d.body,'#d4524f',[0,.17,x.chestZ(0,.17)+.04],[.03,.02,.015],'shiny');}
  if(it.hood||it.bearHood){const g=k.group(x.d.body,[0,x.backY(0,p.front*.55)+.03,p.front*.55]);g.rotation.x=-.3;k.ring(g,c[0],[0,0,0],x.hw*.62,.07,[Math.PI/2,0,0]).scale.set(1,1,.6);k.ball(g,c[1],[0,-.01,-.04],[x.hw*.5,.05,x.hw*.32]);if(it.bearHood)for(const s of [-1,1])k.ball(g,c[0],[s*x.hw*.48,.07,-.05],.06);}
  if(it.panel){const y=.05,g=k.group(x.d.body,[0,y,x.chestZ(0,y)+.03]);g.rotation.x=-.35;k.rbox(g,'#d5dbe2',[0,0,0],[.16,.11,.02],.01,'metal');for(let i=0;i<3;i++)k.ball(g,['#e46a6a','#f2d27a','#7cc28a'][i],[-.045+i*.045,0,.012],.014,'glow');k.ball(x.d.body,c[1],[p.body[0]*.62,.12,p.front*.4],.035,'shiny');}
  if(it.emblem){const y=.07,g=k.group(x.d.body,[0,y,x.chestZ(0,y)+.03]);g.rotation.x=-.35;const s=new THREE.Shape();if(it.emblem==='star')for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.03:.07;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}else{s.moveTo(-.06,.06);s.lineTo(.06,.06);s.quadraticCurveTo(.06,-.04,0,-.08);s.quadraticCurveTo(-.06,-.04,-.06,.06);}k.extrude(g,it.emblem==='star'?c[2]:c[1],s,.014,[0,0,0],'metal');}
  if(it.id==='hero')x.shell(k,(cx,cy,cz)=>cy>.05&&cz<p.front*.6&&Math.abs(cx)<p.body[0]*.8,v=>toon(c[1]).lerp(toon('#a83232'),ss(-v.z,0,.5)),.045);
  if(it.spikes)for(let i=0;i<6;i++){const z=p.front*.6-i*(p.front-p.rear)*.16,y=x.backY(0,z);const s=k.cone(x.d.body,c[1],[0,y+.035,z],.04,.09,4,'shiny');s.rotation.x=-.25;}
  if(it.antennaWings){for(const s of [-1,1]){const w=k.ball(x.d.body,'#eaf6ff',[s*.12,x.backY(s*.12,.05)+.07,.05],[.1,.02,.06],'glass');w.rotation.z=s*.6;k.animate(t=>w.rotation.z=s*(.6+Math.sin(t*28)*.25));}k.cone(x.d.body,'#3a3236',[0,x.backY(0,p.rear*.9)-.02,p.rear-.04],.03,.08,8).rotation.x=-Math.PI/2;}
  if(it.obi)x.shell(k,(cx,cy,cz)=>Math.abs(cz-.02)<.07,v=>toon(Math.abs(v.z-.02)<.012?'#f2d27a':c[2]),.036);
 }
};
const BOTTOM={
 pants(k,x,it){
  const c=it.c,p=x.p,fabric=PATTERNS[it.pattern]?.(c)||solid(c[0]);
  x.shell(k,(cx,cy,cz)=>cz<p.rear*.25+.02,fabric,.03);
  for(const leg of x.d.legs.filter(l=>!l.userData.front)){const m=sleeve(k,x,leg,'hip',c[0],{scale:it.puffy?1.18:1.08,puffy:it.puffy});if(it.pattern){m.material=k.mat('vertex');paint(m.geometry,v=>fabric(V(v.x,v.y*.9,v.y*.6)));}if(it.long){const s=sleeve(k,x,leg,'knee',c[0],{scale:1.22});if(it.pattern){s.material=k.mat('vertex');paint(s.geometry,v=>fabric(V(v.x,v.y*.9-.3,v.y)));}}}
  if(it.puffy)for(let i=0;i<8;i++){const a=i/8*Math.PI*2;k.tube(x.d.body,'#d77f2d',[[Math.cos(a)*p.body[0]*1.02,Math.sin(a)*p.body[1]*.95,p.rear*.25],[Math.cos(a)*p.body[0]*1.06,Math.sin(a)*p.body[1]*.98,p.rear*.75]],.012);}
  if(it.straps){x.shell(k,(cx,cy,cz)=>cz>p.front*.35&&cz<p.front+.03&&cy<.12&&Math.abs(cx)<.13,solid(c[0]),.034);for(const s of [-1,1]){const xx=s*.08,pts=[[xx,-.02,x.chestZ(xx,-.02)+.03],[xx,.14,x.chestZ(xx,.14)+.03]];for(let i=0;i<=4;i++){const z=p.front*.7-i*(p.front*.7-p.rear*.25)/4;pts.push([xx,x.backY(xx,z)+.03,z]);}k.tube(x.d.body,c[0],pts,.014);k.ball(x.d.body,c[1],[s*.08,.1,x.chestZ(s*.08,.1)+.04],.02,'metal');}}
 },
 skirt(k,x,it){
  const c=it.c,p=x.p,[bx,by]=p.body,z0=p.rear*.05,len=Math.abs(p.rear)*.75;
  const layers=it.layers||1;
  for(let l=0;l<layers;l++){
   const flare=1.1+l*.12,pts=[[1.02,0],[1.06,len*.3],[flare+.12,len*.75],[flare+.2,len]].map(([r,y])=>new THREE.Vector2(r,y));
   const g=new THREE.LatheGeometry(pts,64),pp=g.attributes.position,fabric=PATTERNS[it.pattern]?.(c)||(l?solid(c[1]):solid(c[0]));
   for(let i=0;i<pp.count;i++){const ang=Math.atan2(pp.getZ(i),pp.getX(i)),edge=pp.getY(i)/len,wob=1+(it.pattern==='grass'?.08:.05)*Math.sin(ang*14)*edge;pp.setXYZ(i,pp.getX(i)*wob*bx,pp.getZ(i)*wob*by,z0-pp.getY(i)-l*.04);}
   g.computeVertexNormals();paint(g,v=>fabric(V(v.x/bx*.4,v.y/by*.4,v.z)));k.add(x.d.body,g,'vertex',[0,0,0],1,'fabric',{side:THREE.DoubleSide});
  }
  k.ring(x.d.body,c[layers>1?1:0],[0,0,z0],1,.035/bx,[0,0,0]).scale.set(bx*1.04,by*1.04,1);
 }
};

// Back pieces sit on the spine between the shoulders, read from the actual torso surface.
function wingPair(k,x,build,{flap=.35,speed=3,spread=.25}={}){
 const z=x.p.front*.25,y=x.backY(0,z);
 for(const side of [-1,1]){
  const root=k.group(x.d.body,[side*.06,y-.01,z]);root.rotation.set(-.35,side*.25,side*spread);
  const wing=k.group(root);wing.scale.x=side;build(wing);
  k.animate(t=>wing.rotation.y=side*Math.sin(t*speed)*flap);
 }
}
const outline=(pts)=>{const s=new THREE.Shape();s.moveTo(...pts[0]);for(let i=1;i<pts.length;i+=3)s.bezierCurveTo(...pts[i],...pts[i+1],...pts[i+2]);return s;};
const BACK={
 wings(k,x,it){const c=it.c;
  if(it.wing==='angel')wingPair(k,x,w=>{for(let i=0;i<5;i++){const f=k.capsule(w,i%2?c[1]:c[0],[.1+i*.045,.1+i*.035,-i*.008],.045,.16+i*.04,[1,1,.32]);f.rotation.z=-1.05+i*.22;}},{flap:.25,speed:2.4});
  if(it.wing==='butterfly')wingPair(k,x,w=>{k.flat(w,c[0],outline([[0,0],[.12,.32],[.36,.34],[.3,.08],[.38,-.04],[.26,-.22],[.08,-.14]]),[0,0,0],'shiny');k.flat(w,c[1],outline([[.05,.02],[.12,.2],[.24,.22],[.22,.08],[.26,0],[.2,-.12],[.08,-.08]]),[0,0,.004],'shiny');k.ball(w,'#ffffff',[.24,.2,.006],[.03,.03,.004]);},{flap:.5,speed:5});
  if(it.wing==='bat')wingPair(k,x,w=>{k.flat(w,c[0],outline([[0,0],[.1,.26],[.3,.32],[.42,.2],[.34,.12],[.3,.06],[.24,.02],[.18,-.02],[.12,.0],[0,0]]),[0,0,0],'shiny');for(const [a,b] of [[.42,.2],[.24,.02],[.12,0]])k.tube(w,c[1],[[0,0,.004],[a,b,.004]],.008);},{flap:.45,speed:4});
  if(it.wing==='dragon')wingPair(k,x,w=>{k.flat(w,c[0],outline([[0,0],[.12,.3],[.32,.4],[.46,.3],[.36,.18],[.34,.1],[.24,.04],[.2,0],[.1,-.04],[0,0]]),[0,0,0],'shiny');k.tube(w,c[1],[[0,0,.004],[.12,.3,.004],[.46,.3,.004]],.012);},{flap:.3,speed:2.5});
  if(it.wing==='fairy')wingPair(k,x,w=>{k.ball(w,c[0],[.16,.16,0],[.18,.07,.004],'glass').rotation.z=.6;k.ball(w,c[1],[.12,-.04,0],[.12,.05,.004],'glass').rotation.z=-.4;},{flap:.6,speed:7});
 },
 backpack(k,x,it){const c=it.c,{width,height,length,y,z,tilt,paths}=x.a.backpack??=backpackFit(x),g=k.group(x.d.body,[0,y,z]);g.rotation.x=-tilt;
  k.rbox(g,c[0],[0,0,0],[width,height,length],.05);k.rbox(g,c[1],[0,-height*.08,-length*.52],[width*.67,height*.6,.05],.025);
  k.tube(g,'#ffffff',[[-width*.3,height/2+.015,length*.3],[0,height/2+.07,length*.3],[width*.3,height/2+.015,length*.3]],.01);
  for(const path of paths)k.add(x.d.body,new THREE.TubeGeometry(path,80,.016,8,false),c[0]);
 },
 turtle(k,x,it){const c=it.c,z=-.05,y=x.backY(0,z),g=k.group(x.d.body,[0,y-.1,z]);const dome=paint(new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI/2),v=>{const a=Math.atan2(v.z,v.x),ring=v.y;return toon(c[0]).lerp(toon(c[1]),ss(Math.abs(Math.sin(a*3))+(ring>.75?1:0),.9,1)*.8);});
  k.add(g,dome,'vertex',[0,0,0],[x.p.body[0]*1.15,.22,Math.abs(x.p.rear)*1.2],'shiny');k.ring(g,c[1],[0,.005,0],1,.02,[Math.PI/2,0,0],'shiny').scale.set(x.p.body[0]*1.15,Math.abs(x.p.rear)*1.2,1);},
 snail(k,x,it){const c=it.c,z=-.05,y=x.backY(0,z),g=k.group(x.d.body,[0,y+.16,z]);g.rotation.y=Math.PI/2;const pts=[];for(let i=0;i<=60;i++){const t=i/60*Math.PI*4.2,r=.17*(1-i/68);pts.push(V(Math.cos(t)*r,Math.sin(t)*r,i*.0012));}
  const curve=new THREE.CatmullRomCurve3(pts);k.add(g,paint(taperedTube(curve,t=>.075*(1-t*.75),80,14),v=>toon(c[0]).lerp(toon(c[1]),ss(Math.sin(Math.hypot(v.x,v.y)*90),.2,.9))),'vertex',[0,0,0],1,'shiny');},
 jetpack(k,x,it){const c=it.c,z=0,y=x.backY(0,z),g=k.group(x.d.body,[0,y+.08,z]);g.rotation.x=-.2;
  for(const s of [-1,1]){k.cyl(g,c[0],[s*.08,0,0],.065,.065,.3,'metal').rotation.x=Math.PI/2;k.cone(g,c[1],[s*.08,0,.18],.065,.07,24,'shiny').rotation.x=Math.PI/2;const fl=k.cone(g,c[2],[s*.08,0,-.2],.05,.14,16,'glow');fl.rotation.x=Math.PI/2;k.animate(t=>fl.scale.set(1,.8+Math.sin(t*30+s)*.25,1));}
  k.rbox(g,c[1],[0,0,0],[.08,.08,.18],.02,'shiny');},
 balloon(k,x,it){const z=x.p.rear*.6,y=x.backY(0,z),g=k.group(x.d.body,[0,y,z]);const top=k.group(g,[.05,.9,-.1]);k.ball(top,it.c[0],[0,0,0],[.17,.2,.17],'shiny');k.cone(top,it.c[0],[0,-.21,0],.03,.04,8).rotation.x=Math.PI;
  const string=k.tube(g,'#d8d0c4',[[0,0,0],[.02,.3,-.04],[.06,.6,-.08],[.05,.69,-.1]],.004);k.animate(t=>{top.position.x=.05+Math.sin(t*1.4)*.04;top.rotation.z=Math.sin(t*1.4)*.08;string.rotation.z=Math.sin(t*1.4)*.03;});},
 cape(k,x,it){const c=it.c,p=x.p;x.shell(k,(cx,cy,cz)=>cy>.02&&cz<p.front*.7&&Math.abs(cx)<p.body[0]*.92,v=>toon(c[0]).lerp(toon('#9e3636'),ss(-v.z,0,.5)*.6),.05);
  k.ball(x.d.body,c[1],[0,x.backY(0,p.front*.7)-.01,p.front*.72],.04,'metal');}
};

// Shoes are built around each paw in ankle space (sole at y≈0, toes towards +z).
function forPaws(x,fn){x.d.legs.forEach((leg,i)=>fn(leg.userData.ankle,leg.userData.knee,leg.userData,i));}
const FEET={
 boots(k,x,it){const look=it.metal?'metal':'shiny';forPaws(x,(ankle,knee,u)=>{k.ball(ankle,it.c[0],[0,.07,.045],[.13,.09,.165],look);k.capsule(knee,it.c[0],[0,-u.lower*.7,0],.1,u.lower*.38,1,look);k.cyl(ankle,it.c[1]||'#9a8a7a',[0,.012,.04],.12,.12,.02).scale.z=1.25;});},
 shoes(k,x,it){forPaws(x,(ankle)=>{k.ball(ankle,it.c[0],[0,.065,.045],[.128,.085,.162],'shiny');k.cyl(ankle,it.id==='sneakers'?'#f2f2f2':it.c[1],[0,.014,.045],.122,.122,.022).scale.z=1.3;
  if(it.id==='sneakers'){k.tube(ankle,it.c[1],[[-.11,.06,.0],[0,.09,.12],[.11,.06,.0]],.01);for(let i=0;i<2;i++)k.tube(ankle,'#bbbbbb',[[-.035,.13-i*.02,.1+i*.025],[.035,.13-i*.02,.1+i*.025]],.005);}
  if(it.ribbon)k.ball(ankle,'#f4a7bf',[0,.14,.13],[.03,.02,.015],'shiny');});},
 socks(k,x,it){forPaws(x,(ankle,knee,u)=>{const m=k.capsule(knee,'vertex',[0,-u.lower*.55,0],.097,u.lower*.62);paint(m.geometry,v=>toon(it.rainbow?it.c[Math.floor(((v.y+.2)*18)%it.c.length+it.c.length)%it.c.length]:Math.sin(v.y*60)>0?it.c[0]:it.c[1]));k.ball(ankle,it.c[it.rainbow?2:1],[0,.065,.045],[.12,.08,.152]);});},
 slippers(k,x,it){forPaws(x,(ankle)=>{k.ball(ankle,it.c[0],[0,.075,.05],[.15,.1,.18]);for(const s of [-1,1]){const e=k.capsule(ankle,it.c[0],[s*.05,.18,.07],.025,.06);e.rotation.z=-s*.3;k.capsule(ankle,it.c[1],[s*.05,.18,.085],.012,.04).rotation.z=-s*.3;}k.ball(ankle,'#3a3236',[0,.12,.2],.012);});},
 flippers(k,x,it){forPaws(x,(ankle)=>{const s=outline([[0,0],[-.12,.06],[-.15,.2],[-.08,.26],[-.04,.24],[.04,.24],[.08,.26],[.15,.2],[.12,.06],[0,0]]);const f=k.flat(ankle,it.c[0],s,[0,.012,.02],'shiny');f.rotation.x=-Math.PI/2;});},
 skates(k,x,it){forPaws(x,(ankle,knee,u)=>{k.ball(ankle,it.c[0],[0,.075,.045],[.13,.09,.165],'shiny');k.capsule(knee,it.c[0],[0,-u.lower*.75,0],.1,u.lower*.3,1,'shiny');for(const s of [-1,1])for(const z of [-.04,.13])k.cyl(ankle,it.c[1],[s*.06,.0,z],.03,.03,.025,'shiny').rotation.z=Math.PI/2;});}
};
// Tail pieces follow the tail curve; t=0 is the root, t=1 the tip.
function onTail(k,x,t){const curve=x.a.tailCurve,g=k.group(x.d.tail,curve.getPointAt(t).toArray());g.quaternion.setFromUnitVectors(V(0,1,0),curve.getTangentAt(t));return {g,r:x.a.tailRadius(t)};}
const TAIL={
 tailbow(k,x,it){const {g,r}=onTail(k,x,.62);for(const s of [-1,1]){const w=k.ball(g,it.c[0],[s*(r+.05),0,r*.6],[.06,.04,.025],'shiny');w.rotation.z=s*.3;}k.ball(g,it.c[0],[0,0,r+.01],.022,'shiny');k.ring(g,it.c[0],[0,0,0],r+.006,.012,[Math.PI/2,0,0]);},
 tailbell(k,x,it){const {g,r}=onTail(k,x,.55);k.ring(g,it.c[1],[0,0,0],r+.008,.012,[Math.PI/2,0,0]);k.ball(g,it.c[0],[0,-.01,r+.04],.04,'metal');},
 charm(k,x,it){const {g}=onTail(k,x,1),r=x.a.tailRadius(1);const holder=k.group(g,[0,r,0]);k.tube(holder,'#d8c8a8',[[0,0,0],[0,.04,.04],[0,.02,.09]],.004);const c=k.group(holder,[0,.0,.12]);
  const s=new THREE.Shape();if(it.shape==='star')for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,q=i%2?.022:.05;i?s.lineTo(Math.cos(a)*q,Math.sin(a)*q):s.moveTo(Math.cos(a)*q,Math.sin(a)*q);}else if(it.shape==='heart'){s.moveTo(0,-.045);s.bezierCurveTo(-.07,0,-.03,.05,0,.02);s.bezierCurveTo(.03,.05,.07,0,0,-.045);}else{s.absellipse(0,0,.05,.028,0,Math.PI*2);s.moveTo(-.045,0);s.lineTo(-.08,.03);s.lineTo(-.08,-.03);s.closePath();}
  k.extrude(c,it.c[0],s,.016,[0,0,0],'shiny');k.animate(t=>c.rotation.y=Math.sin(t*2)*.5);},
 tailflower(k,x,it){const {g,r}=onTail(k,x,.97);const f=k.group(g,[0,r*.4,r*.8]);for(let i=0;i<6;i++)k.ball(f,it.c[0],[Math.cos(i*1.05)*.04,Math.sin(i*1.05)*.04,0],[.032,.032,.012]);k.ball(f,it.c[1],[0,0,.008],.022);},
 tailrings(k,x,it){it.c.forEach((col,i)=>{const t=.22+i*.13,{g,r}=onTail(k,x,t);k.ring(g,col,[0,0,0],r+.008,.016,[Math.PI/2,0,0],'shiny');});},
 lantern(k,x,it){const {g,r}=onTail(k,x,1),bulb=k.ball(g,it.c[0],[0,r*.6,0],r*1.25,'glow');k.animate(t=>bulb.material.emissiveIntensity=.6+Math.sin(t*3)*.4);},
 tailsock(k,x,it){const curve=subCurve(x.a.tailCurve,.62,1),m=k.add(x.d.tail,paint(taperedTube(curve,t=>x.a.tailRadius(.62+t*.38)*1.2,24,16),v=>toon(Math.sin(v.y*70)>0?it.c[0]:it.c[1])),'vertex');k.ball(x.d.tail,it.c[1],x.a.tailCurve.getPointAt(1).toArray(),x.a.tailRadius(1)*1.4);}
};
const BUILDERS={head:HEAD,face:FACE,neck:NECK,top:TOP,bottom:BOTTOM,back:BACK,feet:FEET,tail:TAIL};

export function undressCat(cat){const dress=cat.userData.dress;if(!dress)return;for(const m of dress.meshes)m.removeFromParent();for(const g of dress.geometries)g.dispose();for(const m of dress.materials.values()){m.map?.dispose();m.dispose();}for(const ear of cat.userData.ears||[])ear.visible=true;for(const m of cat.userData.spikes||[])m.visible=true;cat.userData.dress=null;}
// Rebuilds only the outfit pieces; the sculpted cat is untouched, so switching clothes is quick.
export function dressCat(cat,value){
 undressCat(cat);const outfit=normalizeOutfit(value),k=makeKit(),x=context(cat);let hideEars=false;
 for(const slot of SLOTS){const piece=WARDROBE_BY_ID.get(outfit[slot.id]);if(!piece)continue;const build=BUILDERS[slot.id][piece.kind];if(!build)continue;const result=build(k,x,piece);if(result?.hideEars||piece.kind==='helmet')hideEars=true;}
 for(const ear of cat.userData.ears||[])ear.visible=!hideEars;
 // Hedgehog spikes would poke through garments worn over the back.
 for(const m of cat.userData.spikes||[])m.visible=m.name==='head-spikes'?!outfit.head:!(outfit.top||outfit.back);
 cat.userData.outfit=outfit;cat.userData.dress=k;return cat;
}
export function animateOutfit(cat,t){for(const fn of cat?.userData.dress?.animators||[])fn(t);}
