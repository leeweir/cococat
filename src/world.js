import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {BREEDS} from './state.js';
import {createCat,poseLegs,syncEyelids} from './cat-model.js';
export {createCat} from './cat-model.js';
const C={pink:0xd9b9a4,pale:0xf0e6d3,purple:0x9aaa89,deep:0x697b65,blue:0x9cbbbf,cream:0xfff5df,ink:0x5d5141};
const materials=new Map();
const textureData=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4,v=218+Math.sin(y*3.1+Math.sin(x*.11)*1.5)*12+Math.sin(y*.31+x*.018)*12;textureData.set([v,v,v,255],i);}
const grain=new THREE.DataTexture(textureData,128,128);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(3,3);grain.needsUpdate=true;
function mat(c){if(!materials.has(c)){const m=new THREE.MeshStandardMaterial({color:c,roughness:.82});if([0xc99f72,0xb88c60,0xd8b58c,0xd4b38a,0x997451].includes(c)){m.map=grain;m.bumpMap=grain;m.bumpScale=.014;}materials.set(c,m);}return materials.get(c);}
const sphereGeo=new THREE.SphereGeometry(1,32,24);
function mesh(parent,geometry,color,pos=[0,0,0],scale=[1,1,1],outline=false){const m=new THREE.Mesh(geometry,mat(color));m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(outline){const line=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x775d74,side:THREE.BackSide}));line.scale.setScalar(1.022);m.add(line);}return m;}
function ball(p,c,pos,s,outline=false){return mesh(p,sphereGeo,c,pos,s,outline);}
function box(p,c,pos,s,r=.12){return mesh(p,new RoundedBoxGeometry(...s,3,r),c,pos);}
function cyl(p,c,pos,rt,rb,h){return mesh(p,new THREE.CylinderGeometry(rt,rb,h,48),c,pos);}
function tube(p,c,pts,r=.025){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a))),30,r,8,false),c);}
function torus(p,c,pos,r,t,rot=[Math.PI/2,0,0]){const m=mesh(p,new THREE.TorusGeometry(r,t,12,64),c,pos);m.rotation.set(...rot);return m;}
function group(p,pos=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);p.add(g);return g;}
function star(p,c,pos,size=.15){const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?size*.46:size;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();return mesh(p,new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}),c,pos);}
function ear(p,c,x,y,z,large){const shape=new THREE.Shape();shape.moveTo(-.3,0);shape.quadraticCurveTo(-.26,.3,-.04,large?.76:.59);shape.quadraticCurveTo(.05,.68,.3,.04);shape.closePath();const g=group(p,[x,y,z]);g.rotation.z=x<0?.20:-.20;mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:true,bevelThickness:.08,bevelSize:.07,bevelSegments:3,steps:1}),c,[0,0,-.12]);const inner=mesh(g,new THREE.ShapeGeometry(shape),0xe7a5b7,[0,.055,.23],[.65,.7,1]);return g;}
function labelTexture(text,bg='#fff5fa',color='#9c79ab'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 66px sans-serif';ctx.fillText(text,256,128);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function sign(p,text,pos,w=1.6,h=.8,bg,color){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:labelTexture(text,bg,color)}));m.position.set(...pos);p.add(m);return m;}
function plant(p,x,z,color=0xb9cba1,size=1){const g=group(p,[x,0,z]);g.scale.setScalar(size);cyl(g,0xf2cfbc,[0,.24,0],.27,.20,.45);for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(g,color,[Math.cos(a)*.19,.53+i*.045,Math.sin(a)*.19],[.13,.28,.1]);leaf.rotation.z=Math.cos(a)*.65;}return g;}
function flower(p,x,y,z,color){const g=group(p,[x,y,z]);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,color,[Math.cos(a)*.16,Math.sin(a)*.16,0],[.105,.105,.04]);}ball(g,0xffe3a2,[0,0,.04],[.075,.075,.04]);return g;}
function roomBase(p,color=0xeee5d5){
 box(p,0xb88c60,[0,-.21,0],[9,.40,6.4],.10);
 for(let row=0;row<12;row++)for(let col=0;col<4;col++){const x=-3.34+col*2.23;box(p,(row+col)%3===0?0xd8b58c:0xd4b38a,[x,.004,-2.88+row*.525],[2.218,.06,.512],.008);}
 box(p,color,[0,1.55,-3.05],[8.96,3.2,.18],.025);
 box(p,0xf0e8d9,[-4.43,.77,0],[.14,1.65,6.18],.035);
 box(p,0xc99f72,[0,.12,-2.92],[8.8,.19,.09],.015);
 for(let i=0;i<15;i++)box(p,0xd5c8b5,[-4.15+i*.6,.55,-2.94],[.025,.88,.022],.001);
 box(p,0xd5c8b5,[0,1,-2.94],[8.8,.035,.023],.004);
}
function windowProp(p,x,y,z){
 box(p,0xc99f72,[x,y,z],[2.52,1.88,.16],.08);box(p,0xe9f0d9,[x,y,z+.09],[2.30,1.66,.035],.05);
 ball(p,0xbccdac,[x-.57,y-.55,z+.12],[.72,.45,.015]);ball(p,0xcdd8b7,[x+.5,y-.52,z+.13],[.94,.50,.015]);
 ball(p,0xffebbc,[x+.52,y+.41,z+.13],[.23,.23,.014]);
 for(const dx of [-.57,0,.57])box(p,0xf5ebd6,[x+dx,y,z+.18],[.046,1.7,.06],.005);
 box(p,0xf5ebd6,[x,y+.03,z+.18],[2.33,.048,.06],.005);
 for(const side of [-1,1])for(let i=0;i<4;i++)box(p,i%2?0xe8dac0:0xf1e6d0,[x+side*(1.05+i*.068),y+.02,z+.25],[.15,1.99,.13],.065);
 tube(p,0x997451,[[x-1.46,y+1.06,z+.2],[x+1.46,y+1.06,z+.2]],.025);
 box(p,0xc99f72,[x,y-.97,z+.18],[2.84,.10,.48],.035);
}
function sofa(p){const g=group(p,[-2.3,0,-.9]);
 for(const x of [-1,1])for(const z of [-.41,.41]){const leg=cyl(g,0x997451,[x,.16,z],.048,.065,.3);leg.rotation.z=x*.08;}
 box(g,0xc99f72,[0,.3,0],[2.48,.19,1.24],.065);
 box(g,0x82917b,[0,.82,-.47],[2.42,1.08,.35],.2);
 for(const x of [-.51,.51]){box(g,0xa5b197,[x,.54,.045],[.99,.30,.97],.17);box(g,0x94a487,[x,.93,-.35],[1.0,.64,.25],.15);}
 for(const x of [-1.1,1.1])box(g,0x94a487,[x,.67,.025],[.29,.70,1.18],.14);
 const pillow=box(g,0xe9d9b7,[-.63,.97,-.15],[.58,.51,.24],.14);pillow.rotation.z=-.18;
 const pillow2=box(g,0xb78360,[.63,.95,-.10],[.53,.50,.24],.14);pillow2.rotation.z=.19;
 for(let i=0;i<7;i++)tube(g,0xd8c49d,[[-.85+i*.072,.80,.012],[-.89+i*.072,1.07,-.03]],.006);
 return g;}
function wardrobe(p){const g=group(p,[2.85,0,-1.75]);
 for(const x of [-.66,.66])cyl(g,0x997451,[x,.12,0],.055,.068,.24);
 box(g,0xb88c60,[0,1.37,0],[1.68,2.55,.96],.075);
 for(const side of [-1,1]){box(g,0xc99f72,[side*.40,1.4,.50],[.76,2.34,.09],.045);box(g,0xd6c3a1,[side*.40,1.54,.556],[.62,1.80,.025],.035);
  for(let j=0;j<20;j++)box(g,0xbda784,[side*.40, .7+j*.084,.574],[.60,.016,.012],.002);
  ball(g,0x98713e,[side*.13,1.25,.62],[.028,.044,.032]);}
 box(g,0xd8b58c,[0,2.71,0],[1.83,.13,1.07],.055);
 const photo=box(g,0x997451,[0,2.95,.05],[.40,.38,.04],.02);box(g,0xe9e1c7,[0,2.95,.08],[.34,.32,.016],.01);ball(g,0x99ad86,[0,2.93,.095],[.09,.1,.005]);
 g.userData.action='wardrobe';g.traverse(o=>{if(o.isMesh)o.userData.action='wardrobe';});return g;}
function television(p,pos=[.55,1.27,-2.3]){const g=group(p,pos);box(g,0x765c42,[0,0,0],[1.95,1.2,.22],.13);box(g,0x9dc1c2,[0,0,.125],[1.72,.96,.025],.08);for(const s of [-1,1])tube(g,0x6d5642,[[s*.65,-.5,0],[s*.76,-.78,0]],.04);const fish=group(g,[0,0,.2]);ball(fish,0xffdaa1,[0,0,0],[.28,.14,.04]);const fin=mesh(fish,new THREE.ConeGeometry(.15,.24,3),0xd2a474,[-.31,0,0]);fin.rotation.z=Math.PI/2;ball(fish,0x514458,[.15,.03,.043],[.024,.024,.016]);const ticker=sign(g,'鱼鱼频道',[.48,-.36,.16],.6,.19,'#9dc1c2','#5c90b0');return {g,fish,ticker};}
export class CatWorld{
 constructor(canvas,onPet,onWardrobe){
 this.canvas=canvas;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xf5eee4);this.scene.fog=new THREE.Fog(0xf5eee4,22,40);this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.0;this.camera=new THREE.PerspectiveCamera(34,1,.1,70);this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.enablePan=false;this.controls.minDistance=5.5;this.controls.maxDistance=25;this.controls.minPolarAngle=.58;this.controls.maxPolarAngle=1.46;this.controls.minAzimuthAngle=-.85;this.controls.maxAzimuthAngle=.85;this.controls.enableZoom=false;
 this.scene.add(new THREE.HemisphereLight(0xffffff,0xc3b599,1.55));const sun=new THREE.DirectionalLight(0xfff4e3,2.3);sun.position.set(-3,9,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;this.scene.add(sun);const fill=new THREE.DirectionalLight(0xd7e6e2,.8);fill.position.set(5,4,-3);this.scene.add(fill);const pmrem=new THREE.PMREMGenerator(this.renderer),roomLight=new RoomEnvironment();this.scene.environment=pmrem.fromScene(roomLight,.04).texture;roomLight.dispose();pmrem.dispose();this.scene.environmentIntensity=.45;
 this.environments={};this.buildAdopt();this.buildHome();this.buildBath();this.buildPark();this.buildWardrobe();this.particles=[];this.cat=null;this.currentScene='adopt';this.action=null;this.elapsed=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.lastTime=performance.now();this.cameraSet=false;this.resize=new ResizeObserver(()=>this.updateSize());this.resize.observe(canvas.parentElement);let down;canvas.addEventListener('pointerdown',e=>down={x:e.clientX,y:e.clientY});canvas.addEventListener('pointerup',e=>{if(this.inputMode||this.uiBlocked)return;if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;const rect=canvas.getBoundingClientRect();const pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);const ray=new THREE.Raycaster();ray.setFromCamera(pointer,this.camera);const hits=ray.intersectObjects([this.cat,...Object.values(this.environments).filter(g=>g.visible)].filter(Boolean),true);if(hits.length){let o=hits[0].object;while(o){if(o.userData.action==='wardrobe'){onWardrobe();return;}if(o===this.cat){onPet();return;}o=o.parent;}}});this.setScene('adopt');this.animate();
 }
 environment(id){const g=group(this.scene);g.visible=false;this.environments[id]=g;return g;}
 buildAdopt(){const p=this.environment('adopt');
 box(p,0xb88c60,[0,-.16,-.25],[5.8,.26,4.0],.12);
 for(let i=0;i<11;i++)box(p,i%3?0xd8b58c:0xd4b38a,[-2.65+i*.53,-.002,-.25],[.52,.065,3.94],.008);
 box(p,0xebe4d3,[0,1.35,-2.35],[5.8,2.9,.16],.05);windowProp(p,0,1.67,-2.18);
 const rug=cyl(p,0xc7c9ac,[0,.04,.10],1.55,1.55,.025);rug.scale.z=.82;
 for(let i=0;i<8;i++){const ring=torus(p,i%2?0xb8b99c:0xd6d4b9,[0,.056,.10],1.13+i*.052,.009);ring.scale.z=.82;}
 plant(p,-2.23,-.9,0x839873,.96);plant(p,2.2,-1.5,0x9cac81,.80);
 for(let i=0;i<3;i++){const b=box(p,[0x89977b,0xd1b386,0xbd896d][i],[1.9,.08+i*.1,-.1],[.55,.10,.40],.015);b.rotation.y=i*.14;}
 ball(p,0xc79578,[-1.7,.16,.7],[.16,.16,.16]);for(let i=0;i<4;i++)torus(p,0xead7b9,[-1.7,.16,.7],.161,.006,[i*.5,0,i*.8]);
}
 buildHome(){const p=this.environment('home');roomBase(p);windowProp(p,-1.8,2,-2.87);sofa(p);this.closet=wardrobe(p);
 const rug=cyl(p,0xccbf9f,[.35,.045,.5],1.85,1.85,.022);rug.scale.z=.72;for(let i=0;i<8;i++){const r=torus(p,i%2?0xe3d4b8:0xb4aa8b,[.35,.061,.5],1.53+i*.039,.006);r.scale.z=.72;}
 box(p,0xc99f72,[.6,.35,-2.28],[2.18,.55,.83],.035);for(const x of [-.22,1.42])for(const z of [-2.5,-2.05])cyl(p,0x997451,[x,.09,z],.035,.045,.18);
 for(let i=0;i<2;i++)box(p,0xb88c60,[.05+i*1.1,.36,-1.853],[1.03,.41,.035],.025);this.tv=television(p,[.6,1.30,-2.23]);
 plant(p,-3.5,1.8,0x879b73,1.15);
 const lamp=group(p,[-3.85,0,-1.7]);cyl(lamp,0x997451,[0,.10,0],.22,.22,.08);cyl(lamp,0x997451,[0,1.05,0],.018,.018,2.0);cyl(lamp,0xe5d4ae,[0,2.03,0],.31,.45,.53);
 ball(p,0xb68b63,[-1.25,.18,1.65],[.15,.15,.15]);for(let i=0;i<4;i++)torus(p,0xe9d7b7,[-1.25,.18,1.65],.151,.005,[i*.6,.3,i]);
 tube(p,0xb68b63,[[-1.35,.1,1.7],[-1.6,.06,1.9],[-1.4,.06,2.2],[-1.72,.06,2.38]],.014);
 this.bowl=group(p,[0,.09,1.32]);cyl(this.bowl,0x9eaf9a,[0,.1,0],.41,.32,.19);cyl(this.bowl,0x657c68,[0,.204,0],.33,.33,.014);torus(this.bowl,0xe6dec8,[0,.203,0],.365,.022);this.food=group(this.bowl);
 for(let i=0;i<16;i++){const a=i*2.4,r=.26*Math.sqrt(i/16);ball(this.food,0xb37f47,[Math.cos(a)*r,.22,Math.sin(a)*r],[.045,.03,.043]);}this.bowl.visible=false;
}
 buildBath(){const p=this.environment('bath');roomBase(p,0xe8e8d8);for(let i=0;i<12;i++)for(let j=0;j<5;j++)box(p,(i+j)%2?0xd6dfcf:0xf0eadb,[-4+i*.72,.39+j*.66,-2.86],[.69,.63,.025],.015);windowProp(p,-2.35,2.55,-2.76);box(p,0xc99f72,[2.8,.85,-1.8],[1.5,1.7,.9],.12);box(p,0xeee7d6,[2.8,1.77,-1.8],[1.65,.17,1.06],.12);for(let i=0;i<3;i++){cyl(p,[0xa0b8a3,0xcdac84,0xaab394][i],[2.3+i*.38,2,-1.8],.12,.12,.39);cyl(p,0xfff6ef,[2.3+i*.38,2.24,-1.8],.065,.065,.08);}this.tub=group(p,[0,.05,.15]);const tubProfile=[[0,.10],[1.05,.10],[1.30,.22],[1.48,.56],[1.48,.64],[1.33,.65],[1.18,.30],[1.0,.20],[0,.20]].map(([r,y])=>new THREE.Vector2(r,y));const tubbase=mesh(this.tub,new THREE.LatheGeometry(tubProfile,64),0xfff4de);tubbase.scale.z=.68;const water=cyl(this.tub,0xb1ddeb,[0,.34,0],1.22,1.22,.025);water.scale.z=.68;const rim=torus(this.tub,0xfff7e6,[0,.64,0],1.36,.13);rim.scale.z=.7;tube(p,0xb49b68,[[-1.75,0,.1],[-1.75,2.8,.1],[-1.5,3,.1],[-.95,2.95,.1]],.065);const shower=cyl(p,0xa6bdce,[-.91,2.9,.1],.27,.19,.08);this.drops=group(p);for(let i=0;i<18;i++){const d=ball(this.drops,0x8fc9e6,[-1.14+(i%3)*.15,.8+(i/3)*.3,.02+(i%2)*.13],[.02,.065,.02]);d.userData.seed=i;}this.foam=group(p);for(let i=0;i<22;i++){const a=i*2.399;const bb=ball(this.foam,i%3?0xf4fbff:0xd4e9f3,[Math.cos(a)*(.6+(i%3)*.27),.64+Math.sin(i)*.1,.15+Math.sin(a)*.7],[.13+(i%3)*.035,.13+(i%3)*.035,.13+(i%3)*.035]);bb.userData.seed=i;}ball(p,0xffd987,[1.0,.82,.8],[.21,.14,.19]);ball(p,0xffdc8c,[1.04,.99,.78],[.13,.13,.13]);ball(p,0xe4a077,[1.04,.99,.93],[.085,.035,.065]);ball(p,0x5e5165,[.99,1.03,.88],[.018,.018,.018]);box(p,0xb7bea0,[.5,.08,2.22],[2.6,.08,.65],.08);}
 buildPark(){const p=this.environment('park');cyl(p,0xb4a17f,[0,-.23,0],4.45,4.5,.4);cyl(p,0xadb88d,[0,-.01,0],4.4,4.4,.1);const path=cyl(p,0xdfcaa2,[0,.05,.6],2.45,2.45,.03);path.scale.z=.64;for(const a of [[-2.9,-1.8,.95],[2.8,-2.1,1.15],[-3.4,.7,.65]]){const tr=group(p,[a[0],0,a[1]]);tr.scale.setScalar(a[2]);cyl(tr,0x9e7955,[0,1,0],.15,.21,2);for(const v of [[-.5,2,0],[.45,2.2,0],[0,2.67,0],[0,2.1,.35]])ball(tr,0x92a979,v,[.73,.69,.7]);}for(let i=0;i<22;i++){const a=i*2.4,r=2.7+(i%3)*.4;flower(p,Math.cos(a)*r,.2,Math.sin(a)*r,i%2?0xf0b4c8:0xf5e2af).scale.setScalar(.58);}for(let i=0;i<10;i++){box(p,C.cream,[-3.5+i*.77,.53,-3.12],[.13,1.05,.12],.03);}box(p,C.cream,[0,.74,-3.12],[7.5,.13,.1]);box(p,C.cream,[0,.25,-3.12],[7.5,.13,.1]);this.butterfly=group(p,[1.3,1.7,.5]);for(const s of [-1,1]){const wing=ball(this.butterfly,s<0?0xaaa4dc:0xb7d7eb,[s*.14,0,0],[.19,.23,.028]);wing.rotation.z=-s*.35;}ball(this.butterfly,0x7f7092,[0,0,0],[.025,.17,.035]);this.parkBall=ball(p,0x97bfdc,[1.8,.22,1.3],[.22,.22,.22]);torus(p,0xfceac6,[1.8,.22,1.3],.225,.015,[.7,0,.4]);}
 buildWardrobe(){const p=this.environment('wardrobe');roomBase(p,0xe7e6d5);
 for(let i=0;i<20;i++)box(p,i%2?0x9faa8e:0xaeb799,[-4.18+i*.44,1.6,-2.85],[.49,3.2,.18],.16);
 cyl(p,0xb88c60,[0,.13,.25],1.70,1.77,.24);cyl(p,0xe9d9b9,[0,.26,.25],1.67,1.67,.10);for(let i=0;i<5;i++)torus(p,0xc2ac88,[0,.32,.25],1.35+i*.055,.006);
 box(p,0xb88c60,[-2.65,1.48,-1.25],[1.5,2.68,.17],.23);box(p,0xc8d8cf,[-2.65,1.48,-1.145],[1.34,2.52,.024],.20);tube(p,0xf1f1d9,[[-3.05,1.6,-1.11],[-2.41,2.29,-1.11]],.024);
 tube(p,0x997451,[[2.1,.05,-1.4],[2.1,2.55,-1.4],[3.4,2.55,-1.4],[3.4,.05,-1.4]],.04);
 for(let i=0;i<3;i++){const x=2.35+i*.4;torus(p,0xc7a76e,[x,2.51,-1.4],.07,.008,[0,0,0]);tube(p,0x997451,[[x,2.44,-1.4],[x-.17,2.26,-1.4],[x+.17,2.26,-1.4],[x,2.44,-1.4]],.014);box(p,[0xc08f78,0x8eabaf,0xd5c39a][i],[x,1.95,-1.4],[.38,.62,.055],.03);}
 box(p,0xc99f72,[2.75,.22,-1.3],[1.57,.40,.85],.06);plant(p,-3.6,.9,0x9caa7d,.8);
 }
 setCat(id,outfit){if(this.cat){this.scene.remove(this.cat);disposeCat(this.cat);}this.cat=createCat(id,outfit);this.scene.add(this.cat);this.cat.rotation.y=.07;this.placeCat();}
 placeCat(){if(!this.cat)return;this.cat.scale.setScalar(this.cat.userData.baseScale*(['adopt','wardrobe'].includes(this.currentScene)?1:this.currentScene==='bath'?.86:.68));const y=this.currentScene==='bath'?.28:this.currentScene==='wardrobe'?.32:.06;const z=['home','tv'].includes(this.currentScene)?.55:this.currentScene==='wardrobe'?.25:0;this.cat.position.set(0,y,z);this.baseY=y;this.baseZ=z;}
 setScene(name){this.currentScene=name;for(const [id,g]of Object.entries(this.environments))g.visible=id===(name==='tv'?'home':name);this.placeCat();this.resetCamera();if(this.bowl)this.bowl.visible=false;}
 resetCamera(){
 const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;
 const narrow=w<760,adopt=this.currentScene==='adopt',closet=this.currentScene==='wardrobe';
 const panel=narrow?0:300,playWidth=w-panel;this.camera.aspect=w/h;this.camera.fov=38;
 // Fit the world in the playable area, allowing a closer crop on a portrait screen.
 const worldWidth=adopt?(narrow?4.5:4.8):closet?(narrow?6.7:8.5):(narrow?7.0:10.2);
 const distance=Math.max(adopt?7:8.8,worldWidth/(2*Math.tan(19*Math.PI/180)*(playWidth/h)));
 const targetY=adopt?.9:.45;this.controls.target.set(0,targetY,0);
 this.camera.position.set(distance*.12,targetY+distance*(adopt?.32:.57),distance);
 this.camera.setViewOffset(w,h,panel/2,narrow?h*.055:0,w,h);this.camera.updateProjectionMatrix();this.controls.update();this.cameraSet=true;
 }
 setPaused(value){this.uiBlocked=value;this.controls.enabled=!value&&!this.inputMode;}
 updateSize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.renderer.setSize(w,h,false);this.resetCamera();}
 rotate(dir){const offset=this.camera.position.clone().sub(this.controls.target);const theta=Math.atan2(offset.x,offset.z)+dir*.28;const r=Math.hypot(offset.x,offset.z);this.camera.position.x=r*Math.sin(theta);this.camera.position.z=r*Math.cos(theta);this.controls.update();}
 startAction(id){this.action=id;this.actionStarted=this.elapsed;this.bowl.visible=id==='feed';this.food.visible=true;}
 finishAction(){this.action=null;if(this.food)this.food.visible=false;}
 pet(){this.petUntil=this.elapsed+1.6;}
 thumbnails(){const shots={};const old=this.renderer.getSize(new THREE.Vector2()),bg=this.scene.background;const renderScene=new THREE.Scene();renderScene.add(new THREE.HemisphereLight(0xffffff,0xc2bba6,1.7));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-3,6,5);renderScene.add(light);renderScene.environment=this.scene.environment;renderScene.environmentIntensity=.45;const cam=new THREE.PerspectiveCamera(32,1,.1,20);cam.position.set(2.5,2.3,5.6);cam.lookAt(0,1.2,.05);this.renderer.setSize(160,160,false);this.renderer.setClearColor(0xfff5fa,0);for(const b of BREEDS){const cat=createCat(b.id);cat.rotation.y=.13;renderScene.add(cat);const bounds=new THREE.Box3().setFromObject(cat),center=bounds.getCenter(new THREE.Vector3()),height=bounds.max.y-bounds.min.y;cam.position.set(2.3,center.y+1.05,Math.max(4.8,height*2.0));cam.lookAt(center);this.renderer.render(renderScene,cam);shots[b.id]=this.canvas.toDataURL('image/png');renderScene.remove(cat);disposeCat(cat);}this.renderer.setClearColor(0xf5eee4,1);this.renderer.setSize(old.x,old.y,false);return shots;}
 animate(){requestAnimationFrame(()=>this.animate());const now=performance.now(),dt=Math.min((now-this.lastTime)/1000,.05);this.lastTime=now;if(!this.uiBlocked)this.elapsed+=dt;const t=this.elapsed;this.controls.update();if(this.uiBlocked){this.renderer.render(this.scene,this.camera);return;}if(this.cat){const {rig,head,tail,eyes,legs}=this.cat.userData;const at=t-(this.actionStarted||0);rig.position.y=this.reduced?0:Math.sin(t*2)*.025;rig.rotation.set(0,0,0);head.rotation.set(0,Math.sin(t*.65)*.055,Math.sin(t*.5)*.025);tail.rotation.z=Math.sin(t*2)*.13;this.cat.position.set(0,this.baseY,this.baseZ);this.cat.rotation.y=.07;const blink=Math.sin(t*1.5)> .994?.1:1;eyes.forEach(e=>e.scale.y=blink);poseLegs(this.cat,0,0,0);
 if(this.action==='feed'){head.rotation.x=.23+Math.sin(at*7)*.13;rig.rotation.x=.12;this.cat.position.z=.82;tail.rotation.z=Math.sin(at*5)*.18;}
 if(this.action==='bath'){rig.rotation.z=Math.sin(at*12)*.06;head.rotation.z=Math.sin(at*7)*.12;eyes.forEach(e=>e.scale.y=.7);legs.forEach((l,i)=>l.rotation.x=Math.sin(at*8+i*Math.PI)*.3);}
 if(this.action==='tv'){this.cat.rotation.y=2.72;head.rotation.z=Math.sin(at*3)*.15;head.rotation.y=Math.sin(at*2)*.28;rig.position.y=Math.abs(Math.sin(at*3))*.12;}
 if(this.action==='play'){this.cat.position.x=Math.sin(at*1.6)*1.13;this.cat.position.z=this.baseZ+Math.cos(at*1.6)*.4;this.cat.rotation.y=Math.cos(at*1.6)*.6;rig.position.y=Math.abs(Math.sin(at*7))*.20;legs.forEach((l,i)=>l.rotation.x=Math.sin(at*7+i*Math.PI)*.5);}
 if(this.petUntil>t){eyes.forEach(e=>e.scale.y=.13);head.rotation.z=Math.sin(t*8)*.1;rig.position.y=Math.abs(Math.sin(t*6))*.14;}
 if(this.currentScene==='wardrobe'){this.cat.rotation.y=.1+Math.sin(t*.4)*.12;}
 }
 if(this.tv){this.tv.fish.position.x=Math.sin(t*1.7)*.53;this.tv.fish.position.y=Math.sin(t*2.1)*.11;this.tv.fish.rotation.y=Math.cos(t*1.7)<0?Math.PI:0;}
 if(this.butterfly){this.butterfly.position.set(Math.sin(t*1.6)*1.5,1.8+Math.sin(t*2)*.25,.3+Math.cos(t*1.6)*.7);this.butterfly.children.forEach((m,i)=>{if(i<2)m.rotation.y=Math.sin(t*18)*(i?1:-1);});}
 if(this.foam&&this.environments.bath.visible){this.foam.children.forEach((m,i)=>m.position.y=.67+Math.sin(t*2+i)*.07);this.drops.visible=this.action==='bath';this.drops.children.forEach((m,i)=>m.position.y=.7+((i*.17-t*1.5)%2.1+2.1)%2.1);}
 this.updateLiving?.(dt,t);if(this.cat)syncEyelids(this.cat);
 this.renderer.render(this.scene,this.camera);
 }
 inspect(){return {scene:this.currentScene,breed:this.cat?.userData.breed,outfit:this.cat?.userData.outfit,catMeshes:this.cat?(()=>{let n=0;this.cat.traverse(o=>{if(o.isMesh)n++;});return n;})():0,renderer:this.renderer.info.render,canvas:{width:this.canvas.width,height:this.canvas.height},camera:this.camera.position.toArray()};}
}

function disposeCat(cat){if(cat.userData.ownedGeometries){for(const g of cat.userData.ownedGeometries)g.dispose();for(const m of cat.userData.ownedMaterials){m.map?.dispose();m.dispose();}return;}cat.traverse(o=>{if(!o.isMesh)return;if(o.geometry!==sphereGeo)o.geometry.dispose();if(o.material.type==='MeshBasicMaterial')o.material.dispose();});}

export {THREE, C, group, ball, box, cyl, tube, torus, star, flower, plant, sign, mesh, createCat as makeCat, disposeCat};
