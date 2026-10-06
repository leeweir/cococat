const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function blocked(x,z,obstacles,padding=.38){
 return obstacles.some(o=>o.type==='circle'?Math.hypot(x-o.x,z-o.z)<o.r+padding:x>o.x-o.w/2-padding&&x<o.x+o.w/2+padding&&z>o.z-o.d/2-padding&&z<o.z+o.d/2+padding);
}
export function clearSegment(a,b,obstacles,padding=.38){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.08));for(let i=0;i<=n;i++){const t=i/n;if(blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,obstacles,padding))return false;}return true;}
export function route(start,target,obstacles,bounds={minX:-3.55,maxX:3.55,minZ:-2.4,maxZ:2.4},padding=.38){
 const step=.22,cols=Math.ceil((bounds.maxX-bounds.minX)/step)+1,rows=Math.ceil((bounds.maxZ-bounds.minZ)/step)+1;
 const point=id=>({x:bounds.minX+(id%cols)*step,z:bounds.minZ+Math.floor(id/cols)*step});
 const available=[];for(let id=0;id<cols*rows;id++){const p=point(id);if(p.x<=bounds.maxX&&p.z<=bounds.maxZ&&!blocked(p.x,p.z,obstacles,padding))available.push(id);}
 if(!available.length)return [];
 const nearest=p=>available.reduce((a,b)=>{const pa=point(a),pb=point(b);return Math.hypot(pa.x-p.x,pa.z-p.z)<Math.hypot(pb.x-p.x,pb.z-p.z)?a:b;});
 const s=nearest(start),goal=nearest(target),valid=new Set(available),open=new Set([s]),cost=new Map([[s,0]]),parent=new Map();
 const heuristic=id=>{const p=point(id),g=point(goal);return Math.hypot(p.x-g.x,p.z-g.z);};let best=s;
 while(open.size){let current=[...open].reduce((a,b)=>(cost.get(a)+heuristic(a))<(cost.get(b)+heuristic(b))?a:b);open.delete(current);if(heuristic(current)<heuristic(best))best=current;if(current===goal){best=goal;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const x=current%cols+dx,z=Math.floor(current/cols)+dz;if(x<0||x>=cols||z<0||z>=rows)continue;const next=z*cols+x;if(!valid.has(next)||!clearSegment(point(current),point(next),obstacles,padding))continue;const c=cost.get(current)+Math.hypot(dx,dz)*step;if(c>=(cost.get(next)??Infinity))continue;cost.set(next,c);parent.set(next,current);open.add(next);}
 }
 const nodes=[];for(let n=best;n!==undefined;n=parent.get(n)){nodes.unshift(point(n));if(n===s)break;}
 const result=[],origin={x:start.x,z:start.z};let prev=origin,index=0;
 while(index<nodes.length){let end=index;for(let j=index+1;j<nodes.length;j++){if(clearSegment(prev,nodes[j],obstacles,padding))end=j;else break;}result.push(nodes[end]);prev=nodes[end];index=end+1;}
 const exact={x:clamp(target.x,bounds.minX,bounds.maxX),z:clamp(target.z,bounds.minZ,bounds.maxZ)};
 if(best===goal&&clearSegment(prev,exact,obstacles,padding))result.push(exact);
 return result.filter((p,i)=>i||Math.hypot(p.x-start.x,p.z-start.z)>.025);
}
