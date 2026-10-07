import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {NodeIO,Logger} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {dedup,prune,reorder,quantize} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {createCat,CAT_PROFILES} from '../src/cat-model.js';
import {disposeCat} from '../src/world.js';

// Node has Blob but not the browser FileReader used by Three's binary exporter.
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(buffer=>{this.result=buffer;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(buffer=>{this.result=`data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;this.onloadend?.();});}
};
await mkdir(new URL('../public/pets/',import.meta.url),{recursive:true});
const manifest=[];
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
for(const breed of Object.keys(CAT_PROFILES)){
  const cat=createCat(breed),{skin,head,body,anchors}=cat.userData;
  // Preserve bind bones and export guides for clothes/face placement. Runtime builds the expressive details.
  cat.traverse(o=>{if(o.isMesh)o.visible=o===skin;});
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88});skin.material=material;
  const face=cat.getObjectByName('sculpted-face');face.name='face-guide';face.visible=true;face.material=material;
  const torso=new THREE.Mesh(anchors.torsoGeometry,material);torso.name='torso-guide';body.add(torso);
  const originals=new Map();cat.traverse(o=>{originals.set(o,o.userData);o.userData={};});
  face.geometry=mergeVertices(face.geometry,1e-4);torso.geometry=mergeVertices(torso.geometry,1e-4);
  const exported=await new GLTFExporter().parseAsync(cat,{binary:true,onlyVisible:true});
  const document=await io.readBinary(new Uint8Array(exported));document.setLogger(new Logger(Logger.Verbosity.ERROR));
  // Preserve model-space positions and bind transforms for the game's attachment adapter.
  await document.transform(dedup(),prune(),reorder({encoder:MeshoptEncoder,target:'size'}),quantize({pattern:/^(NORMAL|COLOR_0|WEIGHTS_0|JOINTS_0)$/}));
  document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  const result=await io.writeBinary(document);
  for(const [o,data] of originals)o.userData=data;
  const file=`${breed}-full.glb`;
  await writeFile(new URL(`../public/pets/${file}`,import.meta.url),result);
  manifest.push({breed,file,bytes:result.byteLength,triangles:skin.geometry.index.count/3,bones:skin.skeleton.bones.length});
  console.log(JSON.stringify(manifest.at(-1)));disposeCat(cat);material.dispose();
}
await writeFile(new URL('../public/pets/manifest.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
