import {ROOM_OBSTACLES,furnitureRadius,validPlacement,navPadding,bodyClearance} from './furniture-layout.js';
import {route,blocked,clearSegment} from './navigation.js';
import {poseLegs,syncEyelids,skinRegion} from './cat-model.js';
import {blinkAt} from './pet-eyes.js';
import {CatWorld,THREE,C,group,ball,box,cyl,tube,torus,star,flower,plant,sign,mesh,makeCat,disposeCat} from './world.js';
import {PERSONALITIES,FURNITURE_BY_ID,normalizeTreasureDisplay} from './state.js';
import {createTreasureDisplay} from './treasure-display.js';
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
const ownMat=o=>{const m=new THREE.MeshStandardMaterial(o);m.userData.own=true;return m;};
const ownGlass=o=>{const m=new THREE.MeshPhysicalMaterial(o);m.userData.own=true;return m;};
// One playful line per piece, said when the cat finishes using it.
const USE_LINES={box:'纸箱就是豪宅，租金是一个呼噜。',bed:'已进入省电模式：呼噜噜。',tower:'巡视完毕，这个家没有小鱼干入侵。',rug:'把自己卷成一颗毛茸茸饭团。',toy:'这条鱼怎么打都不倒？',cushion:'草莓味的坐垫，奶味的我。',scratcher:'磨完爪子，沙发今天平安。',plant:'叶子闻起来有点像沙拉。',lamp:'灯是暖的，本喵也是暖的。',table:'茶几视角：世界小了一点点。',rainbowrug:'在彩虹上打个滚，心情自动升级。',cactus:'说好只看不抱，我记着呢。',tent:'帐篷已打烊，今日不接待人类。',fishtank:'这几条鱼，我能看一整天。',piano:'一爪一个音符，收费小鱼干一条。',tunnel:'钻进去，再钻出来，很忙的。',hammock:'晃呀晃，晃掉了半个下午。',ballpit:'先在毛线球里游一会儿泳。',heartrug:'躺在爱心上，被软软地抱住了。',xmastree:'这些小球会动，必须研究一下。',fountain:'活水就是比碗里的香。',house:'小别墅入住成功，钥匙藏在肚皮下。',chair:'陷进去了，今天别想让我起来。'};
// Which placed pieces each personality activity will reach for.
const IDLE_BEHAVIORS={sleep:['sleep'],box:['box'],tower:['tower'],toy:['toy','paw'],sniff:['sniff','watch']};
const HOME_BOUNDS={x:3.5,minZ:-2.3,maxZ:2.35},FIELD_BOUNDS={x:3.25,minZ:-1.9,maxZ:2.3};
const PORTRAIT_DURATIONS={head:1.8,chin:1.8,nose:1.7,paw:1.8,blink:2};
export class LivingWorld extends CatWorld {
 constructor(canvas,onPet,onWardrobe,onEvent){
  super(canvas,onPet,onWardrobe);this.onEvent=onEvent;this.pos=new THREE.Vector3(0,.06,.55);this.destination=null;this.face=.35;this.gait=0;this.walkBlend=0;this.mode='free';this.inputMode=null;this.nextIdle=7;this.behavior='watch';this.poseUntil=0;this.idleCount=0;this.stats={breed:'calico',bond:0};this.props=group(this.scene);this.furnitureRoot=group(this.environments.home);this.furnitureMeshes=new Map();this.dragging=false;this.drive=new THREE.Vector2();this.driveSpots=new Set();this.driveStep=0;this.pointer=new THREE.Vector2();this.ray=new THREE.Raycaster();this.floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);this.buildToys();this.buildBathTools();this.buildStoryProps();this.buildTVShows();this.ready=true;this.installInput();
  this.portraitAction=null;this.portraitPoint=new THREE.Vector3();this.portraitHits=[];
 }
 emit(type,data={}){this.onEvent?.(type,data);}
 setScene(name){this.clearPortrait();this.clearPointerInput();super.setScene(name);if(!this.ready)return;this.pos.set(0,this.baseY,this.baseZ);this.destination=null;this.waypoints=[];this.jump=null;this.behavior='watch';this.poseUntil=0;this.cat.visible=true;this.nextIdle=this.elapsed+7;this.face=.35;this.drive.set(0,0);this.driveSpots.clear();this.clearSpawn();}
 setMode(mode){const portraitChanged=(this.mode==='portrait')!==(mode==='portrait');this.clearPortrait();this.clearPointerInput();this.mode=mode;this.drive.set(0,0);this.driveSpots.clear();this.inputMode=['wand','fetch','hide','scrub','rinse','decorate','explore'].includes(mode)?mode:null;this.controls.enabled=!this.inputMode&&!this.uiBlocked;this.canvas.style.cursor=this.inputMode?'crosshair':'grab';this.destination=null;this.waypoints=[];this.jump=null;this.afterArrive=null;this.poseUntil=0;this.cat.visible=true;this.behavior='watch';this.nextIdle=this.elapsed+7;this.toys.visible=['wand','fetch','hide'].includes(mode);this.furnitureRoot.visible=mode!=='hide';this.feather.visible=mode==='wand';this.fetchBall.visible=mode==='fetch';this.hideBoxes.visible=mode==='hide';this.sponge.visible=mode==='scrub';this.handShower.visible=mode==='rinse';this.ballPhase='ready';this.lastCatch=-10;this.lastWand=new THREE.Vector3(99,0,99);this.wandTarget=null;this.strokePrevious=null;this.bathRatio=0;this.foam?.children.forEach(m=>m.visible=mode==='rinse');if(this.drops)this.drops.visible=mode==='rinse';this.selectedFurniture=null;this.furnitureRoot.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.setHex(0);});if(mode==='hide')this.newHideRound();if(mode==='explore')this.pos.set(0,.06,1.9);if(mode==='portrait'){this.pos.set(0,this.baseY,this.baseZ);this.walkBlend=0;this.petUntil=0;}if(portraitChanged&&this.currentScene==='adopt')this.resetCamera();this.emit('input-mode',{mode});}
 setPaused(value){super.setPaused(value);if(value)this.clearPointerInput();}
 clearPointerInput(){if(this.dragging&&this.mode==='decorate')this.emit('placement-end');this.dragging=false;this.pointerStart=null;this.strokePrevious=null;}
 clearPortrait(){
  if(this.mode!=='portrait'&&!this.portraitAction)return;
  this.portraitAction=null;if(!this.cat)return;
  const {rig,head,tail,eyes,legs,profile}=this.cat.userData;
  rig.position.set(0,0,0);rig.rotation.set(0,0,0);head.position.set(0,profile.headY,profile.headZ);head.rotation.set(0,0,0);tail.rotation.set(0,0,0);
  for(const leg of legs)leg.rotation.z=0;
  poseLegs(this.cat,0,0,0);for(const eye of eyes)eye.scale.y=1;syncEyelids(this.cat);
 }
 interactPortrait(action){
  if(!Object.hasOwn(PORTRAIT_DURATIONS,action)||this.mode!=='portrait'||this.currentScene!=='adopt'||this.uiBlocked||!this.cat||this.portraitAction||this.action||this.destination||this.jump)return false;
  this.portraitAction={action,start:this.elapsed,duration:PORTRAIT_DURATIONS[action]};return true;
 }
 updatePortrait(t){
  const {rig,head,tail,eyes,legs,profile}=this.cat.userData,motion=this.reduced?0:1;
  this.cat.position.copy(this.pos);this.cat.rotation.y=.08;
  rig.position.set(0,Math.sin(t*2)*.008*motion,0);rig.rotation.set(0,0,0);
  head.position.set(0,profile.headY,profile.headZ);head.rotation.set(0,Math.sin(t*.65)*.025*motion,0);tail.rotation.set(0,0,Math.sin(t*1.6)*.08*motion);
  for(const leg of legs)leg.rotation.z=0;
  const active=this.portraitAction;let openness=blinkAt(t);
  if(active){
   const u=limit((t-active.start)/active.duration,0,1),ease=THREE.MathUtils.smoothstep(u,0,.25)*(1-THREE.MathUtils.smoothstep(u,.72,1));
   openness=1;
   if(active.action==='head'){
    head.rotation.z=.28*ease;head.rotation.y=.08*ease+Math.sin(u*Math.PI*4)*.04*ease*motion;head.rotation.x=-.06*ease;openness=1-.91*ease;
   }else if(active.action==='chin'){
    head.rotation.x=-.55*ease;head.position.y+=.055*ease;head.rotation.z=Math.sin(u*Math.PI*6)*.045*ease*motion;openness=1-.75*ease;
   }else if(active.action==='nose'){
    const sniff=THREE.MathUtils.smoothstep(u,0,.2)*(1-THREE.MathUtils.smoothstep(u,.35,.55)),recoil=THREE.MathUtils.smoothstep(u,.35,.53)*(1-THREE.MathUtils.smoothstep(u,.7,1));
    head.position.z+=(.075+.04*motion)*sniff-(.055+.035*motion)*recoil;head.rotation.x=-.07*sniff+.2*recoil;head.rotation.y=Math.sin(u*Math.PI*8)*.035*sniff*motion;openness=1-.65*recoil;
   }else if(active.action==='paw'){
    const leg=legs[0],{knee,ankle}=leg.userData;
    leg.rotation.x-=1.9*ease;leg.rotation.z=.22*ease;knee.rotation.x=knee.rotation.x*(1-ease)+.55*ease;ankle.rotation.x=-leg.rotation.x-knee.rotation.x+.32*ease;
    head.rotation.z=-.12*ease;openness=1-.15*ease;
   }else if(active.action==='blink'){
    const closed=THREE.MathUtils.smoothstep(u,.08,.4)*(1-THREE.MathUtils.smoothstep(u,.63,.94));
    openness=1-.94*closed;head.rotation.x=-(.06+.04*motion)*closed;
   }
   for(const eye of eyes)eye.scale.y=openness;
   if(u>=1){this.portraitAction=null;this.emit('portrait-complete',{action:active.action});}
  }else for(const eye of eyes)eye.scale.y=openness;
 }
 syncState(state){this.setTreasureDisplay(normalizeTreasureDisplay(state.displayedTreasures,state.collection));this.stats={breed:state.breed,bond:state.bond,fullness:state.fullness};this.setFurniture(state.furniture||[]);if(state.roomTheme)this.setRoomTheme(state.roomTheme);if(this.ready&&this.cat)this.clearSpawn();}
 setTreasureDisplay(ids){const key=ids.join('|');if(key===this.treasureDisplayKey)return;this.treasureDisplayKey=key;if(this.treasureDisplay){this.treasureDisplay.removeFromParent();disposeCat(this.treasureDisplay);}this.treasureDisplay=ids.length?createTreasureDisplay(this.environments.home,ids):null;this.requestRender();}
 buildToys(){this.toys=group(this.scene);this.toys.visible=false;this.feather=group(this.toys);tube(this.feather,0x997451,[[0,0,0],[.35,.65,-.12]],.025);tube(this.feather,0xc9af86,[[.35,.65,-.12],[.13,.9,-.1],[-.12,.8,.0]],.012);for(let i=0;i<3;i++){const f=ball(this.feather,[0xa9d8ee,0xd0a982,0x9fb18d][i],[-.14+i*.055,.78,0],[.07,.19,.03]);f.rotation.z=(i-1)*.3;}this.fetchBall=ball(this.toys,0x93c2e4,[0,.2,1.9],[.13,.13,.13]);this.ballStripe=torus(this.fetchBall,0xffe4a1,[0,0,0],1.01,.06,[.5,0,.5]);this.hideBoxes=group(this.toys);for(let i=0;i<3;i++){const b=group(this.hideBoxes,[(i-1)*1.9,.03,1]);this.makeBox(b,1);b.userData.boxIndex=i;b.traverse(o=>o.userData.boxIndex=i);} }
 makeBox(g,size=1){const w=1.18*size,d=1.36*size,h=.72*size;
 box(g,0xb18c63,[0,.055,0],[w,.075,d],.015);
 for(const side of [-1,1]){box(g,0xd6b18a,[side*w*.5,h*.5,0],[.035,h,d],.008);box(g,0xd6b18a,[0,h*.5,side*d*.5],[w,h,.035],.008);const flap=box(g,0xe0bc95,[side*(w*.5+.15),h+.025,0],[.34,.028,d],.008);flap.rotation.z=side*.35;}
 box(g,0xe7cea1,[0,.39,d*.5+.022],[.17,.30,.008],.001);sign(g,'♡',[0,.39,d*.5+.031],.15,.17,'#e7cea1','#8d7250');
 }
 buildBathTools(){this.sponge=group(this.scene);box(this.sponge,0xf7cf87,[0,0,0],[.39,.2,.23],.06);for(let i=0;i<6;i++)ball(this.sponge,0xffebc2,[(i%3-.8)*.11,.1,Math.floor(i/3)*.08],[.025,.014,.025]);this.sponge.visible=false;this.handShower=group(this.scene);tube(this.handShower,0x93b9ce,[[0,0,0],[.08,-.2,0],[.2,-.35,0]],.035);cyl(this.handShower,0xa6cfe4,[0,.03,0],.14,.17,.08);this.handShower.visible=false;this.sponge.position.set(1.2,1.4,.9);this.handShower.position.set(1.1,2,.9);}
 buildGarden(){const p=this.environment('garden');cyl(p,0xb8a37f,[0,-.2,0],4.45,4.5,.4);cyl(p,0xb8c69d,[0,.02,0],4.4,4.4,.06);cyl(p,0xb1d1e3,[0,.065,-1.4],1.05,1.05,.04).scale.z=.55;torus(p,0xcab99a,[0,.065,-1.4],1.13,.09).scale.z=.6;for(let i=0;i<24;i++){const a=i*2.4,r=2.65+(i%4)*.31;const x=Math.cos(a)*r,z=Math.sin(a)*r;tube(p,0x8aa58d,[[x,0,z],[x,.47,z]],.018);flower(p,x,.51,z,i%2?0xb8c59b:0xe5c29b).scale.setScalar(.65);}for(let i=0;i<7;i++)cyl(p,0xf4e4dc,[-1.4+i*.45,.08,1.5-Math.sin(i)*.25],.27,.27,.07);plant(p,-2.9,-2.1,0xabbf9a,1.8);plant(p,2.6,-2.4,0x91a478,1.7);box(p,0xc99f72,[1.9,.6,-2.6],[1.7,.15,.5]);for(const x of [1.2,2.6])box(p,0x997451,[x,.3,-2.6],[.15,.6,.3]);sign(p,'蓝铃花园',[-1.9,1.0,-2.7],1.15,.45,'#e5dec8','#727c60');}
 buildStreet(){const p=this.environment('street');box(p,0xb5a082,[0,-.2,0],[8.9,.4,6.6],.2);box(p,0xd8cbb0,[0,.03,0],[8.7,.06,6.4]);for(let i=0;i<10;i++)box(p,0xede0c2,[-4+i*.9,.075,.35],[.04,.01,5.7],.005);for(const [x,color,label]of [[-2.8,0xb9c5a0,'花花铺'],[0,0xb5c4bf,'喵邮局'],[2.8,0xd9b494,'小鱼店']]){box(p,color,[x,1.4,-2.6],[2.3,2.8,.7],.12);box(p,0xfff1eb,[x,1.42,-2.2],[1.75,1.5,.08]);box(p,0xb6cddd,[x,1.4,-2.13],[1.55,1.28,.03]);box(p,0x99aa88,[x,2.35,-1.94],[2.4,.15,.9]);sign(p,label,[x,2.65,-2.18],1.4,.36,'#f1e5cd','#76654d');}plant(p,-3.4,1.7,0xa6bbaa,1.2);plant(p,3.4,1.5,0x9bae80,1.1);box(p,0x98bbd5,[-2.8,.68,-.6],[.55,1.25,.5]);box(p,0x657d9d,[-2.8,.93,-.335],[.34,.06,.025],.008);}


 buildTVShows(){this.tvButterfly=group(this.tv.g,[0,0,.21]);for(const side of [-1,1]){ball(this.tvButterfly,0xc1a0d8,[side*.14,0,0],[.18,.23,.025]);ball(this.tvButterfly,0xe9b6ce,[side*.12,-.14,0],[.13,.14,.025]);}ball(this.tvButterfly,0x786681,[0,0,.02],[.022,.18,.026]);this.tvBird=group(this.tv.g,[0,0,.21]);ball(this.tvBird,0x9dc6e3,[0,0,0],[.22,.17,.035]);ball(this.tvBird,0xc0dfef,[.15,.13,0],[.13,.13,.035]);const beak=mesh(this.tvBird,new THREE.ConeGeometry(.06,.14,3),0xedc180,[.28,.11,0]);beak.rotation.z=-Math.PI/2;ball(this.tvBird,0x544762,[.18,.17,.035],[.015,.018,.012]);ball(this.tvBird,0x749fbf,[-.04,.03,.036],[.12,.09,.015]);this.tvLabels=[this.tv.ticker,sign(this.tv.g,'蝶蝶频道',[.48,-.36,.16],.6,.19,'#90cde3','#5c90b0'),sign(this.tv.g,'鸟鸟频道',[.48,-.36,.16],.6,.19,'#90cde3','#5c90b0')];this.setTVChannel(0);}
 setTVChannel(channel){this.tvChannel=channel;this.tv.fish.visible=channel===0;this.tvButterfly.visible=channel===1;this.tvBird.visible=channel===2;this.tvLabels.forEach((m,i)=>m.visible=i===channel);}
 buildStoryProps(){this.carriedToy=group(this.scene);ball(this.carriedToy,0xa6c9e1,[0,0,0],[.15,.12,.12]);star(this.carriedToy,0xf6d58e,[0,0,.09],.10);this.carriedToy.visible=false;this.leafHat=group(this.scene);for(let i=0;i<3;i++){const leaf=ball(this.leafHat,[0xb5c998,0xc5b785,0x9fb99a][i],[(i-1)*.12,.02,0],[.18,.035,.1]);leaf.rotation.z=(i-1)*.23;}this.leafHat.visible=false;this.ducks=group(this.scene);for(let i=0;i<3;i++){const d=group(this.ducks,[i*.38,0,.2]);ball(d,0xf1d28c,[0,.12,0],[.14,.11,.18]);ball(d,0xf4d98e,[0,.25,.06],[.10,.10,.10]);ball(d,0xde9c75,[0,.24,.15],[.07,.024,.065]);}this.ducks.visible=false;}
 makeFurniture(id){const g=new THREE.Group();const anim={};
 if(id==='box')this.makeBox(g);
 if(id==='bed'){const base=cyl(g,0xa4ae90,[0,.15,0],.65,.7,.27);base.scale.z=.75;const pad=cyl(g,0xeee0be,[0,.29,0],.55,.55,.12);pad.scale.z=.75;const rim=torus(g,0xa4ae90,[0,.36,0],.56,.095);rim.scale.z=.74;}
 if(id==='tower'){cyl(g,0xc99f72,[0,.08,0],.58,.65,.16);cyl(g,0xe7c6a6,[0,.64,0],.10,.12,1.12);cyl(g,0xc99f72,[0,1.25,0],.69,.7,.12);box(g,0xcbb998,[-.37,.67,.15],[.57,.12,.47]);for(let i=0;i<22;i++)torus(g,0xb9a789,[0,.18+i*.047,0],.103,.012);tube(g,0xb7a27c,[[.4,1.2,0],[.4,.89,0]],.014);ball(g,0x9ec9e6,[.4,.81,0],[.09,.09,.09]);}
 if(id==='rug'){const r=cyl(g,0xa6b99f,[0,.06,0],.8,.8,.05);r.scale.z=.66;torus(g,0xe3dfbd,[0,.095,0],.64,.035).scale.z=.66;}
 if(id==='toy'){ball(g,0xa6c9e1,[0,.2,0],[.22,.23,.2]);tube(g,0x997451,[[0,.2,0],[0,.8,0]],.025);const fish=ball(g,0xefc095,[0,.89,0],[.25,.12,.08]);ball(g,0x5d496b,[.12,.91,.071],[.015,.015,.015]);star(g,0xe8a9c3,[-.28,.89,0],.12);}
 if(id==='cushion'){const pad=cyl(g,0xe0798a,[0,.09,0],.44,.40,.17);pad.scale.z=.92;cyl(g,0xeb95a2,[0,.165,0],.40,.42,.03).scale.z=.92;for(let i=0;i<9;i++){const a=i*2.4,r=.3*Math.sqrt((i+.4)/9);ball(g,0xfff0cc,[Math.cos(a)*r,.175,Math.sin(a)*r*.92],[.027,.012,.034]);}for(const sd of [-1,1]){const leaf=ball(g,0x8cae72,[sd*.2,.185,-.3],[.17,.03,.1]);leaf.rotation.y=sd*.5;}}
 if(id==='scratcher'){const board=box(g,0xcfa877,[0,.12,0],[.76,.1,.6],.03);board.rotation.x=-.22;for(let i=0;i<14;i++){const l=box(g,0xb99060,[-.33+i*.051,.185-i*.0085,0],[.016,.012,.56],.004);l.rotation.x=-.22;}box(g,0x9b8068,[0,.055,.26],[.8,.11,.14],.03);star(g,0xe8c37a,[.3,.26,-.1],.07);}
 if(id==='plant'){cyl(g,0xd9a98f,[0,.2,0],.3,.22,.4);cyl(g,0xc2906f,[0,.4,0],.31,.31,.05);for(let i=0;i<8;i++){const a=i*2.4,h=.5+i*.075;tube(g,0x7d9a6c,[[0,.4,0],[Math.cos(a)*.1,h-.08,Math.sin(a)*.1]],.015);const leaf=ball(g,i%2?0x7fa469:0x93b377,[Math.cos(a)*.21,h,Math.sin(a)*.21],[.2,.035,.14]);leaf.rotation.set(Math.sin(a)*.3,-a,Math.cos(a)*.35);}}
 if(id==='lamp'){cyl(g,0x9c7a55,[0,.05,0],.24,.27,.1);cyl(g,0xb8946c,[0,.85,0],.022,.022,1.5);const shade=cyl(g,0xffeec2,[0,1.62,0],.22,.34,.4);shade.material=ownMat({color:0xffeec2,emissive:0xffd98a,emissiveIntensity:.85,roughness:.6});torus(g,0xe0c99a,[0,1.43,0],.335,.022);const topStar=star(g,0xffdf9a,[0,1.78,0],.12);topStar.material=ownMat({color:0xffe6ac,emissive:0xffcc6e,emissiveIntensity:.9,roughness:.5});anim.glow=[shade,topStar];}
 if(id==='table'){box(g,0xd0a87c,[0,.54,0],[1.02,.09,.76],.03);box(g,0xbb9068,[0,.26,0],[.86,.06,.6],.02);for(const x of [-.42,.42])for(const z of [-.29,.29])cyl(g,0x9c7a55,[x,.27,z],.038,.05,.54);}
 if(id==='rainbowrug'){const colors=[0xeb9aa2,0xf0c28a,0xf2e3a0,0x9ec995,0x8fc0de,0xb6a6dd];for(let i=0;i<6;i++){const r=torus(g,colors[i],[0,.02+i*.003,.42],.3+i*.1,.048,[Math.PI/2,0,0]);r.scale.y=.6;}box(g,0xf3ead7,[0,.02,.46],[1.45,.02,.1],.01);}
 if(id==='cactus'){cyl(g,0xd49b7f,[0,.17,0],.25,.19,.34);cyl(g,0xbd8564,[0,.34,0],.26,.26,.04);ball(g,0x79a26b,[0,.62,0],[.19,.3,.19]);for(const sd of [-1,1]){ball(g,0x85ad75,[sd*.21,.66,0],[.1,.15,.1]);ball(g,0x85ad75,[sd*.26,.78,0],[.08,.1,.08]);}for(let i=0;i<10;i++){const a=i*2.4;tube(g,0xe4e0c0,[[Math.cos(a)*.17,.5+i*.035,Math.sin(a)*.17],[Math.cos(a)*.22,.52+i*.035,Math.sin(a)*.22]],.006);}ball(g,0xf0a9bd,[0,.9,0],[.09,.07,.09]);}
 if(id==='tent'){for(const sd of [-1,1]){const side=box(g,sd<0?0xe8b9a8:0xf0cbb6,[sd*.3,.44,0],[.08,.9,1.18],.03);side.rotation.z=sd*.42;}box(g,0xd99f8c,[0,.9,0],[.14,.1,1.24],.04);box(g,0xf4ddc8,[0,.42,.58],[.52,.82,.05],.03);for(const sd of [-1,1]){const flap=box(g,0xe8b9a8,[sd*.3,.42,.61],[.2,.8,.04],.02);flap.rotation.z=sd*.1;}ball(g,0xf2c57c,[0,.95,0],[.09,.09,.09]);star(g,0xf6d58e,[0,.58,.62],.09);}
 if(id==='fishtank'){box(g,0xb08763,[0,.2,0],[.92,.4,.56],.04);for(const x of [-.38,.38])cyl(g,0x96754f,[x,.1,0],.04,.05,.2);const glass=box(g,0xcfeaf2,[0,.68,0],[.84,.56,.48],.03);glass.material=ownGlass({color:0xdff2f7,roughness:.08,transparent:true,opacity:.3,depthWrite:false});const water=box(g,0x9ed6e6,[0,.63,0],[.78,.42,.42],.02);water.material=ownGlass({color:0x9ed6e6,roughness:.2,transparent:true,opacity:.45,depthWrite:false});box(g,0xd6c39c,[0,.44,0],[.8,.05,.44],.01);anim.fish=[];const fishColors=[0xf0a26e,0xf4cf7a,0xe49ab5];for(let i=0;i<3;i++){const f=group(g,[(i-1)*.2,.62+i*.08,0]);f.userData.seed=i;ball(f,fishColors[i],[0,0,0],[.09,.055,.035]);const tail=mesh(f,new THREE.ConeGeometry(.045,.07,3),fishColors[i],[-.11,0,0]);tail.rotation.z=Math.PI/2;anim.fish.push(f);}for(let i=0;i<4;i++)ball(g,0x88b08a,[-.3+i*.19,.49,-.12],[.035,.1,.035]);}
 if(id==='piano'){box(g,0xe08f93,[0,.34,0],[1.1,.3,.46],.05);box(g,0xf2d8c0,[0,.5,.08],[1.0,.04,.3],.01);for(let i=0;i<12;i++)box(g,i%5===1||i%5===3?0x4b4150:0xfdf6e7,[-.44+i*.08,.525,.08],[.065,.03,.26],.006);box(g,0xd0787e,[0,.56,-.16],[1.1,.16,.12],.04);for(const x of [-.46,.46])cyl(g,0xb3686e,[x,.1,0],.045,.055,.2);star(g,0xf6d58e,[0,.63,-.13],.08);}
 if(id==='tunnel'){const colors=[0xeb9aa2,0xf2c18b,0x9ec995,0x8fc0de,0xb6a6dd];for(let i=0;i<5;i++){const a=torus(g,colors[i],[0,.06,-.42+i*.21],.46,.055,[0,0,0]);a.scale.y=.95;}for(const sd of [-1,1])box(g,0xf0e5d2,[sd*.47,.05,0],[.12,.06,1.1],.02);}
 if(id==='hammock'){for(const sd of [-1,1]){cyl(g,0xa8805a,[sd*.5,.36,0],.04,.055,.72);cyl(g,0x8f6b48,[sd*.5,.03,0],.14,.16,.06);}const cloth=ball(g,0xd9e2ea,[0,.54,0],[.5,.09,.42]);cloth.scale.y=.1;for(let i=0;i<5;i++)tube(g,0xc4cdd8,[[-.42+i*.21,.58,-.34],[-.42+i*.21,.58,.34]],.012);for(const sd of [-1,1]){tube(g,0xb6a98f,[[sd*.48,.68,0],[sd*.4,.57,-.3]],.01);tube(g,0xb6a98f,[[sd*.48,.68,0],[sd*.4,.57,.3]],.01);}box(g,0xf0c8d2,[.24,.6,0],[.26,.07,.3],.03);}
 if(id==='ballpit'){cyl(g,0xcfd9e4,[0,.14,0],.58,.54,.28);cyl(g,0xeaf0f5,[0,.22,0],.52,.52,.08);torus(g,0xb9c6d4,[0,.28,0],.55,.04);const colors=[0xeb9aa2,0xf4cf7a,0x9ec995,0x8fc0de,0xb6a6dd,0xf0b48c];for(let i=0;i<14;i++){const a=i*2.4,r=.4*Math.sqrt((i+.3)/14);const b=ball(g,colors[i%6],[Math.cos(a)*r,.27+(i%3)*.015,Math.sin(a)*r],[.1,.1,.1]);for(let j=0;j<2;j++)torus(b,0xfff6e4,[0,0,0],1.01,.045,[j*1.1,.4,j]);}}
 if(id==='heartrug'){const s=new THREE.Shape();s.moveTo(0,-.5);s.bezierCurveTo(.55,.05,.42,.62,0,.3);s.bezierCurveTo(-.42,.62,-.55,.05,0,-.5);const m=mesh(g,new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false}),0xeea9b6,[0,.025,.1]);m.rotation.x=-Math.PI/2;const inner=mesh(g,new THREE.ExtrudeGeometry(s,{depth:.02,bevelEnabled:false}),0xf7cdd5,[0,.05,.1],[.76,.76,1]);inner.rotation.x=-Math.PI/2;}
 if(id==='xmastree'){cyl(g,0x9c7a55,[0,.09,0],.17,.2,.18);for(let i=0;i<3;i++)mesh(g,new THREE.ConeGeometry(.38-i*.1,.56,20),i%2?0x6f9163:0x7da271,[0,.42+i*.38,0]);const colors=[0xeb8f9a,0xf4cf7a,0x8fc0de,0xb6a6dd,0xf0b48c];for(let i=0;i<10;i++){const a=i*2.4,y=.28+i*.1,r=.33-i*.022;ball(g,colors[i%5],[Math.cos(a)*r,y,Math.sin(a)*r],[.055,.055,.055]);}star(g,0xf6d58e,[0,1.42,0],.13);}
 if(id==='fountain'){cyl(g,0xcfd4d9,[0,.07,0],.33,.3,.14);cyl(g,0xa8d6e4,[0,.15,0],.28,.28,.03);cyl(g,0xdde2e7,[0,.26,0],.1,.12,.24);cyl(g,0xcfd4d9,[0,.4,0],.2,.14,.06);cyl(g,0xa8d6e4,[0,.44,0],.17,.17,.02);torus(g,0xe6ecf0,[0,.15,0],.3,.03);anim.puff=group(g);for(let i=0;i<6;i++){const a=i*1.05;tube(anim.puff,0xb3dced,[[Math.cos(a)*.03,.46,Math.sin(a)*.03],[Math.cos(a)*.14,.33,Math.sin(a)*.14],[Math.cos(a)*.2,.19,Math.sin(a)*.2]],.012);}}
 if(id==='house'){box(g,0xdcc29c,[0,.38,0],[1.08,.72,.92],.04);for(const sd of [-1,1]){const roof=box(g,0xc47d6e,[sd*.26,.9,0],[.1,.66,1.0],.03);roof.rotation.z=sd*.62;}box(g,0xa8655a,[0,1.06,0],[.16,.1,1.04],.04);const door=mesh(g,new THREE.CylinderGeometry(.21,.21,.06,20,1,false,0,Math.PI),0x8d6b52,[0,.3,.465]);door.rotation.set(Math.PI/2,0,Math.PI);box(g,0x8d6b52,[0,.16,.465],[.42,.3,.06],.01);const win=cyl(g,0xb7d7e4,[.33,.52,.465],.11,.11,.05);win.rotation.x=Math.PI/2;torus(g,0xc9a378,[.33,.52,.465],.12,.022,[0,0,0]);star(g,0xf6d58e,[0,.68,.47],.08);}
 if(id==='chair'){ball(g,0xb49cc4,[0,.3,.05],[.52,.28,.46]);ball(g,0xc2acd0,[0,.46,-.3],[.5,.33,.2]);for(const sd of [-1,1])ball(g,0xa992bb,[sd*.44,.36,.03],[.12,.17,.4]);cyl(g,0xd8c8e2,[0,.42,.08],.38,.38,.06).scale.z=.92;for(let i=0;i<6;i++)tube(g,0xa78fc0,[[-.3+i*.12,.45,.44],[-.32+i*.12,.3,.46]],.008);}
 g.userData.anim=anim;g.userData.furnitureType=id;g.traverse(o=>{o.userData.furnitureType=id;});return g;}
 setFurniture(items){const key=JSON.stringify(items);if(key===this.furnitureKey)return;this.furnitureKey=key;
 const keep=new Map();
 for(const item of items){const g=this.furnitureMeshes.get(item.uid);if(g&&g.userData.furnitureType===item.id){keep.set(item.uid,g);this.furnitureMeshes.delete(item.uid);}}
 for(const g of this.furnitureMeshes.values()){this.furnitureRoot.remove(g);disposeCat(g);}
 this.furnitureMeshes.clear();
 for(const item of items){const g=keep.get(item.uid)||this.makeFurniture(item.id);if(!keep.has(item.uid))this.furnitureRoot.add(g);g.userData.furniture=item.uid;g.traverse(o=>{o.userData.furniture=item.uid;});g.position.set(item.x,.04,item.z);g.rotation.y=item.rotation||0;this.furnitureMeshes.set(item.uid,g);}
 if(this.selectedFurniture&&!this.furnitureMeshes.has(this.selectedFurniture))this.selectedFurniture=null;}
 furnitureItems(){return [...this.furnitureMeshes].map(([uid,m])=>({uid,id:m.userData.furnitureType,x:m.position.x,z:m.position.z}));}
 selectFurniture(uid){this.selectedFurniture=uid;}
 placeSelected(x,z,rotation){const g=this.furnitureMeshes.get(this.selectedFurniture);if(!g)return;const id=g.userData.furnitureType,r=furnitureRadius(id);
 const nx=limit(x,-3.5+r,3.5-r),nz=limit(z,-2.55+r,2.3-r);
 if(!validPlacement({uid:this.selectedFurniture,id,x:nx,z:nz},this.furnitureItems(),this.pos,this.stats.breed)){this.emit('placement-blocked');return;}
 g.position.x=nx;g.position.z=nz;if(rotation!==undefined)g.rotation.y=rotation;this.emit('place',{uid:this.selectedFurniture,id,x:g.position.x,z:g.position.z,rotation:g.rotation.y});}
 // A valid open spot for a brand-new piece: nearest the front-middle of the room, clear of the cat.
 freeSpot(id){const items=this.furnitureItems();let best=null,bestScore=Infinity;
 for(let z=-2.1;z<=2.3;z+=.2)for(let x=-3.3;x<=3.3;x+=.2){
  if(!validPlacement({uid:`new-${id}`,id,x,z},items,this.pos,this.stats.breed))continue;
  const front=z<.6?(.6-z)*1.4:z>2?(z-2)*1.4:0;
  const score=Math.abs(x)*.5+front+Math.max(0,1.8-Math.hypot(x-this.pos.x,z-this.pos.z))*1.6;
  if(score<bestScore){bestScore=score;best={x:Math.round(x*100)/100,z:Math.round(z*100)/100};}
 }
 return best;}
 setupExploration(outing){this.clearExploration();this.outing=outing;this.trail=group(this.scene);for(const spot of outing.spots){const g=group(this.trail,[spot.x,.05,spot.z]);cyl(g,0xa9b88f,[0,.04,0],.26,.3,.08);star(g,0xf6d986,[0,.36,0],.14);g.userData.spot=spot.id;g.traverse(o=>o.userData.spot=spot.id);}
 const b={park:'orange',garden:'blue',street:'ragdoll'}[outing.region];this.friend=makeCat(b,'bow');this.friend.scale.setScalar(.57);this.friend.position.set(2.5,.07,-.8);this.friend.rotation.y=-.5;this.friend.userData.spot='friend';this.friend.traverse(o=>o.userData.spot='friend');this.trail.add(this.friend);this.eventProp=group(this.trail,[-2.35,.1,-.85]);for(let i=0;i<5;i++){const l=ball(this.eventProp,0xd7b084,[(i%3)*.14,0,(i%2)*.2],[.18,.09,.13]);l.rotation.z=i*.5;}this.eventProp.traverse(o=>o.userData.spot='event');}
 hideSpot(id){const g=this.trail?.children.find(x=>x.userData.spot===id);if(g)g.visible=false;}
 clearExploration(){if(this.trail){this.scene.remove(this.trail);disposeCat(this.trail);}this.trail=null;this.friend=null;this.eventProp=null;this.outing=null;}
 obstacles(){
 const room=['home','tv'].includes(this.currentScene);const items=[];
 if(room){items.push(...ROOM_OBSTACLES);
  for(const [uid,g]of this.furnitureMeshes){const id=g.userData.furnitureType,r=furnitureRadius(id);if(r)items.push({id:uid,type:'circle',x:g.position.x,z:g.position.z,r,height:FURNITURE_BY_ID.get(id)?.h??.42});}
 }
 if(this.mode==='explore'){
  items.push({id:'friend',type:'circle',x:2.5,z:-.8,r:.70,height:1.2});
  if(this.currentScene==='garden')items.push({id:'pond',x:0,z:-1.4,w:2.1,d:1.1,height:.12},{id:'bench',x:1.9,z:-2.6,w:1.9,d:.7,height:.8},{id:'plant',type:'circle',x:-2.9,z:-2.1,r:.5,height:1.7});
  if(this.currentScene==='park')items.push(...[[-2.9,-1.8],[2.8,-2.1],[-3.4,.7]].map(([x,z])=>({id:'tree',type:'circle',x,z,r:.25,height:3})));
  if(this.currentScene==='street')items.push({id:'postbox',x:-2.8,z:-.6,w:.6,d:.55,height:1.4});
 }
 return items;
 }
 navPadding(){return navPadding(this.stats.breed);}
 // Saves made with an older layout, or a breed swap to a bigger cat, can leave the cat inside a piece's body clearance.
 // Walking refuses to move an overlapping cat, so step it out to the nearest free floor first.
 clearSpawn(){if(!['home','tv'].includes(this.currentScene)||this.pos.y>.15)return;const obstacles=this.obstacles(),pad=bodyClearance(this.stats.breed);if(!blocked(this.pos.x,this.pos.z,obstacles,pad))return;
  let best=null;for(let ring=1;ring<=40&&!best;ring++)for(let i=0;i<ring*8;i++){const a=i/(ring*8)*Math.PI*2,x=this.pos.x+Math.cos(a)*ring*.1,z=this.pos.z+Math.sin(a)*ring*.1;
   if(Math.abs(x)>HOME_BOUNDS.x||z<HOME_BOUNDS.minZ||z>HOME_BOUNDS.maxZ||blocked(x,z,obstacles,pad))continue;const d=Math.hypot(x-this.pos.x,z-this.pos.z)-(z>this.pos.z?.001:0);if(!best||d<best.d)best={x,z,d};}
  if(best){this.pos.x=best.x;this.pos.z=best.z;this.destination=null;this.waypoints=[];}}
 walkRoute(x,z,after,y=.06){
 const points=route(this.pos,{x,z},this.obstacles(),undefined,this.navPadding());
 this.waypoints=points.map(p=>new THREE.Vector3(p.x,.06,p.z));this.destination=this.waypoints.shift()||null;this.behavior='walk';
 this.afterArrive=()=>{if(y>.12)this.beginJump(new THREE.Vector3(x,y,z),after);else after?.();};
 if(!this.destination){const cb=this.afterArrive;this.afterArrive=null;cb?.();}
 }
 beginJump(target,after){this.destination=null;this.jump={from:this.pos.clone(),target,start:this.elapsed,after};this.behavior='jump';}
 moveTo(x,z,after,y=.06){
 this.poseUntil=0;
 if(this.jump){this.jump.after=()=>this.walkRoute(x,z,after,y);return;}if(this.pos.y>.15){const exit=route({x:this.pos.x,z:this.pos.z},{x:this.pos.x,z:this.pos.z+1.05},this.obstacles(),undefined,this.navPadding()).at(-1);if(exit){this.beginJump(new THREE.Vector3(exit.x,.06,exit.z),()=>this.walkRoute(x,z,after,y));return;}}
 this.walkRoute(x,z,after,y);
 }
 callCat(){this.moveTo(0,1.8,()=>{this.pose('nuzzle',3);this.emit('arrived-call');});}
 // Walks (or jumps) to a placed piece and plays its catalogue behavior.
 useFurniture(uid){const g=this.furnitureMeshes.get(uid)??this.furnitureMeshes.get(this.pickFurniture(uid));if(!g)return;const id=g.userData.furnitureType,f=FURNITURE_BY_ID.get(id)||{behavior:'watch',perch:.06,approach:.7};
 const stop=f.perch>0.12?{x:g.position.x,z:g.position.z}:this.approachPoint(g,f);
 this.moveTo(stop.x,stop.z,()=>{this.face=Math.atan2(g.position.x-this.pos.x,g.position.z-this.pos.z);this.behavior=f.behavior;this.poseUntil=this.elapsed+6;this.emit('behavior',{id,text:USE_LINES[id]});},f.perch>0.12?f.perch:.06);}
 // The catalogue approach sits inside the piece's own nav ring, so step outward until the floor is free.
 approachPoint(g,f){const pad=this.navPadding(),obstacles=this.obstacles(),bounds=HOME_BOUNDS;
 const base=Math.max(f.approach||0,f.r+pad*.9);
 for(const turn of [0,.5,-.5,1,-1,1.6,-1.6,2.3,-2.3,Math.PI]){const a=g.rotation.y+turn;
  for(let d=base;d<=base+1.3;d+=.16){const x=g.position.x+Math.sin(a)*d,z=g.position.z+Math.cos(a)*d;
   if(Math.abs(x)>bounds.x||z<bounds.minZ||z>bounds.maxZ)continue;
   if(!blocked(x,z,obstacles,pad*.95))return {x,z};}}
 return {x:g.position.x,z:g.position.z+base};}
 // Accepts a legacy type id too, so old UI strings keep working.
 pickFurniture(key){if(this.furnitureMeshes.has(key))return key;for(const [u,g]of this.furnitureMeshes)if(g.userData.furnitureType===key)return u;return null;}
 meow(){this.pose('meow',.9);this.emit('meow');}
 setDrive(x=0,z=0){this.drive.set(x||0,z||0);}
 pose(name,seconds=3){this.behavior=name;this.poseStart=this.elapsed;this.poseUntil=this.elapsed+seconds;this.destination=null;this.waypoints=[];this.afterArrive=null;}
 // Continuous player walking: camera-relative, with a slide along the wall when a step is blocked.
 updateDrive(dt,t){this.driveStep=0;const ix=Number(this.drive.x)||0,iz=Number(this.drive.y)||0,mag=Math.hypot(ix,iz);
 if(!(mag>.05)||!['free','explore'].includes(this.mode)||this.action)return;
 this.nextIdle=t+8;
 if(!Number.isFinite(this.pos.x)||!Number.isFinite(this.pos.z)){this.pos.set(0,.06,.55);this.destination=null;this.waypoints=[];}
 if(this.jump)return;
 if(this.pos.y>.15)this.beginJump(new THREE.Vector3(limit(this.pos.x+this.drive.x*.7,-3.3,3.3),.06,limit(this.pos.z+this.drive.y*.7,-2.2,2.3)),null);
 this.destination=null;this.waypoints=[];this.afterArrive=null;this.poseUntil=0;this.behavior='walk';
 const fx=-this.camera.position.x+this.controls.target.x,fz=-this.camera.position.z+this.controls.target.z;
 const fl=Math.hypot(fx,fz)||1,forwardX=fx/fl,forwardZ=fz/fl;
 const dx=(forwardX*iz-forwardZ*ix)/mag,dz=(forwardZ*iz+forwardX*ix)/mag;
 const speed=this.mode==='explore'?2.2:1.6,step=Math.min(dt,1/30)*speed*.72;
 const obstacles=this.obstacles(),pad=this.navPadding()*.85;
 const bounds=this.mode==='explore'?FIELD_BOUNDS:HOME_BOUNDS;
 const clampX=x=>limit(x,-bounds.x,bounds.x),clampZ=z=>limit(z,bounds.minZ,bounds.maxZ);
 let nx=this.pos.x,nz=this.pos.z;
 if(!blocked(clampX(this.pos.x+dx*step),clampZ(this.pos.z+dz*step),obstacles,pad)){nx=clampX(this.pos.x+dx*step);nz=clampZ(this.pos.z+dz*step);}
 else if(!blocked(clampX(this.pos.x+dx*step),this.pos.z,obstacles,pad))nx=clampX(this.pos.x+dx*step);
 else if(!blocked(this.pos.x,clampZ(this.pos.z+dz*step),obstacles,pad))nz=clampZ(this.pos.z+dz*step);
 this.driveStep=Math.hypot(nx-this.pos.x,nz-this.pos.z);
 this.pos.x=nx;this.pos.z=nz;if(this.pos.y>.15)this.pos.y+=(.06-this.pos.y)*Math.min(1,dt*6);
 const target=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(target-this.face),Math.cos(target-this.face));
 this.face+=turn*Math.min(1,dt*8);
 if(this.mode==='explore'&&this.outing){for(const sp of this.outing.spots){if(this.outing.found.includes(sp.id)||this.driveSpots.has(sp.id))continue;if(Math.hypot(this.pos.x-sp.x,this.pos.z-sp.z)<.55){this.driveSpots.add(sp.id);this.emit('visit-spot',{id:sp.id});}}}
 }
 pointFromEvent(e,y=0,bounds={x:3.25,minZ:-1.9,maxZ:2.3}){const r=this.canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const p=new THREE.Vector3();this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),p);p.x=limit(p.x,-3.25,3.25);p.z=limit(p.z,bounds.minZ,bounds.maxZ);return p;}
 objectAt(e,objects){this.pointFromEvent(e);const hits=this.ray.intersectObjects(objects,true);return hits.find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;})?.object;}
 portraitActionAt(e){
  if(this.mode!=='portrait'||this.currentScene!=='adopt'||this.uiBlocked||!this.cat)return null;
  const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return null;
  this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.camera.updateMatrixWorld();this.cat.updateMatrixWorld(true);this.ray.setFromCamera(this.pointer,this.camera);
  const hits=this.portraitHits;hits.length=0;this.ray.intersectObject(this.cat,true,hits);
  const {head,legs,profile,anchors}=this.cat.userData;
  const headAction=point=>{
   const p=head.worldToLocal(this.portraitPoint.copy(point));
   if(Math.abs(p.x)<profile.head[0]*.21&&Math.abs(p.y-anchors.noseY)<.07&&p.z>anchors.noseZ-.09)return 'nose';
   if(p.y<anchors.noseY-.075&&Math.abs(p.x)<profile.head[0]*.65&&p.z>.05)return 'chin';
   return 'head';
  };
  for(const hit of hits){
   let visible=true;for(let o=hit.object;o;o=o.parent)if(!o.visible){visible=false;break;}
   if(!visible)continue;
   if(hit.object===this.cat.userData.skin){
    const region=skinRegion(hit);if(region==='paw')return 'paw';if(region==='head')return headAction(hit.point);return null;
   }
   for(let o=hit.object;o&&o!==this.cat;o=o.parent){
    if(legs.includes(o))return 'paw';
    if(o===head){
     // Breed-local face coordinates survive camera orbit, head tilt and differently sized skulls.
     return headAction(hit.point);
    }
   }
   return null; // A torso hit must not reach through the cat to a hidden face or paw.
  }
  return null;
 }
 installInput(){
  this.canvas.addEventListener('pointerdown',e=>{
   if(this.uiBlocked||e.isPrimary===false){this.clearPointerInput();return;}if(e.button!==0)return;
   this.dragging=true;this.pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId,mode:this.mode,moved:false};this.strokePrevious=null;
   if(this.inputMode){this.canvas.setPointerCapture(e.pointerId);this.handlePointer(e,true);}
  });
  this.canvas.addEventListener('pointermove',e=>{
   if(this.uiBlocked)return;const start=this.pointerStart;if(!start||start.id!==e.pointerId)return;
   if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>9)start.moved=true;
   if(this.dragging&&this.inputMode)this.handlePointer(e,false);
  });
  this.canvas.addEventListener('pointerup',e=>{
   const start=this.pointerStart;if(start&&start.id!==e.pointerId)return;this.clearPointerInput();
   if(this.uiBlocked||!start||start.mode!==this.mode||start.moved||Math.hypot(e.clientX-start.x,e.clientY-start.y)>9||['wand','scrub','rinse','decorate'].includes(this.mode))return;
   if(this.mode==='portrait'){const action=this.portraitActionAt(e);if(action)this.emit('portrait-touch',{action});}
   else if(this.mode==='fetch'){const p=this.pointFromEvent(e);this.throwBall(p.x,p.z);}
   else if(this.mode==='hide'){const o=this.objectAt(e,[this.hideBoxes]);if(o?.userData.boxIndex!==undefined)this.chooseBox(o.userData.boxIndex);}
   else if(this.mode==='explore'){const o=this.objectAt(e,[this.trail]);if(o?.userData.spot)this.emit('visit-spot',{id:o.userData.spot});else{const p=this.pointFromEvent(e);this.moveTo(p.x,p.z);}}
   else if(this.mode==='free'){const o=this.objectAt(e,[this.furnitureRoot]);if(o?.userData.furniture)this.useFurniture(o.userData.furniture);else{const p=this.pointFromEvent(e,0,HOME_BOUNDS);this.moveTo(p.x,p.z);}}
  });
  this.canvas.addEventListener('pointercancel',()=>this.clearPointerInput());
 }
 handlePointer(e,down){if(this.mode==='wand'){const p=this.pointFromEvent(e,.55);this.wandTarget=p;this.feather.position.set(p.x,.55,p.z);this.walkRoute(p.x,p.z);const end=this.waypoints.at(-1)||this.destination;if(end){this.wandTarget.set(end.x,.55,end.z);this.feather.position.copy(this.wandTarget);}}
 if(this.mode==='decorate'){if(down){const o=this.objectAt(e,[this.furnitureRoot]);if(o?.userData.furniture){this.selectedFurniture=o.userData.furniture;this.emit('select-furniture',{uid:this.selectedFurniture,id:this.furnitureMeshes.get(this.selectedFurniture)?.userData.furnitureType});}}const p=this.pointFromEvent(e);this.placeSelected(p.x,p.z);}
 if(['scrub','rinse'].includes(this.mode)){const r=this.canvas.getBoundingClientRect();const screen=this.project(this.cat.position.clone().add(new THREE.Vector3(0,.95,.25)));const dx=e.clientX-r.left-screen.x,dy=e.clientY-r.top-screen.y;const catRadius=Math.max(40,r.height*.16);const near=dx*dx/(catRadius*catRadius)+dy*dy/(catRadius*catRadius*1.4)<1;const p=this.pointFromEvent(e,1.0);(this.mode==='scrub'?this.sponge:this.handShower).position.set(p.x,1.1,p.z+.2);if(near){const distance=this.strokePrevious?Math.hypot(e.clientX-this.strokePrevious.x,e.clientY-this.strokePrevious.y):8;if(distance>2)this.emit('bath-stroke',{amount:Math.min(distance,26)/5});this.strokePrevious={x:e.clientX,y:e.clientY};}}
 }
 bathProgress(ratio,phase){this.bathRatio=ratio;this.foam.children.forEach((m,i)=>m.visible=phase==='scrub'?i/this.foam.children.length<ratio:i/this.foam.children.length>ratio);}
 wiggleWand(){const n=(this.wandStep||0)+1;this.wandStep=n;const x=n%2?1.45:-1.45,z=n%3===0?.1:1.45;this.wandTarget=new THREE.Vector3(x,.55,z);this.feather.position.copy(this.wandTarget);this.walkRoute(x,z);const end=this.waypoints.at(-1)||this.destination;if(end){this.wandTarget.set(end.x,.55,end.z);this.feather.position.copy(this.wandTarget);}}
 throwBall(x=1.7,z=.8){if(!['ready','done'].includes(this.ballPhase))return;const points=route(this.pos,{x,z},this.obstacles(),undefined,this.navPadding()),end=points.at(-1)||{x:this.pos.x,z:this.pos.z};this.ballPhase='flying';this.ballFlight={start:this.elapsed,from:new THREE.Vector3(0,1.3,2.3),target:new THREE.Vector3(end.x,.16,end.z)};this.fetchBall.position.copy(this.ballFlight.from);this.emit('ball-thrown');this.walkRoute(end.x,end.z);}
 newHideRound(){this.hiddenBox=Math.floor(Math.random()*3);this.hideRevealed=false;this.cat.visible=false;this.hideBoxes.children.forEach(g=>g.rotation.z=0);this.emit('hide-ready');}
 chooseBox(i){if(this.hideRevealed)return;if(i===this.hiddenBox){this.hideRevealed=true;this.cat.visible=true;this.pos.set((i-1)*1.9,.57,1);this.pose('peek',2);this.emit('hide-found');}else{this.hideBoxes.children[i].rotation.z=.08;this.emit('hide-miss');}}
 hideHint(){return ['左边','中间','右边'][this.hiddenBox];}
 project(p){const v=p.clone().project(this.camera);return {x:(v.x+1)*this.canvas.clientWidth/2,y:(1-v.y)*this.canvas.clientHeight/2};}
 updateLiving(dt,t){if(!this.ready||!this.cat)return;const {rig,head,tail,eyes,legs}=this.cat.userData;rig.scale.set(1,1,1);this.cat.visible=!(this.mode==='hide'&&!this.hideRevealed);this.props.visible=this.currentScene!=='adopt';if(this.trail)this.trail.visible=this.mode==='explore';this.carriedToy.visible=(this.mode==='free'&&this.stats.bond>=35&&['follow','gift'].includes(this.behavior));this.leafHat.visible=this.mode==='explore'&&this.behavior==='roll'&&t<this.poseUntil;this.ducks.visible=this.mode==='explore'&&this.behavior==='parade'&&t<this.poseUntil;this.tvButterfly.position.x=Math.sin(t*1.4)*.48;this.tvButterfly.position.y=Math.sin(t*2.2)*.12;this.tvButterfly.children.forEach((m,i)=>{if(i<4)m.rotation.y=Math.sin(t*10)*(i<2?1:-1)*.4;});this.tvBird.position.x=Math.sin(t)*.46;this.tvBird.position.y=Math.abs(Math.sin(t*4))*.12; // Per-piece life: the fish tank swims, the fountain bubbles, the lamp shade glows.
 for(const g of this.furnitureMeshes.values()){const anim=g.userData.anim;if(!anim)continue;
  if(anim.fish)for(const f of anim.fish){const seed=f.userData.seed;f.position.x=Math.sin(t*.9+seed*2.1)*.28;f.position.y=Math.sin(t*1.7+seed)*.05;f.rotation.y=Math.cos(t*.9+seed*2.1)<0?Math.PI:0;}
  if(anim.puff)anim.puff.children.forEach((m,i)=>{m.position.y=.46+Math.sin(t*2.2+i*.9)*.035;});
  if(anim.glow)anim.glow.forEach(m=>{m.material.emissiveIntensity=.72+Math.sin(t*1.8)*.18;});}
 // Toy pieces wobble whenever the cat is playing with one.
 for(const g of this.furnitureMeshes.values())if(g.userData.furnitureType==='toy')g.rotation.z=this.behavior==='toy'&&t<this.poseUntil?Math.sin(t*7)*.12:0;
 // Portrait owns the final pose: do not let walking, idle poses or the generic pet overwrite it.
 if(this.mode==='portrait'&&this.currentScene==='adopt'){this.updatePortrait(t);this.emitFrame();return;}
 if(this.action){this.emitFrame();return;}
 this.updateDrive(dt,t);
 if(this.mode==='free'&&t>this.nextIdle&&!this.jump&&!this.destination&&t>this.poseUntil){this.nextIdle=t+10;const choices=PERSONALITIES[this.stats.breed].activities;let activity=choices[this.idleCount++%choices.length];if(this.stats.fullness<45)activity='sniff';if(this.stats.bond>=35&&this.idleCount%4===0)activity='follow';const wanted=IDLE_BEHAVIORS[activity];let target=null;
  if(wanted){const all=[...this.furnitureMeshes].filter(([,m])=>wanted.includes(FURNITURE_BY_ID.get(m.userData.furnitureType)?.behavior));if(all.length)target=all[this.idleCount%all.length][0];}
  if(target)this.useFurniture(target);
  else {const dest={sun:[-1.25,-1.0,.07],sofa:[-2.1,-.55,.74],sleep:[1.9,1.6,.07],sniff:[.1,1.4,.06],follow:[0,1.8,.06],walk:[Math.sin(this.idleCount*2)*2.2,1+Math.cos(this.idleCount)*.8,.06],toy:[-1.25,1.65,.06],box:[1.9,1.1,.06],tower:[-2,-.5,.74]}[activity]||[0,.5,.06];this.moveTo(dest[0],dest[1],()=>{this.behavior=activity;this.poseUntil=this.elapsed+7;if(activity==='sofa'||activity==='tower')this.face=Math.PI/2;},dest[2]);this.emit('behavior',{text:{sun:'找到了阳光，正在给毛毛充电。',sofa:'沙发已被占领，请人类另找座位。',sleep:'没什么事的话，本喵先睡为敬。',sniff:'闻到了饭的方向，也可能是想象力。',follow:this.stats.bond>=35?'叼着玩具来找你了：再陪我玩一会儿嘛。':'正在认真观察你。',walk:'小屋巡逻中，检查每一块地板。',toy:'对这个毛线球发起友好挑战。'}[activity]||'正在寻找下一个快乐角落。'});}}
 if(this.jump){const j=this.jump,u=Math.min(1,(t-j.start)/.72);this.pos.lerpVectors(j.from,j.target,u);this.pos.y+=Math.sin(u*Math.PI)*.55;if(u>=1){this.jump=null;j.after?.();}}
 const wasMoving=!!this.destination;let travelled=this.driveStep||0;
 if(this.destination){
  const delta=this.destination.clone().sub(this.pos),dist=Math.hypot(delta.x,delta.z),speed=['wand','fetch','explore'].includes(this.mode)?2.2:1.05;
  if(dist>.01){const target=Math.atan2(delta.x,delta.z);const turn=Math.atan2(Math.sin(target-this.face),Math.cos(target-this.face));this.face+=turn*Math.min(1,dt*9);}
  travelled=Math.min(dist,dt*speed);
  if(dist<dt*speed+.012){this.pos.copy(this.destination);this.destination=this.waypoints?.shift()||null;if(!this.destination){const cb=this.afterArrive;this.afterArrive=null;cb?.();}}
  else {this.pos.x+=delta.x/dist*travelled;this.pos.z+=delta.z/dist*travelled;this.pos.y+=delta.y*Math.min(1,dt*4);}
 }
 this.walkBlend=THREE.MathUtils.damp(this.walkBlend||0,(wasMoving||travelled>0)?1:0,12,dt);this.gait=(this.gait||0)+travelled/(.40*this.cat.scale.x/.64);
 // Rabbits hop: a paired-leg gait with a little lift each stride; everyone else just bobs.
 rig.position.y=(this.cat.userData.hop?Math.abs(Math.sin(this.gait*Math.PI*2))*.07:Math.sin(this.gait*Math.PI*4)*.012)*this.walkBlend;
 rig.rotation.z=Math.sin(this.gait*Math.PI*2)*.014*this.walkBlend;
 this.cat.userData.gait=this.gait;const stride=this.cat.userData.hop?.28:this.cat.userData.species==='dog'?.36:.40;poseLegs(this.cat,this.gait,stride*this.walkBlend,.12*this.walkBlend);
 if(this.mode==='wand'&&this.wandTarget){const d=Math.hypot(this.pos.x-this.wandTarget.x,this.pos.z-this.wandTarget.z);if(d<.34&&t-this.lastCatch>1.1&&this.lastWand.distanceTo(this.wandTarget)>.6){this.lastCatch=t;this.lastWand.copy(this.wandTarget);this.pose('pounce',.65);this.emit('wand-catch');}this.feather.rotation.z=Math.sin(t*7)*.15;}
 if(this.mode==='fetch'){
 if(this.ballPhase==='flying'){
  const flight=this.ballFlight,u=Math.min(1,(t-flight.start)/1.05);this.fetchBall.position.lerpVectors(flight.from,flight.target,u);this.fetchBall.position.y+=Math.sin(u*Math.PI)*2.4;this.fetchBall.rotation.x+=dt*7;
  if(u>=1){this.ballPhase='waiting';this.walkRoute(flight.target.x,flight.target.z);}
 }
 if(this.ballPhase==='waiting'&&Math.hypot(this.pos.x-this.fetchBall.position.x,this.pos.z-this.fetchBall.position.z)<.50){this.ballPhase='returning';const drop=route(this.pos,{x:0,z:2.05},this.obstacles(),undefined,this.navPadding()).at(-1)||this.pos;this.moveTo(drop.x,drop.z,()=>{this.ballPhase='done';this.fetchBall.position.copy(this.pos).add(new THREE.Vector3(.22,.10,.18));this.emit('fetch-return');});}
 if(this.ballPhase==='returning'){this.cat.position.copy(this.pos);this.cat.rotation.y=this.face;this.cat.updateMatrixWorld(true);this.cat.userData.mouth.getWorldPosition(this.fetchBall.position);}
 }
 if(this.mode==='hide'&&!this.hideRevealed){const b=this.hideBoxes.children[this.hiddenBox];b.rotation.z=Math.sin(t*5)*.025;}
 if(['scrub','rinse'].includes(this.mode)){this.drops.visible=this.mode==='rinse';head.rotation.z=Math.sin(t*2)*.08;this.foam.children.forEach((m,i)=>m.position.y=.67+Math.sin(t*2+i)*.07);}
 if(!this.destination&&this.poseUntil&&t>this.poseUntil&&this.behavior==='meow'){this.behavior='watch';this.poseUntil=0;}
 if(!this.destination&&t<this.poseUntil){if(['sleep','sofa','sun'].includes(this.behavior)){eyes.forEach(e=>e.scale.y=.1);rig.position.y=-.13;poseLegs(this.cat,0,0,0);head.rotation.z=.1;}if(this.behavior==='roll'||this.behavior==='leaves'){rig.rotation.z=Math.sin(t*3)*.9;rig.position.y=.12;}if(this.behavior==='box'){rig.position.y=-.15;poseLegs(this.cat,0,0,0);eyes.forEach(e=>e.scale.y=.8);}if(this.behavior==='tower')head.rotation.y=Math.sin(t)*.45;if(this.behavior==='toy'){legs[0].rotation.x=-.8+Math.sin(t*5)*.4;head.rotation.x=.16;}if(this.behavior==='paw'){legs[0].rotation.x=-.9+Math.sin(t*11)*.55;legs[1].rotation.x=-.4+Math.sin(t*11+1.2)*.3;head.rotation.x=.2+Math.sin(t*6)*.08;}if(this.behavior==='watch'){head.rotation.y=Math.sin(t*.9)*.42;head.rotation.x=.14;tail.rotation.z=Math.sin(t*3.4)*.2;tail.rotation.x=Math.sin(t*1.3)*.08;}if(this.behavior==='sniff'){legs[0].rotation.x=-.8+Math.sin(t*5)*.4;head.rotation.x=.16;}if(this.behavior==='meow'){const at=(t-this.poseStart)/.9;head.rotation.x=-.42*Math.sin(Math.min(1,Math.max(0,at))*Math.PI);rig.position.y=Math.abs(Math.sin(t*11))*.05;eyes.forEach(e=>e.scale.y=.4);}if(['pounce','peek','chase','parade'].includes(this.behavior))rig.position.y=Math.abs(Math.sin(t*7))*.25;if(this.behavior==='sneeze'){head.rotation.x=Math.sin(t*15)*.3;rig.position.y=Math.abs(Math.sin(t*10))*.11;}if(['nuzzle','follow'].includes(this.behavior)){head.rotation.z=Math.sin(t*5)*.22;eyes.forEach(e=>e.scale.y=.15);}}
 this.cat.position.copy(this.pos);this.cat.rotation.y=['wardrobe','adopt'].includes(this.mode)?.42+Math.sin(t*.4)*.08:this.face;if(this.petUntil>t){eyes.forEach(e=>e.scale.y=.13);head.rotation.z=Math.sin(t*8)*.1;}
 this.cat.updateMatrixWorld(true);this.cat.userData.mouth.getWorldPosition(this.carriedToy.position);this.cat.userData.top.getWorldPosition(this.leafHat.position);this.ducks.position.set(this.pos.x-1.1,.08,this.pos.z);this.ducks.children.forEach((d,i)=>d.position.y=Math.abs(Math.sin(t*7+i))*.035);
 if(this.mode==='free'&&this.stats.bond>=70&&this.idleCount>0)this.emit('gift-check');this.emitFrame();
 }
 emitFrame(){if(!this.cat)return;const labels=[];if(this.mode==='explore'&&this.outing){for(const s of this.outing.spots)if(!this.outing.found.includes(s.id))labels.push({id:s.id,...this.project(new THREE.Vector3(s.x,.85,s.z))});if(!this.outing.friendDone)labels.push({id:'friend',...this.project(new THREE.Vector3(2.5,1.65,-.8))});if(!this.outing.eventDone)labels.push({id:'event',...this.project(new THREE.Vector3(-2.35,.72,-.85))});}this.emit('frame',{labels,cat:this.project(this.cat.position.clone().add(new THREE.Vector3(0,1.5,0)))});}
}
