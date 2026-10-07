import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {sculptSurface, tintSurface} from './organic-surface.js';

const smooth = THREE.MathUtils.smoothstep;
const form = (x,y,z,rx,ry,rz,k=.085) => [x,y,z,rx,ry,rz,k];
export function refineProfile(p) {
  const species = p.species || 'cat';
  const head = [...p.head];
  if (species === 'cat') { head[0]*=.90; head[1]*=.94; head[2]*=.94; }
  else if (species === 'dog') { head[0]*=.88; head[1]*=.86; p={...p,snout:p.snout*1.65}; }
  else if (species === 'rabbit') { head[0]*=.86; head[1]*=.9; head[2]*=.9; }
  else { head[0]*=.91; head[1]*=.92; }
  return {...p,head};
}

// Each family has its own skull, cheeks and muzzle, including a tapered insectivore snout.
export function headForms(p) {
  const [w,h,d]=p.head,s=p.species||'cat',sn=p.snout||0;
  if(s==='dog') return [form(0,.035,-.05,w,h,d,.095),
    form(-w*.57,-h*.3,.025,w*.48,h*.58,d*.7),form(w*.57,-h*.3,.025,w*.48,h*.58,d*.7),
    form(0,-h*.34,d*.7+sn*.38,p.muzzle*1.2,.115,.17+sn*.42,.08),
    form(0,-h*.42,d*.9+sn*.65,p.muzzle*.93,.085,.11,.075),
    form(0,-h*.65,d*.62,.16,.075,.16)];
  if(s==='rabbit') return [form(0,.02,-.03,w,h,d,.095),
    form(-w*.56,-h*.3,.03,w*.55,h*.68,d*.65),form(w*.56,-h*.3,.03,w*.55,h*.68,d*.65),
    form(-.065,-h*.5,d*.82,.093,.09,.105,.075),form(.065,-h*.5,d*.82,.093,.09,.105,.075),
    form(0,-h*.66,d*.67,.085,.06,.09,.055)];
  if(s==='hedgehog'||s==='ferret') return [form(0,.025,-.065,w,h,d*.84,.09),
    form(0,-.055,d*.5,w*.6,h*.6,d*.7,.10),form(0,-.085,d+sn*.5,.085,.085,.13,.07)];
  const pouch=p.pouch||1;
  const feline=[form(0,.015,-.035,w,h,d,.105),
    form(-w*.59,-h*.35,.025,w*.46*pouch,h*.60,d*.66),form(w*.59,-h*.35,.025,w*.46*pouch,h*.60,d*.66),
    form(-.075,-h*.49,d*.82,p.muzzle,.085,p.flat?.065:.115,.065),
    form(.075,-h*.49,d*.82,p.muzzle,.085,p.flat?.065:.115,.065),
    form(0,-h*.7,d*.68,p.tufts?.135:.10,.055,.10,.065)];
  if(p.ruff||p.mane)for(const side of [-1,1])feline.push(
    form(side*w*.73,-h*.36,-.01,.15,.115,.22,.075),
    form(side*w*.85,-h*.43,-.065,.115,.07,.18,.045),
    form(side*w*.75,-h*.63,-.08,.105,.10,.19,.055));
  return feline;
}

export function torsoForms(p) {
  const [w,h,d]=p.body,s=p.species||'cat';
  if(s==='rabbit')return [form(0,.025,-.08,w*.9,h,d*.94,.12),
    form(0,.08,p.front*.68,w*.76,h*.92,.27,.12),
    form(-w*.52,-.07,p.rear*.65,w*.72,h*.98,.32,.13),form(w*.52,-.07,p.rear*.65,w*.72,h*.98,.32,.13)];
  if(s==='dog')return [form(0,.02,-.04,w*.94,h,d,.11),
    form(0,.08,p.front*.72,w*.91,h*1.04,.28,.13),
    form(0,-.035,p.rear*.77,w*1.03,h*.9,.29,.12)];
  return [form(0,0,-.02,w,h,d,.12),form(0,.055,p.front*.72,w*.84,h,.27,.12),
    form(-w*.44,-.035,p.rear*.74,w*.61,h*.85,.25,.105),form(w*.44,-.035,p.rear*.74,w*.61,h*.85,.25,.105)];
}

export function buildAnatomy(p,material,bodyPattern,headPattern,lod='full') {
  const low=lod==='low',base=p.hip+.015,forms=torsoForms(p).map(f=>{const v=[...f];v[1]+=base;v[2]-=.04;return v;});
  const s=p.species||'cat',w=p.body[0];
  // A broad, overlapping shoulder -> ankle -> toe volume becomes one watertight skin.
  for(let i=0;i<4;i++){
    const front=i<2,side=i%2?-1:1,x=side*w*.62,z=front?p.front:p.rear;
    const thigh=s==='rabbit'&&!front?.20:(front?.12:.16),toe=s==='rabbit'&&!front?.21:.145;
    forms.push(form(x,p.hip*.83,z,thigh,p.hip*.39,front?.15:.22,.10),
      form(x,p.hip*.43,z+.012,.088,p.hip*.31,.11,.075),
      form(x,.060,z+.047,.112,.060,toe,.055));
  }
  if(p.ruff||p.mane)for(const side of [-1,1]){
    forms.push(form(side*w*.43,base+.12,p.front+.08,w*.5,.24,.23,.085),
      form(side*w*.30,base-.04,p.front+.17,w*.31,.17,.14,.065));
  }
  const neckY=(p.headY+base)*.5;
  forms.push(form(0,neckY,p.front+.065,w*.66,(p.headY-base)*.58+.12,.23,.12));
  for(const f of headForms(p)){const v=[...f];v[1]+=p.headY;v[2]+=p.headZ;forms.push(v);}
  const top=p.headY+p.head[1]+.18,extent=[Math.max(.66,w*1.7),top+.05,p.headZ+p.head[2]+(p.snout||0)+.25];
  // Shift the field up so half of its Y resolution is not wasted beneath the floor.
  const mid=top*.5;for(const f of forms)f[1]-=mid;
  const geometry=sculptSurface(forms,[extent[0],mid+.08,extent[2]],material,[],low?42:62);
  geometry.translate(0,mid,0);
  tintSurface(geometry,(x,y,z)=>{
    const neck=smooth(y,base-.08,p.headY-p.head[1]*.74)*smooth(z,p.front*.4,p.headZ-.02);
    const c=bodyPattern(x,y-base,z+.04);
    c.lerp(headPattern(x,y-p.headY,z-p.headZ),neck);
    if(y<.19 && p.pattern!=='ferret' && (p.socks||['calico','ragdoll','cow'].includes(p.pattern)))c.lerp(new THREE.Color('#fff7ec'),1-smooth(y,.09,.19));
    return c;
  });
  const indices=[],weights=[],pos=geometry.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),headWeight=smooth(y,base-.08,p.headY-p.head[1]*.74)*smooth(z,p.front*.4,p.headZ-.04);
    let closest=0,distance=Infinity;
    for(let n=0;n<4;n++){const lx=(n%2?-1:1)*w*.62,lz=n<2?p.front:p.rear,dist=Math.hypot((x-lx)*1.3,z-lz);if(dist<distance){distance=dist;closest=n;}}
    const legWeight=(1-headWeight)*(1-smooth(y,p.hip*.68,p.hip+.14))*(1-smooth(distance,.16,.32));
    const knee=1-smooth(y,p.hip*.30,p.hip*.65),ankle=1-smooth(y,.075,.16);
    const start=2+closest*3,ws=[1-headWeight-legWeight,headWeight,legWeight*(1-knee),legWeight*knee*(1-ankle),legWeight*knee*ankle];
    const entries=ws.map((value,n)=>({value,index:[0,1,start,start+1,start+2][n]})).sort((a,b)=>b.value-a.value).slice(0,4),sum=entries.reduce((v,e)=>v+e.value,0);
    for(const e of entries){indices.push(e.index);weights.push(e.value/sum);}
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const indexed=mergeVertices(geometry,1e-4);geometry.dispose();return indexed;
}

export function surfaceGuide(geometry,offset,include){
  const source=geometry.toNonIndexed(),p=source.attributes.position,n=source.attributes.normal,positions=[],normals=[];
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let i=0;i<p.count;i+=3){
    a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1).sub(a);c.fromBufferAttribute(p,i+2).sub(a);
    if(b.cross(c).lengthSq()<1e-12)continue;
    const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-offset[0],y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-offset[1],z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-offset[2];
    if(!include(x,y,z))continue;
    for(let j=i;j<i+3;j++){positions.push(p.getX(j)-offset[0],p.getY(j)-offset[1],p.getZ(j)-offset[2]);normals.push(n.getX(j),n.getY(j),n.getZ(j));}
  }
  source.dispose();const guide=new THREE.BufferGeometry();guide.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));guide.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return guide;
}
