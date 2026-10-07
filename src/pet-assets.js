import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Float32BufferAttribute} from 'three';

const cache=new Map(),pending=new Map();
export function cachedAnatomy(breed,lod){const key=`${breed}-${lod}`,entry=cache.get(key);if(entry){cache.delete(key);cache.set(key,entry);}return entry;}
function cpuGeometry(geometry){
  for(const name of ['position','normal','color','skinWeight']){
    const a=geometry.getAttribute(name);if(!a||!a.normalized)continue;
    const data=[];for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++)data.push(a.getComponent(i,j));
    geometry.setAttribute(name,new Float32BufferAttribute(data,a.itemSize));
  }
  return geometry;
}
export async function loadPetAsset(breed,lod='full'){
  const key=`${breed}-${lod}`;
  if(cache.has(key))return cache.get(key);
  if(!pending.has(key))pending.set(key,(async()=>{
    const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${import.meta.env.BASE_URL}pets/${key}.glb?v=anatomy-v2`);
    const skin=gltf.scene.getObjectByName('pet-skin'),face=gltf.scene.getObjectByName('face-guide'),torso=gltf.scene.getObjectByName('torso-guide');
    if(!skin||!face||!torso)throw new Error(`Incomplete pet asset: ${key}`);
    const result={skin:cpuGeometry(skin.geometry),face:cpuGeometry(face.geometry.index?face.geometry.toNonIndexed():face.geometry),torso:cpuGeometry(torso.geometry.index?torso.geometry.toNonIndexed():torso.geometry)};
    gltf.scene.traverse(o=>{if(o.isMesh){for(const m of [].concat(o.material))m.dispose();if(o!==skin&&o.geometry.index)o.geometry.dispose();}if(o.isSkinnedMesh)o.skeleton.dispose();});
    cache.set(key,result);
    while(cache.size>6){const oldest=cache.keys().next().value,entry=cache.get(oldest);cache.delete(oldest);for(const g of new Set(Object.values(entry)))g.dispose();}
    pending.delete(key);return result;
  })().catch(error=>{pending.delete(key);throw error;}));
  return pending.get(key);
}
export async function preparePetAsset(breed){
  // Offline source generation is a functional fallback if a CDN request fails.
  try{return await loadPetAsset(breed);}catch(error){console.warn('Using local pet sculpt fallback',breed,error.message);return null;}
}
