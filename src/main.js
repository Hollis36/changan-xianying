import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateModel, landmarks } from './models.js';

const $=id=>document.getElementById(id);
const stage=$('stage');
let renderer;
try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
} catch {
  $('loading').textContent='当前浏览器未启用 WebGL，请使用支持 WebGL 的浏览器打开作品。';
  document.querySelectorAll('button,input').forEach(el=>el.disabled=true);
}
if(renderer) start();

function start(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const state={building:'bell',mode:1,paused:reduced,rotate:!reduced,density:1,size:1.2,speed:1,seed:1384};
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(38,1,.1,300);
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x080b0b,0);
 renderer.domElement.setAttribute('aria-label','西安建筑三维点云，拖动旋转，滚轮缩放');
 renderer.domElement.setAttribute('role','img');
 stage.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.055;controls.enablePan=false;
 controls.minDistance=16;controls.maxDistance=125;controls.minPolarAngle=.27;controls.maxPolarAngle=Math.PI*.49;
 controls.autoRotate=state.rotate&&!state.paused;controls.autoRotateSpeed=.26;
 const uniforms={uTime:{value:0},uScan:{value:12},uScanning:{value:1},uExplode:{value:0},uSize:{value:1.2},uDpr:{value:renderer.getPixelRatio()}};
 const material=new THREE.ShaderMaterial({
  uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.NormalBlending,
  vertexShader:`uniform float uTime,uScan,uScanning,uExplode,uSize,uDpr;
    varying vec3 vColor;varying float vAlpha;
    float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
    void main(){
      vec3 p=position;float h=hash(p);
      vec3 drift=vec3(sin(h*63.0+uTime*.20),cos(h*37.0+uTime*.17),sin(h*81.0+uTime*.13));
      p+=uExplode*(drift*(2.0+h*6.0)+vec3(p.x*.12,floor(p.y/5.0)*.35,p.z*.12));
      float scan=exp(-pow((position.y-uScan)*2.2,2.0))*uScanning;
      float wake=exp(-abs(position.y-uScan)*.24)*uScanning;
      float light=.80+.16*sin(position.x*.1+position.y*.04);
      vColor=color*light+scan*vec3(.40,.25,.15)+wake*vec3(.07,.09,.075);
      vAlpha=.74+scan*.26;
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_PointSize=clamp(uSize*uDpr*65.0/-mv.z,.65,6.0)+scan*.45;
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`varying vec3 vColor;varying float vAlpha;
    void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;gl_FragColor=vec4(vColor,vAlpha*(1.0-smoothstep(.30,.5,d)));}`
 });
 let cloud,pointTotal=0,active=landmarks[0];
 const modelCache=new Map();
 const ground=new THREE.Group();scene.add(ground);
 const groundPositions=[];
 for(let x=-35;x<=35;x+=1)for(let z=-30;z<=30;z+=1){if((x*x+z*z)<38*38)groundPositions.push(x,-.75,z);}
 const groundGeo=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(groundPositions,3));
 ground.add(new THREE.Points(groundGeo,new THREE.PointsMaterial({size:.035,color:0x4f6659,transparent:true,opacity:.36,depthWrite:false})));
 function ring(radius,color,opacity){
   const pts=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*radius,-.7,Math.sin(a)*radius));}
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity}));scene.add(line);return line;
 }
 ring(19,0x668275,.15);ring(24,0x668275,.08);
 const scanRing=ring(18,0xc17b55,.31);
 const scanPlane=new THREE.Mesh(new THREE.PlaneGeometry(29,29),new THREE.MeshBasicMaterial({color:0x92c8a9,transparent:true,opacity:.015,side:THREE.DoubleSide,depthWrite:false}));
 scanPlane.rotation.x=-Math.PI/2;scene.add(scanPlane);
 const beams=new THREE.Group();scene.add(beams);
 for(let i=0;i<7;i++){
   const a=i/7*Math.PI*2,r=8+(i%3)*3;
   const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.cos(a)*r,42,Math.sin(a)*r),new THREE.Vector3(Math.cos(a)*r*.7,0,Math.sin(a)*r*.7)]);
   beams.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:i%2?0x719482:0xb96750,transparent:true,opacity:.07,depthWrite:false})));
 }
 const rayPoints=[];for(let i=0;i<160;i++){const h=Math.sin(i*923.32)*.5+.5;rayPoints.push(Math.sin(i*4.4)*31,h*42,Math.cos(i*3.71)*26);}
 const dust=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(rayPoints,3)),new THREE.PointsMaterial({size:.065,color:0x749278,transparent:true,opacity:.4,depthWrite:false}));scene.add(dust);

 function restoreCamera(){
   const target=state.building==='gate'?12.5:state.building==='pagoda'?17.2:13.1;
   controls.target.set(0,target,0);
   const narrow=stage.clientWidth/stage.clientHeight<.85;
   const scale=state.building==='gate'?1.40:state.building==='pagoda'?1.19:1.14;
   const offset=new THREE.Vector3(36,17,43).multiplyScalar(scale*(narrow?1.09:1));
   camera.position.copy(controls.target).add(offset);controls.update();
 }
 function resize(){
  const w=stage.clientWidth,h=stage.clientHeight;
  if(!w||!h)return;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
 }
 new ResizeObserver(resize).observe(stage);resize();
 function updatePointCount(){
  const count=Math.floor(pointTotal*state.density);cloud.geometry.setDrawRange(0,count);
  $('pointCount').textContent=count.toLocaleString('en-US');
 }
 function loadBuilding(id,resetCamera=true){
   state.building=id;active=landmarks.find(m=>m.id===id);
   const key=`${id}:${state.seed}`;
   let data=modelCache.get(key);
   if(!data){data=generateModel(id,1.3,state.seed);if(modelCache.size>=6)modelCache.delete(modelCache.keys().next().value);modelCache.set(key,data);}
   if(cloud){scene.remove(cloud);cloud.geometry.dispose();}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(data.colors,3));
   cloud=new THREE.Points(geometry,material);cloud.frustumCulled=false;scene.add(cloud);pointTotal=data.positions.length/3;updatePointCount();
   $('archiveNumber').textContent=`00${landmarks.indexOf(active)+1}`;
   $('buildingName').textContent=active.name;$('englishName').textContent=active.en;
   $('era').replaceChildren(document.createTextNode(active.era+' '));const eraYear=document.createElement('span');eraYear.textContent=active.year;$('era').append(eraYear);
   $('poem').replaceChildren();active.description.split('\n').forEach((line,i)=>{if(i)$('poem').append(document.createElement('br'));$('poem').append(document.createTextNode(line));});
   $('typology').textContent=active.type;$('buildingHeight').textContent=active.height;$('coordinates').textContent=active.coords;
   renderer.domElement.setAttribute('aria-label',`${active.name}三维点云，拖动旋转，滚轮缩放`);
   document.querySelectorAll('[data-building]').forEach(b=>{const selected=b.dataset.building===id;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);});
   if(resetCamera)restoreCamera();
   if(!contextLost)$('loading').hidden=true;
 }
 function setMode(mode){
   state.mode=mode;
   document.querySelectorAll('[data-mode]').forEach(b=>{const selected=+b.dataset.mode===mode;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);});
   $('modeName').textContent=['结构点云','激光扫描','粒子解构'][mode];
   $('scanStatus').textContent=['POINT CLOUD VIEW','LASER SCAN ACTIVE','PARTICLE DISPERSION'][mode];
   $('captionText').textContent=['结构显影 / ARCHITECTURAL POINT CLOUD','程序化点云 / PROCEDURAL POINT CLOUD','粒子解构 / PARTICLE DISPERSION'][mode];
 }
 function setPause(value){
   state.paused=value;controls.autoRotate=state.rotate&&!value;
   $('pauseButton').textContent=value?'▷':'Ⅱ';$('pauseButton').setAttribute('aria-label',value?'播放动画':'暂停动画');$('pauseButton').setAttribute('aria-pressed',value);
 }
 function settingsOpen(open){$('settings').hidden=!open;$('settingsButton').setAttribute('aria-expanded',open);if(open)$('closeSettings').focus();else $('settingsButton').focus();}
 document.querySelectorAll('[data-building]').forEach(b=>b.addEventListener('click',()=>loadBuilding(b.dataset.building)));
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(+b.dataset.mode)));
 $('pauseButton').onclick=()=>setPause(!state.paused);
 $('resetView').onclick=restoreCamera;
 $('detailView').onclick=()=>{
   const target=state.building==='pagoda'?7.5:12.5;
   controls.target.set(0,target,0);
   camera.position.copy(controls.target).add(new THREE.Vector3(19,9,25));
   state.rotate=false;$('autoRotate').checked=false;controls.autoRotate=false;controls.update();
   toast('拖动查看细部，点击“返回全景”恢复视角');
 };
 $('settingsButton').onclick=()=>settingsOpen($('settings').hidden);
 $('closeSettings').onclick=()=>settingsOpen(false);
 $('aboutButton').onclick=()=>{$('aboutDialog').showModal();};$('closeAbout').onclick=()=>$('aboutDialog').close();
 $('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog')){const r=$('aboutDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('aboutDialog').close();}});
 $('density').oninput=e=>{state.density=+e.target.value/100;$('densityValue').textContent=`${e.target.value}%`;updatePointCount();};
 $('pointSize').oninput=e=>{state.size=+e.target.value;uniforms.uSize.value=state.size;$('sizeValue').textContent=state.size.toFixed(1);};
 $('scanSpeed').oninput=e=>{state.speed=+e.target.value;$('speedValue').textContent=`${state.speed.toFixed(1)}×`;};
 $('autoRotate').checked=state.rotate;$('autoRotate').onchange=e=>{state.rotate=e.target.checked;controls.autoRotate=state.rotate&&!state.paused;};
 $('regenerate').onclick=()=>{const value=Number($('seed').value);if(!Number.isInteger(value)||value<0||value>999999){toast('请输入 0 至 999999 之间的整数');return;}state.seed=value;loadBuilding(state.building,false);toast('已按种子 '+value+' 重新生成');};
 $('resetSettings').onclick=()=>{
   state.density=1;state.size=1.2;state.speed=1;state.rotate=!reduced;state.seed=1384;
   $('density').value=100;$('pointSize').value=1.2;$('scanSpeed').value=1;$('autoRotate').checked=state.rotate;$('seed').value=1384;
   $('densityValue').textContent='100%';$('sizeValue').textContent='1.2';$('speedValue').textContent='1.0×';uniforms.uSize.value=1.2;
   setPause(reduced);setMode(1);loadBuilding(state.building);toast('已恢复默认参数');
 };
 $('fullscreenButton').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('此浏览器不支持全屏，可横屏观看');}catch{toast('此浏览器暂不支持全屏显示');}};
 document.addEventListener('fullscreenchange',()=>{$('fullscreenButton').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏');});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('settings').hidden)settingsOpen(false);if(e.code==='Space'&&!['INPUT','BUTTON','TEXTAREA'].includes(document.activeElement.tagName)&&!$('aboutDialog').open){e.preventDefault();setPause(!state.paused);}});
 let toastTimer;
 function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
 let contextLost=false,pausedBeforeLoss=false;
 $('exportButton').onclick=async()=>{
   if(contextLost)return;
   const exportName=`长安显影-${active.name}-${state.seed}.png`;
   $('exportButton').disabled=true;
   const originalAspect=camera.aspect,originalDpr=renderer.getPixelRatio();
   try{
    const poster=document.createElement('canvas');poster.width=2560;poster.height=1800;const ctx=poster.getContext('2d');
    ctx.fillStyle='#080b0b';ctx.fillRect(0,0,2560,1800);
    renderer.setPixelRatio(1);uniforms.uDpr.value=1600/stage.clientHeight;renderer.setSize(1900,1600,false);camera.aspect=1900/1600;camera.updateProjectionMatrix();renderer.render(scene,camera);
    ctx.drawImage(renderer.domElement,600,60,1900,1600);
    ctx.fillStyle='#d4d4c8';ctx.font='52px "Songti SC",serif';ctx.fillText('长安显影',105,150);
    ctx.fillStyle='#c3644e';ctx.font='20px monospace';ctx.fillText(`ARCHIVE 00${landmarks.indexOf(active)+1} / CHANG’AN`,110,530);
    ctx.fillStyle='#dedecf';ctx.font='126px "Songti SC",serif';ctx.fillText(active.name,100,710);
    ctx.fillStyle='#97a68e';ctx.font='19px monospace';ctx.fillText(active.en,110,775);
    ctx.font='24px "Songti SC",serif';active.description.split('\n').forEach((l,i)=>ctx.fillText(l,110,910+i*48));
    ctx.strokeStyle='#344337';ctx.beginPath();ctx.moveTo(105,1645);ctx.lineTo(2455,1645);ctx.stroke();
    ctx.fillStyle='#788d78';ctx.font='18px monospace';ctx.fillText(`${$('pointCount').textContent} POINTS  /  SEED ${state.seed}  /  ${['POINT CLOUD','LASER SCAN','DISPERSION'][state.mode]}`,110,1700);
    ctx.font='20px "Songti SC",serif';ctx.fillText('程序化艺术重构',1845,1700);
    const blob=await new Promise(resolve=>poster.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('PNG encoding failed');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=exportName;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    toast('已导出 2560 × 1800 PNG 画面');
   }catch{toast('导出未完成，请稍后重试');}
   finally{renderer.setPixelRatio(originalDpr);uniforms.uDpr.value=originalDpr;camera.aspect=originalAspect;camera.updateProjectionMatrix();resize();$('exportButton').disabled=contextLost;}
 };
 loadBuilding('bell');setPause(reduced);setMode(1);
 let time=3.6,scanClock=3.6,last=performance.now(),frame=0;
 function animate(now){
   requestAnimationFrame(animate);
   const delta=Math.min((now-last)/1000,.05);last=now;
   if(document.hidden||contextLost)return;
   if(!state.paused){time+=delta;scanClock+=delta*state.speed;}
   uniforms.uTime.value=time;
   const scanY=(scanClock%14)/14*38-2;uniforms.uScan.value=scanY;
   // Mode switches remain usable while the animation is paused.
   const ease=reduced?1:Math.min(1,delta*3);
   uniforms.uExplode.value+=((state.mode===2?1:0)-uniforms.uExplode.value)*ease;
   uniforms.uScanning.value+=((state.mode===1?1:0)-uniforms.uScanning.value)*ease;
   scanRing.position.y=scanY+.7;scanRing.visible=state.mode===1;scanPlane.position.y=scanY;scanPlane.visible=state.mode===1;
   beams.visible=state.mode===1;dust.rotation.y=time*.008;
   controls.update(delta);renderer.render(scene,camera);
   if(frame++%8===0){const percent=Math.round((scanClock%14)/14*100);$('scanPercent').textContent=state.mode===1?`${String(percent).padStart(2,'0')}%`:'—';$('scanBar').style.width=state.mode===1?percent+'%':'0%';}
 }
 requestAnimationFrame(animate);
 renderer.domElement.addEventListener('webglcontextlost',e=>{
   e.preventDefault();contextLost=true;pausedBeforeLoss=state.paused;setPause(true);$('exportButton').disabled=true;
   $('loading').hidden=false;$('loading').textContent='图形上下文已中断，正在等待恢复。';
   const retry=document.createElement('button');retry.textContent='刷新并重新生成 ↗';retry.style.pointerEvents='auto';retry.onclick=()=>location.reload();$('loading').append(retry);
 });
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;$('loading').hidden=true;$('exportButton').disabled=false;setPause(pausedBeforeLoss);toast('图形显示已恢复');});
}
