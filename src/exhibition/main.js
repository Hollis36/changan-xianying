import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { landmarks } from '../models.js';
import { views } from './views.js';
import { setupAnatomy } from './anatomy.js';
import { anatomyOverview } from './anatomy-data.js';
import { makeArtwork } from './scene.js';
import { makePoster, makeTriptych, downloadCanvas } from './print.js';
import { setupGeography } from './geography/ui.js';
import { setupOrder } from './order.js';
import { galleryArtwork, galleryColors } from './theme.js';
import { setupMusic } from './music.js';
import { setupShare } from './share.js';

const $=id=>document.getElementById(id),stage=$('stage');
setupShare();
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});}
catch{$('loading').textContent='浏览器未启用 WebGL，请使用支持 WebGL 的浏览器观看。';document.querySelectorAll('button').forEach(b=>b.disabled=true);}
if(renderer)start();
function start(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),2));renderer.setClearColor(galleryColors.paper,0);stage.append(renderer.domElement);
 renderer.domElement.setAttribute('role','img');
 const art=makeArtwork(renderer,galleryArtwork),camera=art.camera;
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=9;controls.maxDistance=130;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.49;controls.autoRotateSpeed=.18;
 let active='bell',detail=-1,transition=null,contextLost=false,exporting=false,collectionReady=false;
 const syncExportButtons=()=>{for(const id of ['poster','triptych','enterViewing','enterStudy','enterOrder'])$(id).disabled=exporting||contextLost||(id==='enterStudy'&&active!=='bell');};
 let order=null;
 function syncNavigation(){
  $('enterViewing').setAttribute('aria-pressed',String(!study.active&&!order?.active));
  $('enterStudy').setAttribute('aria-pressed',String(study.active));
  $('enterOrder').setAttribute('aria-pressed',String(!!order?.active));
  syncExportButtons();
 }
 let noticeTimer;
 function notice(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),4000);}
 setupMusic({audio:$('backgroundMusic'),button:$('musicToggle'),notice});
 function setOrbit(value){controls.autoRotate=value;$('orbit').setAttribute('aria-pressed',String(value));$('orbit').innerHTML=value?'停止环绕 <span>Ⅱ</span>':'缓慢环绕 <span>↻</span>';}
 function cancelTransition(){transition=null;controls.enableDamping=true;setOrbit(false);}
 controls.addEventListener('start',cancelTransition);
 function responsivePose(pose){
  const position=new THREE.Vector3(...pose.position),target=new THREE.Vector3(...pose.target);
  // Narrow viewports pull back, preserving the full building silhouette.
  const minimumAspect=active==='gate'?1.12:.8;
  if(detail===-1&&camera.aspect<minimumAspect)position.sub(target).multiplyScalar(minimumAspect/camera.aspect).add(target);
  return {position,target};
 }
 function goTo(pose,instant=false){
  const to=responsivePose(pose);setOrbit(false);
  controls.enableDamping=false;controls.update();
  if(instant||reduced){camera.position.copy(to.position);controls.target.copy(to.target);controls.update();controls.enableDamping=true;transition=null;return;}
  transition={from:camera.position.clone(),fromTarget:controls.target.clone(),...to,elapsed:0};
 }
 function setDetail(index,instant=false){
  detail=index;const data=views[active],view=index<0?data.overview:data.details[index];
  $('viewName').textContent=index<0?'全景':view.name;
  $('viewText').textContent=index<0?'拖动转动建筑，滚轮拉近细部。':view.text;
  document.querySelector('.label').classList.toggle('detail-active',index>=0);
  $('overview').setAttribute('aria-pressed',String(index<0));
  [...$('details').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  goTo(view,instant);
 }
 const study=setupAnatomy({art,stage,canvas:renderer.domElement,reduced,
  onEnter(){order?.leave(false);detail=-1;transition=null;setOrbit(false);resize();},
  onExit(){setDetail(-1,true);resize();},
  onReset(){transition=null;setOrbit(false);goTo(anatomyOverview,true);},onChange:syncNavigation
 });
 order=setupOrder({art,
  onEnter(){study.leave(false);detail=-1;transition=null;setOrbit(false);},
  onExit(){setDetail(-1,true);resize();},
  onReset(pose){transition=null;setOrbit(false);goTo(pose,true);},onChange:syncNavigation
 });
 function choose(id){
  study.leave(false);
  active=id;const item=landmarks.find(m=>m.id===id),data=views[id];art.load(id);
  $('number').textContent=`0${landmarks.indexOf(item)+1}`;$('name').textContent=item.name;$('english').textContent=item.en;$('era').textContent=`${item.era} / ${item.year}`;
  $('description').replaceChildren();data.poem.forEach((line,i)=>{if(i)$('description').append(document.createElement('br'));$('description').append(document.createTextNode(line));});
  $('concept').replaceChildren();[...data.word].forEach((word,i)=>{if(i)$('concept').append(document.createElement('br'));$('concept').append(word);});
  $('details').replaceChildren();data.details.forEach((view,i)=>{const button=document.createElement('button');button.textContent=view.name;button.onclick=()=>setDetail(i);$('details').append(button);});
  document.querySelectorAll('[data-building]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.building===id)));
  renderer.domElement.setAttribute('aria-label',`${item.name}三维点云，拖动旋转，滚轮缩放`);setDetail(-1,true);
  order.setBuilding(id);if(order.active)goTo(order.pose,true);
  syncNavigation();
  if(!contextLost)$('loading').hidden=true;
 }
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(art.id&&(detail<0||study.active))goTo(order?.active?order.pose:study.active?anatomyOverview:views[active].overview,true);}
 new ResizeObserver(resize).observe(stage);resize();choose(active);
 const geography=setupGeography({onSelect:choose,notice});
 const menu=$('moreMenu'),menuSummary=menu.querySelector('summary');
 const closeMenu=()=>{menu.open=false;};
 menu.querySelector('.more-content').addEventListener('click',e=>{if(e.target.closest('button')){closeMenu();menuSummary.focus({preventScroll:true});}});
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){closeMenu();menuSummary.focus({preventScroll:true});e.preventDefault();}});
 for(const id of ['collectionDialog','aboutDialog'])$(id).addEventListener('close',()=>menuSummary.focus({preventScroll:true}));
 $('geographyDialog').addEventListener('close',()=>{
  const id=$('geographyDialog').returnValue;
  const selected=landmarks.some(item=>item.id===id)?document.querySelector(`[data-building="${id}"]`):null;
  (selected||menuSummary).focus({preventScroll:true});
 });
 $('openAbout').onclick=()=>$('aboutDialog').showModal();$('closeAbout').onclick=()=>$('aboutDialog').close();
 function viewArtwork(){study.leave(false);order.leave(false);setDetail(-1,true);resize();syncNavigation();}
 $('enterViewing').onclick=viewArtwork;
 document.querySelector('.wordmark').onclick=e=>{e.preventDefault();viewArtwork();};
 document.querySelectorAll('[data-building]').forEach(b=>b.onclick=()=>choose(b.dataset.building));
 $('overview').onclick=()=>setDetail(-1);$('orbit').onclick=()=>{transition=null;controls.enableDamping=true;setOrbit(!controls.autoRotate);};
 $('poster').onclick=async()=>{
  if(exporting||contextLost)return;exporting=true;syncExportButtons();
  const id=active,pose={position:camera.position.toArray(),target:controls.target.toArray()},view=detail<0?'全景':views[id].details[detail].text;
  try{await document.fonts.ready;const canvas=makePoster(id,pose,view);await downloadCanvas(canvas,`长安显影-展览版-${landmarks.find(m=>m.id===id).name}.png`);notice('已保存 1600 × 2000 作品海报');}
  catch(e){notice('海报未能生成，请稍后重试');}
  finally{exporting=false;syncExportButtons();}
 };
 $('triptych').onclick=async()=>{
  if(exporting||contextLost)return;exporting=true;syncExportButtons();
  try{await document.fonts.ready;if(!collectionReady){const canvas=makeTriptych();$('collectionCanvas').getContext('2d').drawImage(canvas,0,0);collectionReady=true;}$('collectionDialog').showModal();}
  catch(e){notice('三景横幅未能生成，请稍后重试');}
  finally{exporting=false;syncExportButtons();}
 };
 $('closeCollection').onclick=()=>$('collectionDialog').close();
 $('downloadCollection').onclick=async()=>{const button=$('downloadCollection');button.disabled=true;try{await downloadCanvas($('collectionCanvas'),'长安显影-长安三景.png');notice('已保存 3600 × 1800 三景横幅');}catch{notice('下载未完成，请稍后重试');}finally{button.disabled=false;}};
 let previous=performance.now();
 function frame(now){requestAnimationFrame(frame);const delta=Math.min(.05,(now-previous)/1000);previous=now;if(document.hidden||contextLost||$('collectionDialog').open||$('aboutDialog').open||study.modalOpen||order.modalOpen||geography.open)return;
  study.tick(delta);
  if(transition){transition.elapsed+=delta;const t=Math.min(1,transition.elapsed),ease=t*t*(3-2*t);camera.position.lerpVectors(transition.from,transition.position,ease);controls.target.lerpVectors(transition.fromTarget,transition.target,ease);if(t===1){transition=null;controls.enableDamping=true;}}
  controls.update(delta);art.draw(controls.target);
 }
 requestAnimationFrame(frame);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;setOrbit(false);$('loading').hidden=false;$('loading').textContent='图形显示暂时中断，正在等待恢复。';syncExportButtons();});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;$('loading').hidden=true;syncExportButtons();notice('图形显示已恢复');});
}
