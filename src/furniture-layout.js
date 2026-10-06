import {blocked} from './navigation.js';
import {FURNITURE_BY_ID} from './state.js';
export const furnitureRadius=id=>FURNITURE_BY_ID.get(id)?.r??0;
export const furnitureHeight=id=>FURNITURE_BY_ID.get(id)?.h??.42;
export const ROOM_OBSTACLES=[{id:'sofa',x:-2.3,z:-.9,w:2.55,d:1.45,height:1.45},{id:'wardrobe',x:2.85,z:-1.75,w:1.9,d:1.2,height:2.9},{id:'tv',x:.6,z:-2.28,w:2.25,d:.9,height:1.4},{id:'plant',type:'circle',x:-3.5,z:1.8,r:.35,height:1.2},{id:'lamp',type:'circle',x:-3.85,z:-1.7,r:.3,height:2.1}];
// Pieces are matched by uid so two cushions can live side by side; legacy items without a uid fall back to their type id.
const key=f=>f.uid??f.id;
export function validPlacement(item,items,cat){
 const r=furnitureRadius(item.id);if(!r)return true;
 if(Math.abs(item.x)+r>4.3||item.z+r>3.0||item.z-r<-2.85||blocked(item.x,item.z,ROOM_OBSTACLES,r+.04))return false;
 if(cat&&Math.hypot(item.x-cat.x,item.z-cat.z)<r+.7)return false;
 return !items.some(f=>key(f)!==key(item)&&furnitureRadius(f.id)&&Math.hypot(f.x-item.x,f.z-item.z)<r+furnitureRadius(f.id)+.06);
}
export function fitFurniture(items){
 const placed=[];
 for(const item of items){let candidate={...item};if(!validPlacement(candidate,placed,{x:0,z:1.65})){
  const options=[];for(let z=-2.2;z<=2.2;z+=.25)for(let x=-3.2;x<=3.2;x+=.25){const c={...item,x,z};if(validPlacement(c,placed,{x:0,z:1.65}))options.push(c);}
  options.sort((a,b)=>Math.hypot(a.x-item.x,a.z-item.z)-Math.hypot(b.x-item.x,b.z-item.z));if(options.length)candidate=options[0];
 }placed.push(candidate);}return placed;
}
