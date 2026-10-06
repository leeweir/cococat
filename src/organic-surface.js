import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export function sculptSurface(forms,extent,material,cutouts=[],resolution=46){
 const mc=new MarchingCubes(resolution,material,false,false,60000);mc.isolation=0;
 for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
  const px=(x/resolution*2-1)*extent[0],py=(y/resolution*2-1)*extent[1],pz=(z/resolution*2-1)*extent[2];let d=9;
  for(const f of forms){const v=(Math.sqrt(((px-f[0])/f[3])**2+((py-f[1])/f[4])**2+((pz-f[2])/f[5])**2)-1)*Math.min(f[3],f[4],f[5]);d=smoothMin(d,v,f[6]??.09);}
  for(const c of cutouts){const sphere=Math.hypot(px-c[0],py-c[1],pz-c[2])-c[3];d=Math.max(d,-sphere);}
  mc.field[x+y*resolution+z*resolution*resolution]=-d;
 }
 mc.update();const g=new THREE.BufferGeometry();for(const name of ['position','normal']){const data=mc.geometry.getAttribute(name).array.slice(0,mc.count*3);g.setAttribute(name,new THREE.BufferAttribute(data,3));}
 g.scale(...extent);g.computeBoundingSphere();mc.geometry.dispose();return g;
}
export function tintSurface(geometry,colorAt){const p=geometry.attributes.position,colors=[];for(let i=0;i<p.count;i++){const c=new THREE.Color(colorAt(p.getX(i),p.getY(i),p.getZ(i)));colors.push(c.r,c.g,c.b);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));}
export function fineFur(geometry,colorAt,count=6000,length=.042,mask=()=>true){
 const source=geometry.index?geometry.toNonIndexed():geometry;
 const positions=[],colors=[],p=source.attributes.position,n=source.attributes.normal;let seed=713;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
 for(let i=0;i<count;i++){const index=Math.floor(rnd()*Math.floor(p.count/3))*3;let u=rnd(),v=rnd();if(u+v>1){u=1-u;v=1-v;}const w=1-u-v;
  a.fromBufferAttribute(p,index);b.fromBufferAttribute(p,index+1);c.fromBufferAttribute(p,index+2);const point=a.clone().multiplyScalar(w).addScaledVector(b,u).addScaledVector(c,v);if(!mask(point))continue;
  a.fromBufferAttribute(n,index);b.fromBufferAttribute(n,index+1);c.fromBufferAttribute(n,index+2);normal.copy(a).multiplyScalar(w).addScaledVector(b,u).addScaledVector(c,v).normalize();
  const len=(typeof length==='function'?length(point,normal):length)*(.45+rnd()*.8),flow=new THREE.Vector3(normal.x*.84,normal.y*.6-.24,normal.z*.84).normalize();
  const middle=point.clone().addScaledVector(normal,len*.55),tip=point.clone().addScaledVector(flow,len);positions.push(...point.toArray(),...middle.toArray(),...middle.toArray(),...tip.toArray());
  const color=new THREE.Color(colorAt(point.x,point.y,point.z));color.multiplyScalar(.83+rnd()*.29);for(let j=0;j<4;j++)colors.push(color.r,color.g,color.b);
 }
 if(source!==geometry)source.dispose();
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const m=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.38,depthWrite:false});const fur=new THREE.LineSegments(g,m);fur.userData.fur=true;return fur;
}
// Height of the outermost surface along one axis, e.g. the face seen from +z or the back seen from +y.
// Exact barycentric lookup in a bucket grid: the same result as a raycast, without testing every triangle.
export function surfaceProjector(geometry,{u=0,v=1,w=2,cell=.05}={}){
 const p=geometry.attributes.position.array,buckets=new Map(),key=(i,j)=>(i+2048)*4096+(j+2048);
 for(let o=0;o<p.length;o+=9){
  const au=p[o+u],av=p[o+v],bu=p[o+3+u],bv=p[o+3+v],cu=p[o+6+u],cv=p[o+6+v];
  for(let i=Math.floor(Math.min(au,bu,cu)/cell);i<=Math.floor(Math.max(au,bu,cu)/cell);i++)for(let j=Math.floor(Math.min(av,bv,cv)/cell);j<=Math.floor(Math.max(av,bv,cv)/cell);j++){const k=key(i,j);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(o);}
 }
 // The outermost hit is the largest coordinate; inner/back faces always lie below it.
 return (a,b,fallback)=>{
  let best=-Infinity;
  for(const o of buckets.get(key(Math.floor(a/cell),Math.floor(b/cell)))||[]){
   const au=p[o+u],av=p[o+v],bu=p[o+3+u],bv=p[o+3+v],cu=p[o+6+u],cv=p[o+6+v],d=(bv-cv)*(au-cu)+(cu-bu)*(av-cv);
   if(!d)continue;
   const l1=((bv-cv)*(a-cu)+(cu-bu)*(b-cv))/d,l2=((cv-av)*(a-cu)+(au-cu)*(b-cv))/d,l3=1-l1-l2;
   if(l1<-1e-7||l2<-1e-7||l3<-1e-7)continue;
   const h=l1*p[o+w]+l2*p[o+3+w]+l3*p[o+6+w];if(h>best)best=h;
  }
  if(best===-Infinity){if(fallback!==undefined)return fallback;throw new Error(`Point outside surface: ${a}, ${b}`);}
  return best;
 };
}
