import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {BREEDS} from '../src/state.js';
const base=process.env.PET_STUDIO_URL||'http://127.0.0.1:4201';
await mkdir(new URL('../public/pets/portraits/',import.meta.url),{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:256,height:256}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/scripts/pet-studio.html`);await page.waitForFunction(()=>!!window.__petStudio);
 for(const {id} of BREEDS){
  const metrics=await page.evaluate(id=>window.__petStudio.show(id),id);
  await page.screenshot({path:new URL(`../public/pets/portraits/${id}.png`,import.meta.url).pathname});
  console.log(JSON.stringify(metrics));
 }
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
