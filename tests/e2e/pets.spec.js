import {test,expect} from '@playwright/test';
import {freshState,SAVE_KEY} from '../../src/state.js';

test('rapid pet selection keeps the chosen GLB, static portraits and adoption in sync',async({page})=>{
  const errors=[],bad=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
  await page.goto('/');
  await expect(page.locator('.cat-option.ready')).toHaveCount(34);
  await page.evaluate(()=>{document.querySelector('[data-breed=corgi]').click();document.querySelector('[data-breed=lop]').click();});
  await expect.poll(()=>page.evaluate(()=>window.__miaow.inspect().world.breed)).toBe('lop');
  await page.locator('#adopt-form button[type=submit]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-mode','home');
  expect(await page.evaluate(()=>window.__miaow.inspect().state.breed)).toBe('lop');
  expect(await page.evaluate(()=>window.__miaow.inspect().world.thumbnailShots)).toBe(0);
  expect(errors).toEqual([]);expect(bad).toEqual([]);
});

test('pet focus follows movement and restores the room without overflow',async({page})=>{
  await page.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:SAVE_KEY,state:{...freshState(),adopted:true,breed:'corgi'}});
  await page.goto('/');await expect(page.locator('#app')).toHaveAttribute('data-mode','home');
  await page.locator('#focus-pet').click();await expect(page.locator('#focus-pet')).toHaveAttribute('aria-pressed','true');
  const before=await page.evaluate(()=>window.__miaow.inspect().world.camera);
  await page.waitForTimeout(900);const after=await page.evaluate(()=>window.__miaow.inspect().world.camera);
  expect(Math.hypot(...after)).toBeLessThan(Math.hypot(...before));
  await page.locator('[data-drive=l]').dispatchEvent('pointerdown',{pointerId:1});await page.waitForTimeout(600);await page.locator('[data-drive=l]').dispatchEvent('pointerup',{pointerId:1});
  const moving=await page.evaluate(()=>window.__miaow.inspect().world);expect(moving.petFocus).toBe(true);expect(moving.pos.every(Number.isFinite)).toBe(true);
  await page.screenshot({path:`/tmp/cococat-pet-focus-${test.info().project.name}.png`});
  await page.locator('#focus-pet').click();await expect(page.locator('#focus-pet')).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
});
