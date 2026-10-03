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
