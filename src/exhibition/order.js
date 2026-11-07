import {orderTopics,pagodaLayers,bellColumns,gateView,gateWalls} from './order-data.js';
import {makeOrderOverlay} from './order-scene.js';

const NS='http://www.w3.org/2000/svg';
function svgElement(tag,attributes){const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);return node;}

export function setupOrder({art,onEnter,onExit,onReset,onChange=()=>{}}){
 const $=id=>document.getElementById(id),gallery=document.querySelector('.gallery');
 const overlay=makeOrderOverlay(art.scene),dialog=$('orderDialog');
 let active=false,id='bell',step=0,progress=0;
 const original={saturation:art.uniforms.saturation.value,tint:art.uniforms.inkTint.value.clone()};
 function appearance(enabled){
  art.uniforms.saturation.value=enabled ? .12 : original.saturation;
  art.uniforms.inkTint.value.copy(original.tint);
  for(const cloud of art.scene.children)if(cloud.isPoints)cloud.material.uniforms.emphasis.value=enabled ? .72 : 1;
 }

 function diagram(){
  const svg=$('orderDiagram');svg.replaceChildren();
  const add=(tag,attributes)=>{const n=svgElement(tag,attributes);svg.append(n);return n;};
  const line=(x1,y1,x2,y2,extra={})=>add('line',{x1,y1,x2,y2,...extra});
  const text=(x,y,label)=>{const n=add('text',{x,y});n.textContent=label;};
  if(id==='bell'){
   bellColumns.forEach((_,i)=>{const x=28+i*53;line(x,38,x,110,{class:step===0?'diagram-emphasis':''});add('circle',{cx:x,cy:38,r:2.5});});
   if(step===1)line(28,38,240,38,{class:'diagram-emphasis'});
   else for(let i=0;i<4;i++)line(32+i*53,123,77+i*53,123);
   text(28,158,step===0?'间隔重复':'柱头相接');
  }else if(id==='pagoda'){
   const selected=Math.round(progress*6);
   pagodaLayers.forEach((layer,i)=>{const half=layer.width*6.5,y=135-i*18;
    line(140-half,y,140+half,y,{class:i===selected?'diagram-emphasis':''});
    if(i===selected)add('circle',{cx:140+half,cy:y,r:3});
   });
   if(step===1){for(const sign of [-1,1])add('polyline',{points:pagodaLayers.map((l,i)=>`${140+sign*l.width*6.5},${135-i*18}`).join(' '),class:'diagram-envelope'});}
   text(28,168,`第 ${selected+1} 层`);
  }else{
   const view=gateView(progress),project=([x,z])=>[140+x*3,85+z*1.65];
   for(const wall of gateWalls){const [x,y]=project([wall[0],wall[2]]);add('rect',{x,y,width:(wall[1]-wall[0])*3,height:(wall[3]-wall[2])*1.65,class:'diagram-wall'});}
   add('polygon',{points:[view.origin,...view.boundary].map(p=>project(p).join(',')).join(' '),class:'diagram-field'});
   line(140,45,140,125,{'stroke-dasharray':'2 5'});
   const [cx,cy]=project(view.origin);add('circle',{cx,cy,r:3.5,class:'diagram-observer'});
   text(18,168,'平面视域示意');
  }
 }
 function update(){
  const topic=orderTopics[id];
  [...$('orderSteps').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));
  $('orderCaption').textContent=topic.captions[step];
  $('orderRangeWrap').hidden=id==='bell';
  $('orderRangeLabel').textContent=id==='pagoda'?'选择层级':'沿路径移动';
  $('orderRange').max=id==='pagoda'?'6':'100';
  $('orderRange').value=String(id==='pagoda'?Math.round(progress*6):Math.round(progress*100));
  const state=id==='pagoda'?`第 ${Math.round(progress*6)+1} 层`:progress<.34?'门外':progress>.66?'门内':'门中';
  $('orderPosition').textContent=state;$('orderRange').setAttribute('aria-valuetext',state);
  $('orderDiagram').setAttribute('aria-label',`${topic.name}：${topic.title}，${topic.captions[step]}`);
  diagram();if(active)overlay.show(id,step,progress);
 }
 function setBuilding(next){
  id=next;step=0;progress=0;const topic=orderTopics[id];
  if(dialog.open)dialog.close();
  $('orderBuilding').textContent=topic.name;$('orderTitle').textContent=topic.title;
  $('orderLead').textContent=topic.lead;
  $('orderSteps').replaceChildren();topic.steps.forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{step=i;if(id==='gate')progress=i/2;update();};$('orderSteps').append(b);});
  if(active)appearance(true);update();
 }
 function enter(){
  if(active)return;
  onEnter();active=true;id=art.id;gallery.classList.add('ordering');
  $('orderPanel').hidden=false;$('orderControls').hidden=false;
  $('enterOrder').setAttribute('aria-pressed','true');
  appearance(true);
  setBuilding(id);onReset(orderTopics[id].pose);onChange();$('orderHeading').focus({preventScroll:true});
 }
 function leave(restore=true){
  if(!active)return;
  active=false;overlay.hide();gallery.classList.remove('ordering');
  $('orderPanel').hidden=true;$('orderControls').hidden=true;$('enterOrder').setAttribute('aria-pressed','false');
  appearance(false);
  if(dialog.open)dialog.close();
  onChange();
  if(restore){onExit();$('enterViewing').focus({preventScroll:true});}
 }
 $('enterOrder').onclick=enter;$('exitOrder').onclick=()=>leave();
 $('orderReset').onclick=()=>{step=0;progress=0;update();onReset(orderTopics[id].pose);};
 $('orderRange').oninput=()=>{progress=Number($('orderRange').value)/(id==='pagoda'?6:100);if(id==='gate')step=progress<.34?0:progress>.66?2:1;update();};
 $('openOrderExplanation').onclick=()=>{
  const topic=orderTopics[id];$('orderDialogHeading').textContent=`${topic.name} · ${topic.title}`;
  $('orderFormula').textContent=topic.formula;$('orderDefinition').textContent=topic.definition;
  $('orderExplanation').textContent=topic.explanation;$('orderScope').textContent=topic.scope;
  const values=$('orderValues');values.replaceChildren();values.hidden=id!=='pagoda';
  if(id==='pagoda'){
   const caption=document.createElement('caption');caption.textContent='模型相对层宽 · 第一层 = 1';values.append(caption);
   const header=document.createElement('tr');for(const title of ['层级','相对宽度','与上一层之比']){const th=document.createElement('th');th.scope='col';th.textContent=title;header.append(th);}const thead=document.createElement('thead');thead.append(header);values.append(thead);
   const body=document.createElement('tbody');pagodaLayers.forEach((layer,i)=>{const row=document.createElement('tr');for(const value of [String(i+1),(layer.width/pagodaLayers[0].width).toFixed(3),i?(layer.width/pagodaLayers[i-1].width).toFixed(3):'—']){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);});values.append(body);
  }
  const sources=$('orderSources');sources.replaceChildren();for(const source of topic.sources){
   const article=document.createElement('article'),link=document.createElement('a'),note=document.createElement('p');link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.title+' ↗';note.textContent=source.note;article.append(link,note);sources.append(article);
  }
  dialog.showModal();
 };
 $('closeOrderExplanation').onclick=()=>dialog.close();
 return {get active(){return active;},get modalOpen(){return dialog.open;},get pose(){return orderTopics[id].pose;},setBuilding,leave};
}
