import * as THREE from 'three';
const clamp=THREE.MathUtils.clamp;

function patch(project,x,y,rx,ry,upper,colorAt){
  const segments=28,rows=9,positions=[],colors=[],indices=[];
  for(let row=0;row<rows;row++)for(let j=0;j<=segments;j++){
    const a=j/segments*Math.PI+(upper?0:Math.PI),r=1+row/(rows-1)*.16;
    const u=Math.cos(a)*rx*r,v=Math.sin(a)*ry*r;
    positions.push(u,v,project(x+u,y+v)+.006);
    const c=colorAt(x+u,y+v,project(x+u,y+v)).multiplyScalar(.97+.03*row/(rows-1));
    colors.push(c.r,c.g,c.b);
  }
  for(let row=0;row<rows-1;row++)for(let j=0;j<segments;j++){
    const a=row*(segments+1)+j,b=a+segments+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  g.userData={segments,rows,rx,ry,x,y,upper,project};return g;
}

export function attachEyelids(head,eye,project,rx,ry,colorAt,material,owned){
  const {x,y}=eye.position,parts=[];
  for(const upper of [true,false]){
    const g=patch(project,x,y,rx,ry,upper,colorAt),m=new THREE.Mesh(g,material);
    m.position.set(x,y,0);m.name=upper?'upper-eyelid':'lower-eyelid';m.castShadow=false;head.add(m);owned.add(g);parts.push(m);
  }
  const closed=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([-1,-.5,0,.5,1].map(u=>new THREE.Vector3(u*rx,ry*.14*(1-u*u),project(x+u*rx,y+ry*.14*(1-u*u))+.028))),16,.0055,5),new THREE.MeshStandardMaterial({color:'#655044',roughness:.95}));
  closed.position.set(x,y,0);closed.visible=false;head.add(closed);owned.add(closed.geometry);
  eye.userData={...eye.userData,lid:closed,lids:parts,openness:1};
  return closed.material;
}

export function updateEyelids(cat){
  const expression=cat.userData.expression||{warmth:0,alert:0};
  for(const eye of cat.userData.eyes){
    const openness=clamp(eye.scale.y,.025,1),{lids,lid}=eye.userData;
    eye.userData.openness=openness;
    // Animation callers retain scale.y as an openness control; the iris itself stays round.
    eye.children[0].scale.y=1/openness;eye.visible=openness>.07;lid.visible=openness<.15;
    const key=`${openness.toFixed(4)}-${expression.warmth}`;
    if(eye.userData.lidKey===key)continue;eye.userData.lidKey=key;
    for(const part of lids){
      const g=part.geometry,p=g.attributes.position,d=g.userData;
      for(let row=0;row<d.rows;row++)for(let j=0;j<=d.segments;j++){
        const a=j/d.segments*Math.PI+(d.upper?0:Math.PI),u=Math.cos(a),v=Math.sin(a),blend=row/(d.rows-1);
        const x=u*d.rx*(1+blend*.16),closedY=d.ry*.14*(1-u*u);
        const inner=v*d.ry*openness+closedY*(1-openness)+(d.upper?-.013*expression.warmth*(1-u*u):0);
        const y=THREE.MathUtils.lerp(inner,v*d.ry*1.16,blend),radius=Math.hypot(x/d.rx,y/d.ry);
        // Dense curved covers stay ahead of the cornea over the entire covered area.
        const lift=.001+(.019-.009*Math.min(1,radius*radius))*(1-THREE.MathUtils.smoothstep(radius,1,1.16));
        p.setXYZ(row*(d.segments+1)+j,x,y,d.project(d.x+x,d.y+y)+lift);
      }
      p.needsUpdate=true;g.computeVertexNormals();
    }
  }
}

export function blinkAt(t){
  const cycle=(t%5.4+5.4)%5.4;
  if(cycle<4.9)return 1;
  const u=(cycle-4.9)/.5;return 1-.97*Math.sin(Math.PI*u)**2;
}

export function coatMaterial(options,hairless=false){
  const material=new THREE.MeshPhysicalMaterial({...options,roughness:hairless?.67:.88,sheen:hairless?.1:.65,sheenRoughness:.78,sheenColor:'#fff3e5'});
  if(!hairless){
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vCoatPoint;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCoatPoint = position;');
      shader.fragmentShader='varying vec3 vCoatPoint;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float nap = sin(vCoatPoint.x*245.0 + sin(vCoatPoint.y*135.0)*2.0) * sin(vCoatPoint.z*190.0 + vCoatPoint.y*95.0);
        vec3 napX = dFdx(vCoatPoint), napY = dFdy(vCoatPoint);
        normal = normalize(normal - 0.0018*(dFdx(nap)*normalize(napX+vec3(0.000001)) + dFdy(nap)*normalize(napY+vec3(0.000001))));`);
    };
    material.customProgramCacheKey=()=> 'pet-soft-nap-v2';
  }
  return material;
}
