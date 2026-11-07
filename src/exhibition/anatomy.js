import {anatomyParts,anatomySources} from './anatomy-data.js';

export function setupAnatomy({art,stage,canvas,reduced,onEnter,onExit,onReset,onChange=()=>{}}){
 const $=id=>document.getElementById(id),gallery=document.querySelector('.gallery');
 let active=false,selected=null,spread=0,targetSpread=1,isolate=false;
 const panel=$('anatomyPanel'),dialog=$('sourcesDialog');
 function update(){
  const part=anatomyParts.find(p=>p.id===selected);
  $('partTitle').textContent=part?part.lead:'从屋顶，看到台基。';
  $('partText').textContent=part?part.text:'将屋面、木构与台基分开观看。点选一组，看看它在整座钟楼中的位置。';
  $('partEnglish').textContent=part?part.en:'THREE GROUPS / ONE BUILDING';
  $('partFact').textContent=part?part.fact:'两层楼身，三重屋檐。先辨轮廓，再看构件。';
  $('partExplanation').style.setProperty('--part-accent',part?.color||'#b97963');
  for(const button of $('partButtons').children)button.setAttribute('aria-pressed',String(Number(button.dataset.part)===selected));
  $('isolatePart').disabled=selected===null;$('isolatePart').setAttribute('aria-pressed',String(isolate));
  $('isolatePart').textContent=isolate?'显示其他构件':'只看这一组';
  $('spreadParts').setAttribute('aria-pressed',String(targetSpread===1));
  $('spreadParts').textContent=targetSpread===1?'合拢构件':'展开构件';
  $('anatomyStatus').textContent=part?`当前：${part.name}${isolate?' · 单独观看':''}`:'三组构件 · 点击点云查看讲解';
  art.setStudy({enabled:active,spread,selected,isolate});
 }
 for(const part of anatomyParts){
  const b=document.createElement('button');b.type='button';b.dataset.part=part.id;b.style.setProperty('--part-color',part.color);
  const n=document.createElement('small');n.textContent=`0${part.id+1}`;
  const name=document.createElement('span');name.textContent=part.name;b.append(n,name);b.onclick=()=>select(part.id);$('partButtons').append(b);
 }
 function select(id){if(!active)return;selected=id;update();}
 function enter(){
  if(active||art.id!=='bell')return;
  active=true;selected=null;isolate=false;spread=0;targetSpread=1;
  gallery.classList.add('studying');panel.hidden=false;$('anatomyControls').hidden=false;
  if(reduced)spread=targetSpread;update();onEnter();onChange();$('studyHeading').focus({preventScroll:true});
 }
 function leave(restore=true){
  if(!active)return;active=false;spread=0;selected=null;isolate=false;art.setStudy({enabled:false});
  gallery.classList.remove('studying');panel.hidden=true;$('anatomyControls').hidden=true;
  if(dialog.open)dialog.close();onChange();
  if(restore){onExit();$('enterViewing').focus({preventScroll:true});}
 }
 $('enterStudy').onclick=enter;$('exitStudy').onclick=()=>leave();
 $('spreadParts').onclick=()=>{targetSpread=1-targetSpread;if(reduced)spread=targetSpread;update();};
 $('isolatePart').onclick=()=>{if(selected===null)return;isolate=!isolate;update();};
 $('resetStudy').onclick=()=>{selected=null;isolate=false;targetSpread=1;if(reduced)spread=1;update();onReset();};
 $('openSources').onclick=()=>{
  const part=anatomyParts.find(p=>p.id===selected),keys=part?part.sources:Object.keys(anatomySources);
  $('sourcesSubtitle').textContent=part?part.name:'一座钟楼，如何组成';
  $('modelScope').textContent=part?part.model:'三组划分服务于观看与讲解，不是传统建筑的完整分类，也不表示施工或拆解顺序。模型比例、构件数量与纹样均有简化，非实测重建。';
  const list=$('sourceList');list.replaceChildren();
  for(const key of keys){
   const source=anatomySources[key],article=document.createElement('article');
   const meta=document.createElement('p');meta.className='source-meta';meta.textContent=`${source.type} · ${source.date}`;
   const title=document.createElement('h3'),link=document.createElement('a');link.textContent=source.title+' ↗';link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';title.append(link);
   const by=document.createElement('p');by.className='source-by';by.textContent=source.publisher;
   const support=document.createElement('p');support.textContent=source.supports;
   const book=document.createElement('p');book.className='source-book';book.textContent=source.bibliographic;
   article.append(meta,title,by,support,book);list.append(article);
  }
  dialog.showModal();
 };
 $('closeSources').onclick=()=>dialog.close();
 // OrbitControls still receives the gesture. Only a short, single-pointer tap selects a component.
 let gesture=null;const pointers=new Set();
 canvas.addEventListener('pointerdown',e=>{
  pointers.add(e.pointerId);
  if(!active||e.button!==0||pointers.size!==1){gesture=null;return;}
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),moved:false};
 });
 canvas.addEventListener('pointermove',e=>{if(gesture?.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>6)gesture.moved=true;});
 canvas.addEventListener('pointerup',e=>{
  pointers.delete(e.pointerId);const g=gesture;gesture=null;
  if(!active||!g||g.id!==e.pointerId||g.moved||performance.now()-g.time>600||Math.hypot(e.clientX-g.x,e.clientY-g.y)>6)return;
  const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*2-1,y=1-(e.clientY-rect.top)/rect.height*2;
  const part=art.pickPart(x,y);if(part!==null)select(part);
 });
 canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);gesture=null;});
 canvas.addEventListener('lostpointercapture',e=>{pointers.delete(e.pointerId);});
 function tick(delta){if(!active)return;const next=reduced?targetSpread:spread+(targetSpread-spread)*Math.min(1,delta*7);spread=Math.abs(next-targetSpread)<.001?targetSpread:next;art.setStudy({enabled:true,spread,selected,isolate});}
 return {get active(){return active;},get modalOpen(){return dialog.open;},leave,tick};
}
