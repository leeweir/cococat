import {normalizeOutfit} from './wardrobe.js';
import {normalizeDaily} from './daily-wishes.js';
import {normalizePhotos} from './photo-album.js';
const breed=(id,name,tag,description,quote,color,favorite,personality,activities,voice=1,species='cat')=>({id,name,tag,description,quote,color,favorite,personality,activities,voice,species});
export const BREEDS = [
 breed('calico','三花猫','古灵精怪','披着奶油花外套的小机灵鬼','我的特长？把你的沙发变成我的。','#fff8ee','shrimp','探险小机灵',['box','walk','toy','sun'],1.04),
 breed('ragdoll','布偶猫','软乎乎跟屁虫','蓝眼睛、巧克力耳朵和蓬松围脖','你走到哪，我就瘫到哪。','#fbf2e4','chicken','黏人小棉花',['follow','sleep','sun','follow'],1.08),
 breed('maine','缅因猫','温柔大只佬','大个子、尖尖耳毛和狮子围脖','别看我大只，我只是毛比较努力。','#a7907d','fish','温柔巡逻员',['tower','walk','sun','walk'],.82),
 breed('persian','加菲猫','躺平美食家','扁扁小脸、圆圆身子和奶油色毛毛','运动？翻个身算吗？','#f0cf9c','chicken','沙发美食家',['sleep','sofa','sniff','sleep'],.94),
 breed('orange','橘猫','干饭冠军','橘色虎斑，肚子里住着第二个胃','我不胖，我是可爱到膨胀。','#f3a75c','fish','贪吃小旋风',['sniff','toy','box','sniff'],.96),
 breed('blue','英短蓝猫','高冷小汤圆','蓝灰绒毛、金色眼睛和圆圆脸','本喵很高冷。除非你有小鱼干。','#a2adbe','shrimp','慢热小绅士',['sun','sleep','walk','sofa'],.9),
 breed('siamese','暹罗猫','话痨小煤球','奶咖身子、深色小脸和蓝宝石眼睛','我有一百句话要说，先从第一句开始：喵。','#f1e2cc','fish','话痨小管家',['follow','walk','toy','follow'],1.18),
 breed('black','黑猫','月夜小精灵','乌黑发亮的毛和两颗小月亮眼睛','关灯以后，我就隐身成功了。','#3b3438','shrimp','夜巡小侦探',['box','tower','walk','box'],1.02),
 breed('white','白猫','软糯小雪团','雪白绒毛，一只蓝眼一只金眼','我一只眼睛看你，另一只眼睛也看你。','#fbf8f3','chicken','安静小雪团',['sun','sleep','sun','follow'],1.12),
 breed('cow','奶牛猫','奶牛警长','黑白花外套，鼻子上还有一颗痣','这个家的治安，由本警长负责。','#fdfaf5','fish','奶牛小警长',['walk','box','toy','walk'],1),
 breed('lihua','狸花猫','街头小霸王','褐色鱼骨纹和精神的绿眼睛','整条街都是我的，现在你也是。','#b8956b','fish','元气小霸王',['walk','toy','tower','walk'],.98),
 breed('fold','折耳猫','圆脸小汤包','耳朵折成小帽子，脸圆得像汤包','耳朵折起来，是为了更专心听你说话。','#ead8c2','chicken','乖巧小汤包',['sleep','follow','sun','sleep'],1.1),
 breed('sphynx','无毛猫','光溜溜暖宝宝','没有毛毛，只有满满的热乎劲','我不是没穿衣服，我是在等你给我挑。','#f2c9b7','chicken','黏人暖宝宝',['follow','sun','sleep','follow'],1.06),
 breed('bengal','豹猫','迷你小豹子','金色毛上开满了玫瑰花斑','我在练习狩猎。目标：你的拖鞋。','#e8b867','shrimp','运动小健将',['tower','toy','walk','toy'],.92),
 breed('russian','俄罗斯蓝猫','银色小绅士','银蓝短毛和翡翠绿的眼睛','初次见面，请多关照。第二次见面，请多摸摸。','#9eaab8','fish','优雅小绅士',['sun','tower','sleep','walk'],1),
 breed('aby','阿比西尼亚','好奇小狮子','暖橘色的刺鼠毛，大耳朵什么都想听','那个柜子顶上有什么？我必须知道。','#d99a64','shrimp','好奇探险家',['tower','walk','box','tower'],1.05),
 breed('american','美短虎斑','元气小银虎','银色底子上画着黑色漩涡纹','今天的计划：吃饭、巡逻、和你玩。','#c9cdd2','chicken','元气小银虎',['walk','toy','sun','walk'],.98),
 breed('munchkin','曼基康','小短腿冲冲','腿短短，跑起来像一颗小汤圆在滚','腿短？那是因为我离地板更近，更懂地板。','#f5c58e','pumpkin','短腿小冲冲',['toy','walk','box','toy'],1.15),
 breed('golden','金渐层','金色小太阳','金色渐层绒毛，像裹了一层阳光','我在发光，因为你来了。','#f0cc8a','pumpkin','暖暖小太阳',['sun','sleep','sofa','sun'],.96),
 breed('norwegian','挪威森林猫','森林小王子','蓬松长毛、狮子围脖和大毛尾巴','我来自森林，但更喜欢你的沙发。','#c4b4a2','fish','森林小王子',['tower','sun','walk','sleep'],.86),
 breed('corgi','柯基','短腿小屁屁','大耳朵、短短腿，走路屁股一扭一扭','腿短不是问题，追你照样第一名。','#e7a35f','chicken','快乐小跟班',['follow','toy','walk','follow'],1,'dog'),
 breed('shiba','柴犬','微笑小柴','红棕毛、白脸颊和卷卷的尾巴','我在笑吗？我一直都在笑。','#d9874a','chicken','倔强小可爱',['walk','sun','toy','walk'],.95,'dog'),
 breed('goldenretriever','金毛','暖心大宝贝','金色长毛、耷拉耳朵和摇不停的尾巴','你回来啦！你回来啦！你回来啦！','#e5bd78','chicken','暖心大宝贝',['follow','toy','sofa','follow'],.82,'dog'),
 breed('pomeranian','博美','蓬蓬小毛球','一团会走路的棉花糖','我不是胖，我是毛量惊人。','#f2c38a','chicken','活泼小毛球',['toy','follow','walk','toy'],1.25,'dog'),
 breed('husky','哈士奇','拆家小队长','蓝眼睛、灰白脸，表情永远很戏剧','我没拆家，我只是在帮沙发重新装修。','#aab3bd','fish','戏精小队长',['walk','toy','box','walk'],.9,'dog'),
 breed('lop','垂耳兔','软耳朵小团子','两只耳朵垂下来，像戴了顶软帽子','耳朵垂下来，是为了把好消息都兜住。','#e9d3b4','carrot','温柔小团子',['sleep','box','sniff','follow'],1.15,'rabbit'),
 breed('dwarf','侏儒兔','迷你小汤圆','小小一只，短耳朵圆脑袋','我很小，但我的胃口很大。','#cdb59a','carrot','好奇小汤圆',['box','sniff','walk','box'],1.3,'rabbit'),
 breed('lionhead','狮子兔','毛领小狮王','脑袋一圈蓬蓬的狮子鬃毛','嗷呜——我是说，咕。','#f6efe4','pumpkin','威风小狮王',['sun','sniff','sleep','toy'],1.2,'rabbit'),
 breed('hedgehog','刺猬','软刺小团子','背上一身小软刺，肚皮软乎乎','我很扎手吗？那是你还没摸到我的肚皮。','#b39b82','chicken','害羞小团子',['box','sleep','sniff','box'],1.35,'hedgehog'),
 breed('hamster','仓鼠','腮帮子大王','圆滚滚，腮帮子能塞下一整个早餐','这颗瓜子我先存着，明天再吃。','#e8b878','pumpkin','囤粮小专家',['box','toy','sniff','sleep'],1.45,'hamster'),
 breed('chinchilla','龙猫','云朵小绒球','银灰绒毛、大圆耳朵和蓬松大尾巴','我的毛很软，摸一下就会上瘾。','#b7b9bd','carrot','夜猫小绒球',['tower','sleep','box','sleep'],1.3,'chinchilla'),
 breed('ferret','雪貂','长条小捣蛋','长长的身子，戴着天生的小面罩','藏东西是我的特长。你的袜子在哪？问我就对了。','#efe2cc','chicken','长条小捣蛋',['box','toy','walk','box'],1.1,'ferret'),
 breed('guineapig','荷兰猪','土豆小胖墩','圆滚滚的三色小土豆，没有尾巴','吱吱！听到塑料袋响了，是吃的吗？','#d8a77a','carrot','话痨小土豆',['sniff','box','sleep','sniff'],1.4,'guineapig'),
 breed('glider','蜜袋鼯','大眼小飞侠','大大的眼睛，背上一条小黑线','我会滑翔，从沙发到你的肩膀只要一秒。','#a9a6a8','pumpkin','夜行小飞侠',['tower','follow','sleep','tower'],1.35,'glider')
];
export const ACTIONS={feed:{label:'喂饭',stat:'fullness',amount:26,scene:'home',duration:4600,quote:'等等，我的第二个胃还没准备好！',done:'光盘行动完成。饭碗：我太难了。'},bath:{label:'洗澡',stat:'clean',amount:35,scene:'bath',duration:5500,quote:'我可以湿身，但发型不能乱！',done:'洗出一只香香喵，附赠泡泡胡子。'},tv:{label:'看电视',stat:'mood',amount:23,scene:'tv',duration:5800,quote:'这条鱼演技不错，就是游不出来。',done:'追剧结束！已经想好给鱼写粉丝信了。'},play:{label:'出去玩',stat:'mood',amount:28,scene:'park',duration:6200,quote:'蝴蝶等等！我只是想问你午饭吃什么！',done:'带回一点快乐，和四只脏爪爪。'}};
// Keep the original storage key so a v1 pet comes along on the adventure.
export const SAVE_KEY='miaow-cottage-v1';
export const INGREDIENTS=[{id:'fish',name:'小鱼肉',icon:'🐟'},{id:'chicken',name:'鸡肉丁',icon:'🍗'},{id:'shrimp',name:'小虾仁',icon:'🦐'},{id:'pumpkin',name:'南瓜泥',icon:'🎃'},{id:'carrot',name:'胡萝卜',icon:'🥕'}];
export const FAVORITES=Object.fromEntries(BREEDS.map(b=>[b.id,b.favorite]));
export const PERSONALITIES=Object.fromEntries(BREEDS.map(b=>[b.id,{name:b.personality,activities:b.activities}]));
// r: floor footprint (0 = rug the cat can walk over), h: obstacle height, perch: where the cat sits, approach: stop distance in front.
const furniture=(id,name,icon,cost,behavior,r,h,perch,approach,hint)=>({id,name,icon,cost,behavior,r,h,perch,approach,hint});
export const FURNITURE=[
 furniture('box','纸箱城堡','📦',0,'box',.83,.78,.06,1.18,'猫的快乐老家'),
 furniture('bed','云朵猫窝','☁️',4,'sleep',.74,.42,.39,0,'躺下就开始呼噜'),
 furniture('tower','星星猫爬架','🗼',8,'tower',.72,1.4,1.34,0,'登高巡视小屋'),
 furniture('rug','蓝蓝软地毯','🟦',3,'roll',0,0,.06,0,'打一个快乐的滚'),
 furniture('toy','不倒翁小鱼','🐟',5,'toy',.29,1,.06,.75,'一碰就摇来摇去'),
 furniture('cushion','草莓坐垫','🍓',0,'sleep',.46,.2,.2,0,'软软的，适合打盹'),
 furniture('scratcher','猫抓板','🪵',0,'paw',.42,.3,.06,.68,'磨爪子专用，沙发得救了'),
 furniture('plant','龟背竹盆栽','🪴',0,'sniff',.36,1.2,.06,.7,'闻闻叶子，假装在思考'),
 furniture('lamp','星星落地灯','💡',0,'sniff',.3,1.8,.06,.62,'晚上亮晶晶'),
 furniture('table','原木小茶几','🪑',0,'tower',.55,.6,.64,0,'跳上去看看风景'),
 furniture('rainbowrug','彩虹地垫','🌈',0,'roll',0,0,.06,0,'在彩虹上打滚'),
 furniture('cactus','仙人掌朋友','🌵',0,'sniff',.3,.9,.06,.66,'可以看，不可以抱'),
 furniture('tent','小帐篷','⛺',4,'box',.72,.95,.06,1.05,'秘密基地，闲人免进'),
 furniture('fishtank','小鱼缸','🐠',6,'watch',.5,1.1,.06,.85,'今天的节目：小鱼游泳'),
 furniture('piano','玩具钢琴','🎹',6,'paw',.62,.8,.06,.85,'一爪一个音符'),
 furniture('tunnel','彩虹隧道','🌀',5,'box',.6,.55,.06,0,'钻进去，再钻出来'),
 furniture('hammock','窗边吊床','🛏️',7,'sleep',.6,.7,.62,0,'晃呀晃，晃进梦里'),
 furniture('ballpit','毛线球池','🧶',6,'roll',.62,.35,.32,0,'跳进去，被毛线球淹没'),
 furniture('heartrug','爱心地毯','💗',3,'roll',0,0,.06,0,'软乎乎的爱心'),
 furniture('xmastree','迷你圣诞树','🎄',5,'sniff',.42,1.5,.06,.72,'挂满了想抓的小球'),
 furniture('fountain','流水饮水机','⛲',4,'sniff',.34,.5,.06,.62,'活水才好喝'),
 furniture('house','木头小猫屋','🏠',8,'box',.75,1.1,.06,1.05,'有门有窗的小别墅'),
 furniture('chair','懒人沙发','🛋️',6,'sleep',.6,.55,.44,0,'陷进去就起不来')
];
export const FURNITURE_BY_ID=new Map(FURNITURE.map(f=>[f.id,f]));
export const MAX_FURNITURE=30;
export const WALL_THEMES=[{id:'cream',name:'奶油白',color:'#eee5d5'},{id:'sakura',name:'樱花粉',color:'#f3dcdc'},{id:'mint',name:'薄荷绿',color:'#dbe9dc'},{id:'sky',name:'天空蓝',color:'#d8e6ef'},{id:'lavender',name:'薰衣草',color:'#e5dcef'},{id:'lemon',name:'柠檬黄',color:'#f4ecc6'},{id:'night',name:'星夜蓝',color:'#4b5677'}];
export const FLOOR_THEMES=[{id:'oak',name:'原木',colors:['#d8b58c','#d4b38a']},{id:'walnut',name:'胡桃木',colors:['#a87c58','#9f7653']},{id:'white',name:'白橡木',colors:['#eadfcb','#e3d6bf']},{id:'cherry',name:'樱桃木',colors:['#c98d6f','#c2876a']},{id:'grey',name:'灰木纹',colors:['#c9c3b8','#c1bbb0']}];
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
export function freshState(){return {version:3,dailyWishes:normalizeDaily(),photos:[],adopted:false,breed:'calico',name:'糯米',outfit:{},fullness:66,clean:72,mood:75,bond:0,hearts:6,visits:0,memories:[],milestones:[],ownedFurniture:['box'],furniture:[{uid:'box',id:'box',x:2.45,z:1.25,rotation:0}],roomTheme:{wall:'cream',floor:'oak'},collection:[],displayedTreasures:[],friends:[],discoveredFoods:[],recipes:[],journeys:0,lastGiftDay:'',completedRewards:[],updatedAt:Date.now()};}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const FLOOR_LIMITS={minX:-3.6,maxX:3.6,minZ:-2.4,maxZ:2.4};
// Free furniture is always owned; paid pieces unlock once and can then be placed as many times as you like.
export const ownsFurniture=(s,id)=>FURNITURE_BY_ID.get(id)?.cost===0||s.ownedFurniture.includes(id);
const cleanItem=(f,uid)=>({uid,id:f.id,x:clamp(Number.isFinite(f.x)?f.x:0,FLOOR_LIMITS.minX,FLOOR_LIMITS.maxX),z:clamp(Number.isFinite(f.z)?f.z:1,FLOOR_LIMITS.minZ,FLOOR_LIMITS.maxZ),rotation:Number.isFinite(f.rotation)?f.rotation%(Math.PI*2):0});
export function normalizeSave(data){
 const s=freshState();if(!data||![1,2,3].includes(data.version))return s;
 s.dailyWishes=normalizeDaily(data.dailyWishes);s.photos=normalizePhotos(data.photos);
 s.adopted=data.adopted===true;s.breed=BREEDS.some(b=>b.id===data.breed)?data.breed:'calico';
 s.name=typeof data.name==='string'&&data.name.trim()?data.name.trim().slice(0,12):'糯米';
 for(const k of ['fullness','clean','mood'])s[k]=Number.isFinite(data[k])?clamp(data[k],0,100):s[k];
 for(const k of ['bond','hearts','visits','journeys'])s[k]=Number.isFinite(data[k])?clamp(Math.floor(data[k]),0,1000000):s[k];
 s.memories=Array.isArray(data.memories)?data.memories.filter(x=>typeof x==='string').slice(-60):[];
 const validList=(key,allowed,fallback=[])=>Array.isArray(data[key])?[...new Set(data[key].filter(x=>allowed.includes(x)))]:fallback;
 // v1/v2 stored one outfit id; v3 stores one piece per slot.
 s.outfit=normalizeOutfit(data.outfit);
 s.ownedFurniture=[...new Set(['box',...validList('ownedFurniture',FURNITURE.map(f=>f.id))])];
 if(Array.isArray(data.furniture)){const seen=new Set();s.furniture=data.furniture.filter(f=>f&&ownsFurniture(s,f.id)).map(f=>cleanItem(f,typeof f.uid==='string'&&/^[\w-]{1,40}$/.test(f.uid)?f.uid:f.id)).filter(f=>!seen.has(f.uid)&&seen.add(f.uid)).slice(0,MAX_FURNITURE);}
 const theme=data.roomTheme||{};s.roomTheme={wall:WALL_THEMES.some(t=>t.id===theme.wall)?theme.wall:'cream',floor:FLOOR_THEMES.some(t=>t.id===theme.floor)?theme.floor:'oak'};
 s.collection=validList('collection',TREASURES.map(t=>t.id));s.displayedTreasures=normalizeTreasureDisplay(data.displayedTreasures,s.collection);s.friends=validList('friends',REGIONS.map(r=>r.id));s.discoveredFoods=validList('discoveredFoods',INGREDIENTS.map(i=>i.id));
 s.recipes=Array.isArray(data.recipes)?data.recipes.filter(x=>typeof x==='string').slice(-20):[];s.milestones=validList('milestones',BONDS.map(b=>b.at));
 s.completedRewards=Array.isArray(data.completedRewards)?data.completedRewards.filter(x=>typeof x==='string').slice(-100):[];s.lastGiftDay=typeof data.lastGiftDay==='string'?data.lastGiftDay:'';
 return s;
}
export function normalizeTreasureDisplay(ids,collection=[]){return Array.isArray(ids)?[...new Set(ids)].filter(id=>collection.includes(id)&&TREASURES.some(t=>t.id===id)).slice(0,3):[];}
export function toggleTreasureDisplay(s,id){
 if(!s.collection.includes(id)||!TREASURES.some(t=>t.id===id))return s;
 const current=normalizeTreasureDisplay(s.displayedTreasures,s.collection);
 if(current.includes(id))return {...s,displayedTreasures:current.filter(x=>x!==id)};
 return current.length<3?{...s,displayedTreasures:[...current,id]}:s;
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
export function purchase(s,kind,id){const item=kind==='furniture'?FURNITURE_BY_ID.get(id):null;if(!item)return {state:s,ok:false,reason:'没有找到这件物品'};if(ownsFurniture(s,id))return {state:s,ok:true,reason:'已经拥有'};if(s.hearts<item.cost)return {state:s,ok:false,reason:`还差 ${item.cost-s.hearts} 颗爱心，陪玩和寻宝都能获得`};return {state:{...s,hearts:s.hearts-item.cost,ownedFurniture:[...s.ownedFurniture,id]},ok:true,reason:`已解锁${item.name}`};}
export function newFurnitureUid(s,id){let n=1;while(s.furniture.some(f=>f.uid===`${id}-${n}`))n++;return `${id}-${n}`;}
// Moves an existing piece (matched by uid) or places a new one; a new piece never reuses a uid already on the floor.
export function placeFurniture(s,{uid,id,x,z,rotation=0}){const existing=s.furniture.find(f=>f.uid===uid);const type=existing?.id||id;if(!ownsFurniture(s,type)||(!existing&&s.furniture.length>=MAX_FURNITURE))return s;const taken=u=>!u||s.furniture.some(f=>f.uid===u);const item=cleanItem({id:type,x,z,rotation},existing?uid:taken(uid)?(taken(type)?newFurnitureUid(s,type):type):uid);return {...s,furniture:existing?s.furniture.map(f=>f.uid===uid?item:f):[...s.furniture,item]};}
export function removeFurniture(s,uid){return {...s,furniture:s.furniture.filter(f=>f.uid!==uid)};}
export function serveRecipe(s,ingredients,id){const unique=[...new Set(ingredients)].filter(x=>INGREDIENTS.some(i=>i.id===x)).slice(0,2);if(!unique.length)return {state:s,liked:false};const liked=unique.includes(FAVORITES[s.breed]);let n=applyAction(s,'feed',id);if(n===s)return {state:s,liked};n={...n,discoveredFoods:[...new Set([...n.discoveredFoods,...unique])],recipes:[...new Set([...n.recipes,unique.slice().sort().join('+')])].slice(-20)};if(liked)n=reward(n,{hearts:1,bond:2,stat:'mood',amount:5});addMemory(n,liked?`发现最爱：${INGREDIENTS.find(i=>i.id===FAVORITES[s.breed]).name}。饭碗差点被舔穿。`:undefined);return {state:n,liked};}
export function makeOuting(region,journey){const items=TREASURES.filter(t=>t.region===region);const offset=journey%items.length;const positions=[[-2.5,1.5],[1.6,1.8],[-.85,-1.15]];return {id:`outing-${journey}-${region}`,region,found:[],event:EVENTS[Math.floor(Math.random()*EVENTS.length)],eventDone:false,friendDone:false,spots:positions.map(([x,z],i)=>({id:items[(offset+i)%items.length].id,x:x+Math.sin(journey+i)*.25,z:z+Math.cos(journey+i)*.15})),finished:false};}
export function collectTreasure(s,outing,itemId){if(outing.found.includes(itemId)||!outing.spots.some(x=>x.id===itemId))return {state:s,outing};const item=TREASURES.find(t=>t.id===itemId),isNew=!s.collection.includes(itemId);let n=reward(s,{id:`${outing.id}-${itemId}`,hearts:isNew?2:1,bond:2,memory:isNew?`带回${item.name}：小猫坚称这是价值连城的宝贝。`:undefined});n={...n,collection:[...new Set([...n.collection,itemId])]};return {state:n,outing:{...outing,found:[...outing.found,itemId]}};}
