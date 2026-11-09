import * as THREE from 'three';
import {generateModel} from './models.js';
import {buildings,palette,paper,ink,accent,shotAt,smooth} from './data.js';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function createFilm(){
 const canvas=document.createElement('canvas');canvas.width=3840;canvas.height=2160;
 const ctx=canvas.getContext('2d',{alpha:false});
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(2);renderer.setSize(1240,930,false);renderer.setClearColor(paper,1);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1240/930,.1,350),cache=new Map();
 const uniforms={selected:{value:0},focus:{value:new THREE.Vector3()},radius:{value:0},background:{value:new THREE.Vector3(...rgb(paper))},reveal:{value:1},disperse:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,vertexColors:true,depthWrite:true,transparent:false,
 vertexShader:`attribute float component;uniform float selected,radius,reveal,disperse;uniform vec3 focus,background;varying vec3 pigment;varying float presence;
 void main(){float h=fract(sin(dot(position,vec3(12.9898,78.233,37.719)))*43758.5453);presence=smoothstep(h-.025,h+.025,reveal);
 vec3 p=position+disperse*vec3(sin(h*91.1),cos(h*53.7),sin(h*73.3));vec4 mv=modelViewMatrix*vec4(p,1.);
 float chosen=selected<.5?1.:1.-step(.1,abs(component-selected));if(radius>0.)chosen*=1.-smoothstep(radius,radius+.6,distance(position,focus));
 float emph=selected<.5?.92:mix(.095,1.,chosen);pigment=mix(background,color*mix(.92,.64,chosen*step(.5,selected)),emph);
 gl_PointSize=clamp(2.5*52./max(-mv.z,.1),1.6,mix(3.0,5.0,chosen));gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`uniform vec3 background;varying vec3 pigment;varying float presence;void main(){if(presence<.01)discard;float r=length(gl_PointCoord-.5);float a=(1.-smoothstep(.37,.5,r))*presence;if(a<.01)discard;gl_FragColor=vec4(mix(background,pigment,a),1.);}`});
 let active=null;
 function load(id){if(active?.name===id)return; if(active)scene.remove(active);
  if(!cache.has(id)){const d=generateModel(id,2.4,1384,Object.fromEntries(Object.entries(palette).map(([k,v])=>[k,rgb(v)])));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(d.positions,3));g.setAttribute('color',new THREE.BufferAttribute(d.colors,3));g.setAttribute('component',new THREE.BufferAttribute(new Float32Array(d.componentIds),1));g.computeBoundingSphere();const o=new THREE.Points(g,material);o.name=id;cache.set(id,{cloud:o,data:d});}
  active=cache.get(id).cloud;scene.add(active);
 }
 function nearest(id,item){if(item.contour||item.second)return item.anchor;const d=cache.get(id).data;let best=Infinity,point=item.anchor;
  for(let i=0;i<d.componentIds.length;i++){if(d.componentIds[i]!==item.tag)continue;const p=d.positions.subarray(i*3,i*3+3),dist=p.reduce((a,v,k)=>a+(v-item.anchor[k])**2,0);if(dist<best){best=dist;point=Array.from(p);}}
  return point;
 }
 function text(s,x,y,size,{color=ink,sans=false}={}){ctx.fillStyle=color;ctx.font=`${size}px ${sans?'"PingFang SC", sans-serif':'"Songti SC", "STSong", serif'}`;ctx.fillText(s,x,y);}
 function project(p){const v=new THREE.Vector3(...p).project(camera);return[620+(v.x+1)*620,80+(1-v.y)*465];}
 function render(t){if(renderer.getContext().isContextLost())throw Error('图形上下文失效，已停止导出');const s=shotAt(t),{building:b,local,shotDuration}=s;load(b.id);ctx.setTransform(2,0,0,2,0,0);ctx.fillStyle=paper;ctx.fillRect(0,0,1920,1080);
  uniforms.selected.value=0;uniforms.radius.value=0;uniforms.reveal.value=1;uniforms.disperse.value=0;
  let target=new THREE.Vector3(...b.overview.target),offset=new THREE.Vector3(...b.overview.position).sub(target),anchor;
  if(s.kind==='detail'){
   const item=s.item;anchor=nearest(b.id,item);target.fromArray(item.target||anchor);
   offset=new THREE.Vector3(.32,.16,1).normalize().multiplyScalar(item.distance*(1.05-.05*smooth(local/2)));
   offset.applyAxisAngle(new THREE.Vector3(0,1,0),-.035+.07*local/shotDuration);uniforms.selected.value=item.tag;uniforms.focus.value.fromArray(anchor);uniforms.radius.value=item.radius||0;
  }else{offset.applyAxisAngle(new THREE.Vector3(0,1,0),-.12+.24*local/shotDuration);if(s.kind==='intro'){uniforms.reveal.value=.7+.3*smooth(local/2);uniforms.disperse.value=.8*(1-smooth(local/2));}}
  camera.position.copy(target).add(offset);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,620,80,1240,930);
  text(b.title,120,180,62);
  if(s.kind==='detail'){
   const item=s.item;const sz=item.name.length>10?37:46;text(item.name,120,365,sz);
   item.note.forEach((v,i)=>text(v,120,440+i*48,27,{color:'#62635b',sans:true}));
   if(item.contour){ctx.strokeStyle=accent;ctx.lineWidth=1.4;for(const side of[-1,1]){ctx.beginPath();for(let i=0;i<7;i++){const yy=.65+(i===0?0:6.12+(i-1)*4.57),half=6.4-i*.56,p=project([side*half,yy,half]);if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);}ctx.stroke();}}
  }else{ text(s.kind==='intro'?b.subtitle:'由构件，读懂整体',120,280,28,{sans:true,color:accent});b.poem.forEach((v,i)=>text(v,120,435+i*65,32)); }
  const fade=smooth(t/.38)*smooth((192-t)/.6);if(fade<1){ctx.globalAlpha=1-fade;ctx.fillStyle=paper;ctx.fillRect(0,0,1920,1080);ctx.globalAlpha=1;}
  return {canvas,shot:s,anchor:anchor?project(anchor):null};
 }
 function dispose(){for(const {cloud} of cache.values())cloud.geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();}
 return{canvas,render,dispose};
}
