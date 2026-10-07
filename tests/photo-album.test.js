import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalizeSave} from '../src/state.js';
import {parseSave} from '../src/save-manager.js';
import {MAX_PHOTOS,MAX_PHOTO_DATA,jpegDimensions,validPhoto,addPhoto,removePhoto,validatePhotos} from '../src/photo-album.js';
// Minimal SOF structure for the synchronous header validator; real encoding/decoding is covered in browser tests.
const header=Buffer.from([255,216,255,192,0,8,8,0,1,0,1,0,255,217]).toString('base64');
const photo=()=>({id:'photo-1',name:'团子',at:'2026-10-07T12:00:00.000Z',outfit:{head:'beanie'},width:1,height:1,image:`data:image/jpeg;base64,${header}`});
test('photo header validation rejects unsafe URLs, huge data and mismatched dimensions',()=>{
 assert.deepEqual(jpegDimensions(photo().image),{width:1,height:1});assert.ok(validPhoto(photo()));
 for(const p of [{...photo(),image:'data:image/svg+xml,<svg/>'},{...photo(),image:'https://example.com/a.jpg'},{...photo(),image:'x'.repeat(MAX_PHOTO_DATA+1)},{...photo(),width:99999},{...photo(),at:'bad'},{...photo(),image:'data:image/jpeg;base64,/9j/2Q=='}])assert.equal(validPhoto(p),false);
});
test('bounded photos preserve metadata across saves, duplicate IDs rejected, deletion frees a slot',()=>{
 let s=freshState();for(let i=0;i<MAX_PHOTOS;i++)s=addPhoto(s,{...photo(),id:`photo-${i}`});
 assert.equal(addPhoto(s,{...photo(),id:'extra'}),s);assert.equal(addPhoto(s,photo()),s);
 assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(s))).photos,s.photos);
 s=removePhoto(s,'photo-0');assert.equal(addPhoto(s,{...photo(),id:'extra'}).photos.length,MAX_PHOTOS);
});
test('old memories remain intact and malformed photo imports fail before replacement',()=>{
 const old={...freshState(),memories:['原来的相遇']};delete old.photos;
 assert.deepEqual(normalizeSave(old).memories,['原来的相遇']);assert.deepEqual(normalizeSave(old).photos,[]);
 for(const photos of [[{...photo(),image:'javascript:alert(1)'}],[photo(),photo()],{},Array(MAX_PHOTOS+1).fill(photo())]){
  assert.throws(()=>validatePhotos(photos));assert.throws(()=>parseSave(JSON.stringify({...freshState(),photos})));
 }
});
