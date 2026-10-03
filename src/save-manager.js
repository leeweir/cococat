import {SAVE_KEY,freshState,normalizeSave} from './state.js';
export const BACKUP_KEY=`${SAVE_KEY}-before-restart`;
export function restartGame(storage,current){
 // Archive first: if storage is full, leave the active game untouched.
 if(current.adopted)storage.setItem(BACKUP_KEY,JSON.stringify(current));
 const next=freshState();storage.setItem(SAVE_KEY,JSON.stringify(next));return next;
}
export function previousGame(storage){
 try{const raw=JSON.parse(storage.getItem(BACKUP_KEY));const s=normalizeSave(raw);return s.adopted?s:null;}catch{return null;}
}
export function restoreGame(storage){
 const previous=previousGame(storage);if(!previous)return null;
 storage.setItem(SAVE_KEY,JSON.stringify(previous));return previous;
}
