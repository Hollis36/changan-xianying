import * as THREE from 'three';
import { landmarks } from '../models.js';
import { makeArtwork } from './scene.js';
import { views } from './views.js';
import { galleryColors, galleryArtwork } from './theme.js';

const {paper,foreground,muted}=galleryColors;
function label(ctx,text,x,y,size,color=foreground,serif=true){ctx.fillStyle=color;ctx.font=`${size}px ${serif?'"Songti SC", "STSong", serif':'monospace'}`;ctx.fillText(text,x,y);}
function rule(ctx,x,y,w){ctx.strokeStyle=galleryColors.rule;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();}
function createPrint(width,height){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('无法创建海报画布');ctx.fillStyle=paper;ctx.fillRect(0,0,width,height);
 return {canvas,ctx};
}
function withRenderer(callback){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setClearColor(paper,0);
 const art=makeArtwork(renderer,galleryArtwork);
 try{return callback(renderer,art);}finally{art.dispose();renderer.dispose();renderer.forceContextLoss();}
}
export function makePoster(id,pose,detail='全景'){
 return withRenderer((renderer,art)=>{
  const {canvas,ctx}=createPrint(1600,2000),item=landmarks.find(x=>x.id===id),n=landmarks.indexOf(item)+1;
  label(ctx,'长安显影',90,110,35);label(ctx,`0${n} / 03`,1370,108,20,muted,false);rule(ctx,90,150,1420);
  label(ctx,item.name,87,306,104);label(ctx,`${item.era}  /  ${item.year}`,94,363,20,muted);
  renderer.setSize(1500,1310);art.load(id);art.pose(pose,1500/1310);art.uniforms.pointScale.value=1.35;art.draw();
  ctx.drawImage(renderer.domElement,50,390);
  rule(ctx,90,1740,1420);
  if(detail==='全景'){
   const poem=views[id].poem;
   [poem.slice(0,2).join(''),poem.slice(2).join('')].forEach((line,i)=>label(ctx,line,90,1795+i*42,24,foreground));
  }else label(ctx,detail,90,1813,24,foreground);
  label(ctx,item.en,90,1892,16,muted,false);label(ctx,'程序化艺术重构',1320,1892,17,muted);
  return canvas;
 });
}
export function makeTriptych(){
 return withRenderer((renderer,art)=>{
  const {canvas,ctx}=createPrint(3600,1800);
  label(ctx,'长安三景',110,169,86);label(ctx,'长安显影  /  西安古建 · 点云艺术',2700,148,24,muted);rule(ctx,110,240,3380);
  renderer.setSize(1120,1120);art.uniforms.pointScale.value=1.3;
  landmarks.forEach((item,i)=>{
   const x=110+i*1160;
   art.overview(item.id,1);art.draw();ctx.drawImage(renderer.domElement,x-10,310);
   label(ctx,`0${i+1}`,x,1450,19,muted,false);label(ctx,item.name,x+65,1456,54);
   label(ctx,views[item.id].word,x+937,1453,27,muted);
   rule(ctx,x,1505,1060);
   views[item.id].poem.forEach((line,j)=>label(ctx,line,x,1548+j*35,25,muted));
   label(ctx,item.en,x,1698,15,muted,false);
  });
  label(ctx,'程序化艺术重构',3290,1745,19,muted);
  return canvas;
 });
}
export async function downloadCanvas(canvas,name){
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
