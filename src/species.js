// Every pet shares one rig and one home; species only changes words, voice and a few habits.
// noun: what the UI calls it, short: replaces a bare 猫, self: how it refers to itself, sound: its 喵.
export const SPECIES=[
 {id:'cat',name:'猫猫',icon:'🐱',noun:'小猫',short:'猫',self:'本喵',sound:'喵',voice:'meow'},
 {id:'dog',name:'狗狗',icon:'🐶',noun:'小狗',short:'狗',self:'本汪',sound:'汪',voice:'bark'},
 {id:'rabbit',name:'兔兔',icon:'🐰',noun:'小兔',short:'兔',self:'本兔',sound:'咕',voice:'squeak'},
 {id:'hedgehog',name:'刺猬',icon:'🦔',noun:'小刺猬',short:'刺猬',self:'本刺猬',sound:'哼哼',voice:'huff'},
 {id:'hamster',name:'仓鼠',icon:'🐹',noun:'小仓鼠',short:'仓鼠',self:'本鼠',sound:'吱',voice:'squeak'},
 {id:'chinchilla',name:'龙猫',icon:'🐭',noun:'小龙猫',short:'龙猫',self:'本龙猫',sound:'叽',voice:'chirp'},
 {id:'ferret',name:'雪貂',icon:'🦦',noun:'小雪貂',short:'雪貂',self:'本貂',sound:'咕咕',voice:'dook'},
 {id:'guineapig',name:'荷兰猪',icon:'🐹',noun:'小荷兰猪',short:'荷兰猪',self:'本猪猪',sound:'吱吱',voice:'wheek'},
 {id:'glider',name:'蜜袋鼯',icon:'🐿️',noun:'小蜜袋鼯',short:'蜜袋鼯',self:'本鼯',sound:'啾',voice:'chirp'}
];
export const SPECIES_BY_ID=new Map(SPECIES.map(s=>[s.id,s]));
// Adoption tabs group the rarer small pets together.
export const SPECIES_GROUPS=[{id:'all',name:'全部'},{id:'cat',name:'猫猫'},{id:'dog',name:'狗狗'},{id:'rabbit',name:'兔兔'},{id:'small',name:'小众萌宠'}];
export const groupOf=species=>['cat','dog','rabbit'].includes(species)?species:'small';
// Rewrites cat wording in UI copy for the adopted species. Names that already contain 猫 (龙猫) are protected first.
const PROTECT=['龙猫','喵呜小屋'];
export function speciesText(text,speciesId='cat'){
 const s=SPECIES_BY_ID.get(speciesId);if(!s||s.id==='cat'||typeof text!=='string'||!/[猫喵]/.test(text))return text;
 let out=text;PROTECT.forEach((w,i)=>{out=out.split(w).join(`\u0000${i}\u0000`);});
 // One pass, so 龙猫 produced by an earlier rule is never re-matched by the bare 猫 rule.
 const map={'小猫咪':s.noun,'小猫':s.noun,'猫咪':s.noun,'猫猫':s.name,'本喵':s.self,'喵喵':s.sound.length>1?s.sound:s.sound+s.sound,'喵':s.sound,'猫':s.short};
 out=out.replace(/小猫咪|小猫|猫咪|猫猫|本喵|喵喵|喵|猫/g,m=>map[m]);
 PROTECT.forEach((w,i)=>{out=out.split(`\u0000${i}\u0000`).join(w);});
 return out;
}
