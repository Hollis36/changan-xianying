import * as THREE from 'three';
import { generateModel } from '../models.js';
import { views } from './views.js';
import { anatomyParts } from './anatomy-data.js';

export function makeArtwork(renderer,{saturation=.78,tint=[1,1,1],background=[.062745,.074510,.070588],palette,lightPaper=false}={}){
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(36,1,.1,300);
 const uniforms={pixelRatio:{value:renderer.getPixelRatio()},pointScale:{value:1.12},focusDistance:{value:65},saturation:{value:saturation},inkTint:{value:new THREE.Vector3(...tint)},paperInk:{value:new THREE.Vector3(...background)},lightPaper:{value:Number(lightPaper)}};
 const material=new THREE.ShaderMaterial({uniforms:{...uniforms,emphasis:{value:1}},vertexColors:true,transparent:false,depthWrite:true,
  vertexShader:`uniform float pixelRatio,pointScale,focusDistance,emphasis,saturation,lightPaper; uniform vec3 inkTint,paperInk; varying vec3 ink;
   void main(){vec4 mv=modelViewMatrix*vec4(position,1.);
    float depth=clamp(((-mv.z)-focusDistance+12.)/36.,0.,1.);
    float luminance=dot(color,vec3(.2126,.7152,.0722));
    vec3 pigment=mix(vec3(luminance),color,saturation)*inkTint;
    vec3 darkInk=pigment*mix(1.24,.33,depth)*emphasis;
    // On paper, distant and unselected parts recede into the background.
    vec3 paperColor=mix(paperInk,mix(pigment,paperInk,mix(.04,.48,depth)),emphasis);
    ink=mix(darkInk,paperColor,lightPaper);
    // Keep near-view grains fine; size limits are in CSS pixels.
    gl_PointSize=clamp(pointScale*pixelRatio*65./max(-mv.z,.1),1.*pixelRatio,2.2*pixelRatio);
    gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 paperInk;varying vec3 ink;void main(){
   float radius=length(gl_PointCoord-.5);
   float feather=clamp(fwidth(radius)*.35,.035,.12);
   float coverage=1.-smoothstep(.46-feather,.5,radius);
   if(coverage<.01)discard;
   // Opaque ink keeps exports and non-MSAA contexts consistent.
   gl_FragColor=vec4(mix(paperInk,ink,coverage),1.);
  }`
 });
 const cache=new Map(),raycaster=new THREE.Raycaster();let clouds=[],id='bell';
 raycaster.params.Points.threshold=.22;
 function load(next){
  id=next;let entries=cache.get(id);
  if(!entries){
   const data=generateModel(id,1.3,1384,palette),groups=id==='bell'?[0,1,2]:[-1];
   entries=groups.map(partId=>{
    const count=partId<0?data.partIds.length:data.partIds.reduce((n,p)=>n+Number(p===partId),0);
    const positions=new Float32Array(count*3),colors=new Float32Array(count*3);let j=0;
    for(let i=0;i<data.partIds.length;i++)if(partId<0||data.partIds[i]===partId){positions.set(data.positions.subarray(i*3,i*3+3),j);colors.set(data.colors.subarray(i*3,i*3+3),j);j+=3;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeBoundingSphere();
    const ink=material.clone();ink.uniforms={...uniforms,emphasis:{value:1}};
    const cloud=new THREE.Points(geometry,ink);cloud.userData.partId=partId;return cloud;
   });cache.set(id,entries);
  }
  for(const cloud of clouds)scene.remove(cloud);clouds=entries;for(const cloud of clouds)scene.add(cloud);setStudy({enabled:false});
 }
 function setStudy({enabled=false,spread=0,selected=null,isolate=false}){
  const teaching=enabled&&id==='bell';
  for(const cloud of clouds){const p=cloud.userData.partId,chosen=selected===null||selected===p;
   cloud.position.y=teaching?anatomyParts[p].offset*THREE.MathUtils.clamp(spread,0,1):0;
   cloud.visible=!teaching||!isolate||chosen;
   cloud.material.uniforms.emphasis.value=teaching&&!chosen?.24:1;
  }
 }
 function pickPart(x,y){
  if(id!=='bell')return null;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
  const hit=raycaster.intersectObjects(clouds.filter(c=>c.visible),false)[0];
  return hit?hit.object.userData.partId:null;
 }
 function pose(config,aspect=1){
  camera.aspect=aspect;camera.position.fromArray(config.position);camera.lookAt(new THREE.Vector3(...config.target));camera.updateProjectionMatrix();
  uniforms.focusDistance.value=camera.position.distanceTo(new THREE.Vector3(...config.target));
 }
 function draw(target){uniforms.pixelRatio.value=renderer.getPixelRatio();if(target)uniforms.focusDistance.value=camera.position.distanceTo(target);renderer.render(scene,camera);}
 function overview(next,aspect){load(next);pose(views[next].overview,aspect);}
 function dispose(){for(const entries of cache.values())for(const cloud of entries){cloud.geometry.dispose();cloud.material.dispose();}material.dispose();}
 return {scene,camera,uniforms,load,pose,draw,overview,dispose,setStudy,pickPart,get id(){return id;}};
}
