export const PORTRAIT_ACTIONS=[
 {id:'head',label:'摸摸头',icon:'hand',request:'想要你摸摸我的头。',response:'呼噜噜，脑袋交给你保管了。',sound:'purr'},
 {id:'chin',label:'挠下巴',icon:'cat',request:'下巴有点痒，帮我挠一挠。',response:'就是这里！舒服得想把下巴放在你手里。',sound:'purr'},
 {id:'nose',label:'碰鼻子',icon:'heart',request:'伸出一根手指，和我碰个鼻尖吧。',response:'确认过气味，是我的人类。',sound:'meow'},
 {id:'paw',label:'击个掌',icon:'paw',request:'小爪子举好了，和我击个掌吧。',response:'啪！说好啦，今天也要一起玩。',sound:'tone'},
 {id:'blink',label:'慢慢眨眼',icon:'cat',request:'陪我慢慢眨一下眼睛，好不好？',response:'慢慢闭上眼睛，是我说喜欢你的方式。',sound:'purr'}
];
const actionIds=new Set(PORTRAIT_ACTIONS.map(action=>action.id));

export function createPortraitSession(id,random=Math.random){
 const pool=[...actionIds],requests=[];
 for(let i=0;i<3;i++)requests.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
 return {kind:'portrait',id,requests,count:0,pending:null,done:false};
}

export function beginPortraitAction(session,action){
 if(session.pending!==null||!actionIds.has(action))return false;
 session.pending=action;
 return true;
}

// Animation completion, not a button press, satisfies a wish. One completion can advance only once.
export function finishPortraitAction(session,action){
 if(session.pending!==action||!actionIds.has(action))return 'ignored';
 session.pending=null;
 if(session.done)return 'free';
 if(session.requests[session.count]!==action)return 'miss';
 session.count++;
 if(session.count===session.requests.length){session.done=true;return 'complete';}
 return 'progress';
}
