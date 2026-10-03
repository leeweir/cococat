export const BREEDS = [
 {id:'calico',name:'三花猫',tag:'古灵精怪',description:'披着奶油花外套的小机灵鬼',quote:'我的特长？把你的沙发变成我的。',color:'#f9eee3',patch:'#d88749',dark:'#594539',eye:'#9baa61',size:1},
 {id:'ragdoll',name:'布偶猫',tag:'软乎乎跟屁虫',description:'蓝眼睛、巧克力耳朵和蓬松围脖',quote:'你走到哪，我就瘫到哪。',color:'#f5eee7',patch:'#827169',dark:'#605251',eye:'#6ab9e2',size:1.03,fluffy:true},
 {id:'maine',name:'缅因猫',tag:'温柔大只佬',description:'大个子、尖尖耳毛和狮子围脖',quote:'别看我大只，我只是毛比较努力。',color:'#91857e',patch:'#625c60',dark:'#49414a',eye:'#a6bd75',size:1.18,fluffy:true},
 {id:'persian',name:'加菲猫',tag:'躺平美食家',description:'扁扁小脸、圆圆身子和奶油色毛毛',quote:'运动？翻个身算吗？',color:'#e9b675',patch:'#bc7d49',dark:'#9e6840',eye:'#d6a855',size:.96,round:true},
 {id:'orange',name:'橘猫',tag:'干饭冠军',description:'橘色虎斑，肚子里住着第二个胃',quote:'我不胖，我是可爱到膨胀。',color:'#e7a057',patch:'#b36b3e',dark:'#915338',eye:'#b89948',size:1.04,round:true},
 {id:'blue',name:'英短蓝猫',tag:'高冷小汤圆',description:'蓝灰绒毛、金色眼睛和圆圆脸',quote:'本喵很高冷。除非你有小鱼干。',color:'#939ead',patch:'#798695',dark:'#647181',eye:'#d9a84c',size:1,round:true}
];
export const OUTFITS=[{id:'none',name:'原味小猫',icon:'☁',hint:'毛茸茸就很好看'}, {id:'bow',name:'草莓领结',icon:'୨୧',hint:'今天是优雅喵'}, {id:'sailor',name:'蓝蓝水手服',icon:'⚓',hint:'向小鱼干出发'}, {id:'cape',name:'星星魔法斗篷',icon:'✧',hint:'魔法：饭碗变满'}, {id:'crown',name:'小小王冠',icon:'♔',hint:'这个家，听喵的'}];
export const ACTIONS={feed:{label:'喂饭',stat:'fullness',amount:26,scene:'home',duration:4600,quote:'等等，我的第二个胃还没准备好！',done:'光盘行动完成。饭碗：我太难了。'},bath:{label:'洗澡',stat:'clean',amount:35,scene:'bath',duration:5500,quote:'我可以湿身，但发型不能乱！',done:'洗出一只香香喵，附赠泡泡胡子。'},tv:{label:'看电视',stat:'mood',amount:23,scene:'tv',duration:5800,quote:'这条鱼演技不错，就是游不出来。',done:'追剧结束！已经想好给鱼写粉丝信了。'},play:{label:'出去玩',stat:'mood',amount:28,scene:'park',duration:6200,quote:'蝴蝶等等！我只是想问你午饭吃什么！',done:'带回一点快乐，和四只脏爪爪。'}};
// Keep the original storage key so a v1 pet comes along on the adventure.
export const SAVE_KEY='miaow-cottage-v1';
export const INGREDIENTS=[{id:'fish',name:'小鱼肉',icon:'🐟'},{id:'chicken',name:'鸡肉丁',icon:'🍗'},{id:'shrimp',name:'小虾仁',icon:'🦐'},{id:'pumpkin',name:'南瓜泥',icon:'🎃'}];
export const FAVORITES={calico:'shrimp',ragdoll:'chicken',maine:'fish',persian:'chicken',orange:'fish',blue:'shrimp'};
export const PERSONALITIES={calico:{name:'探险小机灵',activities:['box','walk','toy','sun']},ragdoll:{name:'黏人小棉花',activities:['follow','sleep','sun','follow']},maine:{name:'温柔巡逻员',activities:['tower','walk','sun','walk']},persian:{name:'沙发美食家',activities:['sleep','sofa','sniff','sleep']},orange:{name:'贪吃小旋风',activities:['sniff','toy','box','sniff']},blue:{name:'慢热小绅士',activities:['sun','sleep','walk','sofa']}};
export const FURNITURE=[
{id:'box',name:'纸箱城堡',icon:'📦',cost:0,behavior:'box',hint:'猫的快乐老家'},
{id:'bed',name:'云朵猫窝',icon:'☁',cost:4,behavior:'sleep',hint:'躺下就开始呼噜'},
{id:'tower',name:'星星猫爬架',icon:'✧',cost:8,behavior:'tower',hint:'登高巡视小屋'},
{id:'rug',name:'蓝蓝软地毯',icon:'❀',cost:3,behavior:'roll',hint:'打一个快乐的滚'},
{id:'toy',name:'不倒翁小鱼',icon:'♧',cost:5,behavior:'toy',hint:'一碰就摇来摇去'}
];
export const OUTFIT_COST={none:0,bow:0,sailor:6,cape:10,crown:14};
export const REGIONS=[{id:'park',name:'花花公园',icon:'🌸',intro:'花丛里藏着小宝贝，点地面带猫去看看。'}, {id:'garden',name:'蓝铃花园',icon:'🪻',intro:'花香里藏着秘密，花园管理员也是一只猫。'}, {id:'street',name:'月牙小街',icon:'🏘',intro:'沿着小街散步，看看邻居藏了什么。'}];
export const TREASURES=[
{id:'leaf',name:'爱心叶子',icon:'🍃',region:'park'},{id:'bell',name:'小铃铛',icon:'🔔',region:'park'},{id:'feather',name:'蓝羽毛',icon:'🪶',region:'park'},{id:'acorn',name:'小橡果',icon:'🌰',region:'park'},
{id:'flower',name:'蓝铃花',icon:'🪻',region:'garden'},{id:'ribbon',name:'粉色缎带',icon:'🎀',region:'garden'},{id:'stone',name:'星星石',icon:'⭐',region:'garden'},{id:'clover',name:'四叶草',icon:'🍀',region:'garden'},
{id:'button',name:'彩色纽扣',icon:'🔵',region:'street'},{id:'postcard',name:'猫猫明信片',icon:'✉',region:'street'},{id:'shell',name:'月牙贝壳',icon:'🐚',region:'street'},{id:'key',name:'迷你钥匙',icon:'🗝',region:'street'}
];
export const EVENTS=[
{id:'leaves',title:'落叶堆里的神秘声音',text:'猫一头扎进去，出来多了一顶叶子帽。',pose:'roll'},
{id:'butterfly',title:'蝴蝶发来赛跑邀请',text:'蝴蝶赢了。猫宣布：刚才只是热身。',pose:'chase'},
{id:'sneeze',title:'这朵花好像有点痒',text:'啊啾！花没动，猫自己吓了一跳。',pose:'sneeze'},
{id:'puddle',title:'水洼里出现另一只猫',text:'它伸爪打招呼，对面的猫也打了个水花。',pose:'paw'},
{id:'bag',title:'一个会响的纸袋',text:'检查完毕：没有零食。猫给了差评。',pose:'sniff'},
{id:'parade',title:'鸭鸭巡游，请让路',text:'猫混进队伍当了一会儿临时队长。',pose:'parade'}
];
export const BONDS=[{at:0,name:'初来乍到',hint:'多陪它玩一会儿'}, {at:12,name:'熟悉的朋友',hint:'学会听名字跑过来'}, {at:35,name:'黏人的搭档',hint:'主动蹭蹭，叼玩具来找你'}, {at:70,name:'认定的家人',hint:'每天回家可能收到小礼物'}];
export function bondLevel(s){return BONDS.filter(t=>s.bond>=t.at).at(-1);}
export function freshState(){return {version:2,adopted:false,breed:'calico',name:'糯米',outfit:'none',ownedOutfits:['none','bow'],fullness:66,clean:72,mood:75,bond:0,hearts:6,visits:0,memories:[],milestones:[],ownedFurniture:['box'],furniture:[{id:'box',x:2.45,z:1.25,rotation:0}],collection:[],friends:[],discoveredFoods:[],recipes:[],journeys:0,lastGiftDay:'',completedRewards:[],updatedAt:Date.now()};}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function normalizeSave(data){
 const s=freshState();if(!data||![1,2].includes(data.version))return s;
 s.adopted=data.adopted===true;s.breed=BREEDS.some(b=>b.id===data.breed)?data.breed:'calico';
 s.name=typeof data.name==='string'&&data.name.trim()?data.name.trim().slice(0,12):'糯米';
 for(const k of ['fullness','clean','mood'])s[k]=Number.isFinite(data[k])?clamp(data[k],0,100):s[k];
 for(const k of ['bond','hearts','visits','journeys'])s[k]=Number.isFinite(data[k])?clamp(Math.floor(data[k]),0,1000000):s[k];
 s.memories=Array.isArray(data.memories)?data.memories.filter(x=>typeof x==='string').slice(-60):[];
 const validList=(key,allowed,fallback=[])=>Array.isArray(data[key])?[...new Set(data[key].filter(x=>allowed.includes(x)))]:fallback;
 s.ownedOutfits=data.version===1?OUTFITS.map(o=>o.id):validList('ownedOutfits',OUTFITS.map(o=>o.id),s.ownedOutfits);s.ownedOutfits=[...new Set(['none','bow',...s.ownedOutfits])];
 s.outfit=s.ownedOutfits.includes(data.outfit)?data.outfit:'none';
 s.ownedFurniture=[...new Set(['box',...validList('ownedFurniture',FURNITURE.map(f=>f.id))])];
 if(Array.isArray(data.furniture)){const seen=new Set();s.furniture=data.furniture.filter(f=>f&&s.ownedFurniture.includes(f.id)&&!seen.has(f.id)&&seen.add(f.id)).map(f=>({id:f.id,x:clamp(Number.isFinite(f.x)?f.x:0,-3.2,3.2),z:clamp(Number.isFinite(f.z)?f.z:1,.2,2.25),rotation:Number.isFinite(f.rotation)?f.rotation%(Math.PI*2):0}));}
 s.collection=validList('collection',TREASURES.map(t=>t.id));s.friends=validList('friends',REGIONS.map(r=>r.id));s.discoveredFoods=validList('discoveredFoods',INGREDIENTS.map(i=>i.id));
 s.recipes=Array.isArray(data.recipes)?data.recipes.filter(x=>typeof x==='string').slice(-20):[];s.milestones=validList('milestones',BONDS.map(b=>b.at));
 s.completedRewards=Array.isArray(data.completedRewards)?data.completedRewards.filter(x=>typeof x==='string').slice(-100):[];s.lastGiftDay=typeof data.lastGiftDay==='string'?data.lastGiftDay:'';
 return s;
}
export function addMemory(s,text){if(text&&!s.memories.includes(text))s.memories=[...s.memories,text].slice(-60);return s;}
export function reward(s,{id,hearts=0,bond=0,stat,amount=0,memory}={}){
 if(id&&s.completedRewards.includes(id))return s;
 const n={...s,memories:[...s.memories],milestones:[...s.milestones],completedRewards:[...s.completedRewards]};
 n.hearts+=hearts;n.bond+=bond;if(stat)n[stat]=clamp(n[stat]+amount,0,100);if(id)n.completedRewards=[...n.completedRewards,id].slice(-100);addMemory(n,memory);
 for(const tier of BONDS.slice(1)){if(n.bond>=tier.at&&!n.milestones.includes(tier.at)){n.milestones.push(tier.at);addMemory(n,`关系成长：${tier.name}。${tier.hint}。`);}}
 n.updatedAt=Date.now();return n;
}
export function applyAction(s,action,id){const a=ACTIONS[action];if(!a)return s;let n=reward(s,{id,hearts:1,bond:5,stat:a.stat,amount:a.amount,memory:{feed:'第一次一起吃饭：它把碗舔出了反光。',bath:'第一次泡泡浴：猫少了一半，原来全是毛。',tv:'第一次追剧：认真研究了鱼的走位。',play:'第一次逛公园：蝴蝶赢了，猫不承认。'}[action]});if(n===s)return s;if(action==='play'){n.fullness=Math.max(5,n.fullness-8);n.clean=Math.max(5,n.clean-12);}return n;}
export function purchase(s,kind,id){const catalog=kind==='furniture'?FURNITURE:OUTFITS;const item=catalog.find(x=>x.id===id),key=kind==='furniture'?'ownedFurniture':'ownedOutfits';if(!item)return {state:s,ok:false,reason:'没有找到这件物品'};if(s[key].includes(id))return {state:s,ok:true,reason:'已经拥有'};const cost=kind==='furniture'?item.cost:OUTFIT_COST[id];if(s.hearts<cost)return {state:s,ok:false,reason:`还差 ${cost-s.hearts} 颗爱心，陪玩和寻宝都能获得`};return {state:{...s,hearts:s.hearts-cost,[key]:[...s[key],id]},ok:true,reason:`已解锁${item.name}`};}
export function placeFurniture(s,id,x,z,rotation=0){if(!s.ownedFurniture.includes(id))return s;const item={id,x:clamp(x,-3.2,3.2),z:clamp(z,.2,2.25),rotation};return {...s,furniture:[...s.furniture.filter(f=>f.id!==id),item]};}
export function serveRecipe(s,ingredients,id){const unique=[...new Set(ingredients)].filter(x=>INGREDIENTS.some(i=>i.id===x)).slice(0,2);if(!unique.length)return {state:s,liked:false};const liked=unique.includes(FAVORITES[s.breed]);let n=applyAction(s,'feed',id);if(n===s)return {state:s,liked};n={...n,discoveredFoods:[...new Set([...n.discoveredFoods,...unique])],recipes:[...new Set([...n.recipes,unique.slice().sort().join('+')])].slice(-20)};if(liked)n=reward(n,{hearts:1,bond:2,stat:'mood',amount:5});addMemory(n,liked?`发现最爱：${INGREDIENTS.find(i=>i.id===FAVORITES[s.breed]).name}。饭碗差点被舔穿。`:undefined);return {state:n,liked};}
export function makeOuting(region,journey){const items=TREASURES.filter(t=>t.region===region);const offset=journey%items.length;const positions=[[-2.5,1.5],[1.6,1.8],[-.85,-1.15]];return {id:`outing-${journey}-${region}`,region,found:[],event:EVENTS[Math.floor(Math.random()*EVENTS.length)],eventDone:false,friendDone:false,spots:positions.map(([x,z],i)=>({id:items[(offset+i)%items.length].id,x:x+Math.sin(journey+i)*.25,z:z+Math.cos(journey+i)*.15})),finished:false};}
export function collectTreasure(s,outing,itemId){if(outing.found.includes(itemId)||!outing.spots.some(x=>x.id===itemId))return {state:s,outing};const item=TREASURES.find(t=>t.id===itemId),isNew=!s.collection.includes(itemId);let n=reward(s,{id:`${outing.id}-${itemId}`,hearts:isNew?2:1,bond:2,memory:isNew?`带回${item.name}：小猫坚称这是价值连城的宝贝。`:undefined});n={...n,collection:[...new Set([...n.collection,itemId])]};return {state:n,outing:{...outing,found:[...outing.found,itemId]}};}
