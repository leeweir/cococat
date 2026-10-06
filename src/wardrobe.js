// 100 free, mix-and-match pieces. Every slot holds one piece; `kind` picks the 3D builder in outfit-model.js.
export const SLOTS=[
 {id:'head',name:'帽子头饰',icon:'🎩'},{id:'face',name:'眼镜脸饰',icon:'👓'},{id:'neck',name:'领口围脖',icon:'🎀'},{id:'top',name:'上衣',icon:'👕'},
 {id:'bottom',name:'裤子裙子',icon:'👖'},{id:'back',name:'背饰翅膀',icon:'🪽'},{id:'feet',name:'鞋子袜子',icon:'👟'},{id:'tail',name:'尾巴饰品',icon:'🎐'}
];
const RAINBOW=['#f08a8a','#f6b26b','#f6dc6b','#8fd08a','#7cb6e6','#b49ae6'];
const item=(slot,id,name,icon,kind,c,extra={})=>({slot,id,name,icon,kind,c,...extra});
export const WARDROBE=[
 // head · 22
 item('head','beret-berry','草莓贝雷帽','🍓','beret',['#e5737f','#7fae6a','#fff3d6'],{berry:true}),
 item('head','crown-gold','小小王冠','👑','crown',['#e2bd62','#d2697c','#7cb6d6']),
 item('head','crown-ice','冰雪王冠','❄️','crown',['#cdeaf5','#ffffff','#8fc7e5']),
 item('head','wizard','星星巫师帽','🧙','cone',['#6a5aa8','#f4d27a'],{brim:true,stars:true,height:.62}),
 item('head','party','派对尖尖帽','🎉','cone',['#f0a3bd','#ffe08a'],{stripes:true,pom:true,height:.46}),
 item('head','santa','圣诞小帽','🎅','cone',['#d4524f','#ffffff'],{fur:true,pom:true,flop:true,height:.5}),
 item('head','unicorn','独角兽之角','🦄','horn',['#fff1c8','#f5b6cf','#b9a7e8']),
 item('head','tophat','魔术师礼帽','🎩','tophat',['#3d3540','#c95b6e','#ffffff']),
 item('head','chef','大厨高帽','👨‍🍳','chef',['#fffdf7']),
 item('head','propeller','竹蜻蜓小帽','🚁','propeller',['#f2c14e','#e46a6a','#5aa6d6','#7cc28a']),
 item('head','wreath','春日花环','🌸','wreath',['#f6b3c4','#fff0a8','#bfe0f5','#8fbf7a']),
 item('head','frog','呱呱青蛙帽','🐸','frog',['#8cc56f','#ffffff','#2f2a2a']),
 item('head','astronaut','宇航员头盔','🧑‍🚀','helmet',['#f4f6f8','#bfe6ff','#e46a6a']),
 item('head','cowboy','牛仔帽','🤠','cowboy',['#b9824f','#7a5233']),
 item('head','bunny','兔耳朵发箍','🐰','bunny',['#fff8f2','#f6b6c4']),
 item('head','halo','天使光环','😇','halo',['#ffe28a']),
 item('head','pirate','海盗船长帽','🏴‍☠️','pirate',['#2f2b33','#f7f1e3','#d8b25c']),
 item('head','beanie','毛线小圆帽','🧶','beanie',['#e8936a','#fff3e0']),
 item('head','mushroom','蘑菇伞帽','🍄','mushroom',['#e0574f','#fffaf0']),
 item('head','sprout','头顶小豆芽','🌱','sprout',['#86c06a','#6aa356']),
 item('head','cake','生日蛋糕帽','🎂','cake',['#fff3e3','#f4a7b9','#ffd36e']),
 item('head','alien','外星人触角','👽','antenna',['#a6e07a','#f3f58a']),
 // face · 11
 item('face','glasses-round','复古圆框眼镜','👓','glasses',['#c9a25a'],{frame:'round'}),
 item('face','glasses-nerd','学霸黑框','🤓','glasses',['#3a3236'],{frame:'square'}),
 item('face','shades-heart','爱心墨镜','💖','shades',['#e2577c','#ff9fb8'],{frame:'heart'}),
 item('face','shades-star','星星墨镜','⭐','shades',['#f2c14e','#ffe07a'],{frame:'star'}),
 item('face','shades-cool','酷酷墨镜','😎','shades',['#2e2a30','#3d4a5c'],{frame:'round'}),
 item('face','monocle','绅士单片镜','🧐','monocle',['#d2ad5f']),
 item('face','goggles','滑雪护目镜','🥽','goggles',['#5aa6d6','#f2b880']),
 item('face','mustache','神气八字胡','🥸','mustache',['#4a3a33']),
 item('face','clown','小丑红鼻子','🔴','clown',['#e2443f']),
 item('face','blush-heart','爱心腮红贴','💗','stickers',['#f28aa5']),
 item('face','mask','蝴蝶舞会面具','🎭','mask',['#8e6bc4','#f2d27a']),
 // neck · 11
 item('neck','bow-berry','草莓领结','🎀','bow',['#d96b8a','#f1d07e']),
 item('neck','bowtie','小礼服领结','🤵','bow',['#2f2b33','#2f2b33'],{small:true}),
 item('neck','bell-red','红绳小铃铛','🔔','bell',['#d4524f','#f1c75a']),
 item('neck','bell-blue','蓝绳小铃铛','🛎️','bell',['#5a8fc4','#f1c75a']),
 item('neck','scarf-stripe','条纹围巾','🧣','scarf',['#e98a6a','#fff3e0']),
 item('neck','scarf-rainbow','彩虹围巾','🌈','scarf',RAINBOW),
 item('neck','pearls','珍珠项链','📿','pearls',['#fbf6ee']),
 item('neck','necktie','小领带','👔','tie',['#4f78b0','#f2d27a']),
 item('neck','lei','夏威夷花环','🌺','lei',['#f28aa5','#ffd36e','#ffffff','#b49ae6']),
 item('neck','medal','金牌奖章','🏅','medal',['#e2bd62','#d4524f']),
 item('neck','bib','小鱼口水巾','🐟','bib',['#bfe0f5','#f29b6b']),
 // top · 15
 item('top','stripe-tee','海魂条纹衫','👕','shirt',['#fffaf2','#4f78b0'],{pattern:'stripes'}),
 item('top','knit','奶油麻花毛衣','🧶','shirt',['#f2d9b8','#e2c39b'],{pattern:'knit',turtle:true}),
 item('top','sailor','蓝蓝水手服','⚓','shirt',['#7aa6c8','#ffffff'],{sailor:true}),
 item('top','raincoat','小黄雨衣','🌧️','shirt',['#f6cf52','#e0a92e'],{buttons:true,hood:true}),
 item('top','hoodie','小熊卫衣','🐻','shirt',['#c7a6dd','#f5ecfa'],{hood:true,bearHood:true}),
 item('top','spacesuit','太空服','🚀','shirt',['#f2f4f6','#e46a6a'],{panel:true}),
 item('top','chefcoat','小厨师服','🍳','shirt',['#fffdf7','#c9a25a'],{buttons:true,double:true}),
 item('top','armor','骑士铠甲','🛡️','shirt',['#c8ccd4','#d2ad5f'],{metal:true,emblem:'shield'}),
 item('top','suit','小西装','🕴️','shirt',['#3d3a4a','#ffffff'],{vneck:true}),
 item('top','hawaii','夏威夷衬衫','🏝️','shirt',['#5cc0c0','#f6b3c4','#fff3a8'],{pattern:'flowers'}),
 item('top','dino','小恐龙服','🦖','shirt',['#8cc56f','#f2e08a'],{spikes:true}),
 item('top','bee','小蜜蜂服','🐝','shirt',['#f6cf52','#3a3236'],{pattern:'bands',antennaWings:true}),
 item('top','hero','超级英雄服','🦸','shirt',['#4f78b0','#e2443f','#f6d27a'],{emblem:'star'}),
 item('top','kimono','樱花和服','👘','shirt',['#f2b8c6','#ffffff','#b0546e'],{pattern:'sakura',obi:true}),
 item('top','pajama','星月睡衣','🌙','shirt',['#9fb3e0','#fff3a8'],{pattern:'stars'}),
 // bottom · 11
 item('bottom','overalls','牛仔背带裤','👖','pants',['#5d7fb3','#f2d27a'],{straps:true}),
 item('bottom','jeans','小脚牛仔裤','👖','pants',['#4a6c9e'],{long:true}),
 item('bottom','shorts-stripe','条纹短裤','🩳','pants',['#f29b6b','#fff3e0'],{pattern:'stripes'}),
 item('bottom','pumpkin','南瓜灯笼裤','🎃','pants',['#f0973f','#7fae6a'],{puffy:true}),
 item('bottom','leggings','彩虹打底裤','🌈','pants',RAINBOW,{long:true,pattern:'rainbow'}),
 item('bottom','starpants','星空长裤','✨','pants',['#3c4372','#ffe07a'],{long:true,pattern:'stars'}),
 item('bottom','tutu','芭蕾纱裙','🩰','skirt',['#f6c1d3','#fbe3ec'],{layers:2}),
 item('bottom','grass','夏日草裙','🌿','skirt',['#8fbf7a','#c9b46a'],{pattern:'grass'}),
 item('bottom','plaid','格子小短裙','🏴','skirt',['#c95b5b','#2f4a6a'],{pattern:'plaid'}),
 item('bottom','polka','波点蓬蓬裙','🔵','skirt',['#7cb6d6','#ffffff'],{pattern:'dots'}),
 item('bottom','mermaid','美人鱼鳞片裙','🧜','skirt',['#6cc4c0','#b9a7e8'],{pattern:'scales'}),
 // back · 11
 item('back','wings-angel','天使翅膀','🪽','wings',['#ffffff','#f3ead8'],{wing:'angel'}),
 item('back','wings-butterfly','蝴蝶翅膀','🦋','wings',['#b9a7e8','#f6b3c4'],{wing:'butterfly'}),
 item('back','wings-bat','蝙蝠翅膀','🦇','wings',['#4a3f55','#7a6a88'],{wing:'bat'}),
 item('back','wings-dragon','小龙翅膀','🐉','wings',['#7cc28a','#f2e08a'],{wing:'dragon'}),
 item('back','wings-fairy','精灵翅膀','🧚','wings',['#bfe6ff','#f6d5ff'],{wing:'fairy'}),
 item('back','backpack','小书包','🎒','backpack',['#e46a6a','#f2d27a']),
 item('back','turtle','乌龟壳','🐢','turtle',['#7a9a55','#c9b46a']),
 item('back','snail','蜗牛壳','🐌','snail',['#d9a066','#f2d7a8']),
 item('back','jetpack','喷射背包','🚀','jetpack',['#c8ccd4','#e46a6a','#ffb347']),
 item('back','balloon','爱心气球','🎈','balloon',['#f28aa5']),
 item('back','cape','超人披风','🦸','cape',['#d4524f','#f2d27a']),
 // feet · 10
 item('feet','rainboots','小黄雨靴','🥾','boots',['#f6cf52']),
 item('feet','sneakers','小白运动鞋','👟','shoes',['#ffffff','#e46a6a']),
 item('feet','socks-stripe','条纹长袜','🧦','socks',['#ffffff','#e46a6a']),
 item('feet','slippers','兔兔毛绒拖鞋','🐇','slippers',['#fff1f4','#f6b6c4']),
 item('feet','ballet','芭蕾舞鞋','🩰','shoes',['#f6c1d3','#f6c1d3'],{ribbon:true}),
 item('feet','spaceboots','太空靴','🛰️','boots',['#f2f4f6','#9aa3ad']),
 item('feet','flippers','青蛙脚蹼','🐸','flippers',['#8cc56f']),
 item('feet','skates','旱冰鞋','🛼','skates',['#7cb6d6','#f2d27a']),
 item('feet','knightboots','骑士铁靴','⚔️','boots',['#c8ccd4'],{metal:true}),
 item('feet','socks-rainbow','彩虹袜','🌈','socks',RAINBOW,{rainbow:true}),
 // tail · 9
 item('tail','tailbow','尾巴蝴蝶结','🎀','tailbow',['#d96b8a']),
 item('tail','tailbell','尾巴铃铛','🔔','tailbell',['#f1c75a','#d4524f']),
 item('tail','tailstar','星星挂饰','⭐','charm',['#f6d27a'],{shape:'star'}),
 item('tail','tailheart','爱心挂饰','💖','charm',['#f28aa5'],{shape:'heart'}),
 item('tail','tailfish','小鱼挂件','🐠','charm',['#7cb6d6'],{shape:'fish'}),
 item('tail','tailflower','尾巴小花','🌼','tailflower',['#fff8e6','#f6cf52']),
 item('tail','tailrings','彩虹尾环','🌈','tailrings',RAINBOW),
 item('tail','lantern','萤火虫尾灯','💡','lantern',['#fff3a8']),
 item('tail','tailsock','尾巴毛线套','🧶','tailsock',['#e8936a','#fff3e0'])
];
export const WARDROBE_BY_ID=new Map(WARDROBE.map(w=>[w.id,w]));
export const SLOT_QUIPS={
 head:['头顶有点东西，气质立刻不一样。','帽子戴好，今天由本喵做主。','这个造型，能上猫猫杂志封面。'],
 face:['看清楚了，你今天也很好看。','戴上它，我就是全屋最酷的猫。','表情管理，交给这件小配饰。'],
 neck:['脖子上亮闪闪，走路都带风。','领口一换，像要去参加派对。','这个小配件，和我的胡子很配。'],
 top:['新衣服！先转个圈给你看看。','穿上就不想脱了，可以吗？','这件衣服让我想立刻出门炫耀。'],
 bottom:['下半身也要可爱，这是原则。','走两步，你看这个摆动！','穿好啦，尾巴也觉得很满意。'],
 back:['背上多了点梦想，感觉能飞。','看我的背影，帅不帅？','背着它，冒险随时出发。'],
 feet:['踩踩踩，新鞋子走路好神气。','四只爪爪都穿好了，一只都没落下。','这下踩在地板上都有节奏了。'],
 tail:['尾巴也要打扮，晃一晃给你看。','尾巴尖亮晶晶，追自己尾巴更好玩了。','尾巴说：谢谢你，我也很美。']
};
const LEGACY={none:{},bow:{neck:'bow-berry'},sailor:{top:'sailor',neck:'bow-berry'},cape:{back:'cape',head:'wizard'},crown:{head:'crown-gold'}};
export function normalizeOutfit(value){
 const source=typeof value==='string'?LEGACY[value]||{}:value&&typeof value==='object'?value:{};const outfit={};
 for(const slot of SLOTS){const id=source[slot.id];if(WARDROBE_BY_ID.get(id)?.slot===slot.id)outfit[slot.id]=id;}
 return outfit;
}
export function wearItem(outfit,id){const piece=WARDROBE_BY_ID.get(id);if(!piece)return normalizeOutfit(outfit);const next={...normalizeOutfit(outfit)};if(next[piece.slot]===id)delete next[piece.slot];else next[piece.slot]=id;return next;}
export function randomOutfit(rnd=Math.random){const outfit={};for(const slot of SLOTS){if(rnd()>.62)continue;const pool=WARDROBE.filter(w=>w.slot===slot.id);outfit[slot.id]=pool[Math.floor(rnd()*pool.length)].id;}if(!Object.keys(outfit).length)outfit.head=WARDROBE[0].id;return outfit;}
