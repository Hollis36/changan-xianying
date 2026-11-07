import * as THREE from 'three';
import {makeArtwork} from '../scene.js';
import {places,gates,project,pixelsPerKm,distanceKm} from './data.js';
import {galleryColors,galleryArtwork} from '../theme.js';

// A restrained atlas palette. Geographic anchors and scale remain unchanged.
const {paper,foreground:ink,muted,accent:axis}=galleryColors,lineInk='#9a998c';
export function makeGeography(){
 const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=2200;
 const c=canvas.getContext('2d');if(!c)throw Error('无法生成地理图');
 c.fillStyle=paper;c.fillRect(0,0,1800,2200);
 const text=(s,x,y,size=24,color=ink,serif=false)=>{c.fillStyle=color;c.font=`${size}px ${serif?'"Songti SC", "STSong", serif':'"PingFang SC", "Microsoft YaHei", sans-serif'}`;c.fillText(s,x,y);};
 const line=(points,color=lineInk,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const dot=(x,y,r=6)=>{c.fillStyle=ink;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const geoLine=(pts,color,width)=>line(pts.map(([lon,lat])=>project(lon,lat)),color,width);
 text('长安显影',110,102,25,muted,true);
 text('中轴与三景',106,228,72,ink,true);
 text('西安',1600,225,26,muted,true);

 // Four-gate envelope: schematic context, not a surveyed boundary.
 const west=gates[1].lon,east=gates[2].lon,north=gates[0].lat,south=places[1].lat;
 const [wx,ny]=project(west,north),[ex,sy]=project(east,south);
 c.fillStyle='#292d2905';c.fillRect(wx,ny,ex-wx,sy-ny);
 line([[wx,ny],[ex,ny],[ex,sy],[wx,sy],[wx,ny]],lineInk,3);
 text('西安城墙',wx+36,ny+58,25,muted,true);
 geoLine([[west,places[0].lat],[places[0].lon,places[0].lat],[east,gates[2].lat]],galleryColors.rule,1);
 text('西大街',wx+147,project(0,places[0].lat)[1]-22,20,muted);
 text('东大街',1055,project(0,places[0].lat)[1]-22,20,muted);
 const axisX=project(places[0].lon,0)[0];
 line([[axisX,405],[axisX,1775]],axis,1.5);
 const vertical=(s,x,y,size=21,color=muted)=>[...s].forEach((ch,i)=>text(ch,x,y+i*(size+10),size,color));
 vertical('南大街',axisX+26,895,18);
 vertical('南北中轴',axisX-43,1260,23,axis);
 text('长安路方向',axisX+25,1775,20,muted);

 // One compass, one scale: no repeated direction labels or ornament.
 line([[1570,500],[1570,416]],muted,1.5);line([[1559,435],[1570,416],[1581,435]],muted,1.5);
 text('北',1558,394,23,muted,true);
 for(const [i,g] of gates.entries()){
  const [x,y]=project(g.lon,g.lat);c.fillStyle=paper;c.fillRect(x-6,y-6,12,12);c.strokeStyle=muted;c.lineWidth=1;c.strokeRect(x-6,y-6,12,12);
  const name=g.name.split(' · ')[0];
  if(i===0)text(name,x+24,y-23,23,muted,true);
  if(i===1)text(name,x-100,y+9,23,muted,true);
  if(i===2)text(name,x+24,y+9,23,muted,true);
 }
 const anchors=places.map(p=>project(p.lon,p.lat)),[bell,gate,pagoda]=anchors;
 // Portraits use the same neutral ink; coordinates stay in the source panel.
 const cards=[{x:110,y:565,w:300,h:260},{x:110,y:1050,w:340,h:250},{x:1360,y:1330,w:300,h:330}];
 let renderer,art;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setClearColor(paper,1);
  art=makeArtwork(renderer,{...galleryArtwork,saturation:0});art.uniforms.pointScale.value=1.45;
  places.forEach((p,i)=>{const box=cards[i];renderer.setSize(box.w*2,box.h*2);art.overview(p.id,box.w/box.h);art.draw();c.drawImage(renderer.domElement,box.x,box.y,box.w,box.h);});
 }finally{art?.dispose();renderer?.dispose();renderer?.forceContextLoss();}
 line([[430,825],[590,825],[650,bell[1]],bell]);
 line([[460,1195],[625,1195],[740,gate[1]],gate]);
 line([[1365,1630],[1290,1630],pagoda]);
 const captions=[[145,878],[145,1345],[1400,1710]];
 places.forEach((p,i)=>{const [x,y]=anchors[i],[tx,ty]=captions[i];dot(x,y);text(p.name,tx,ty,42,ink,true);});
 text('大慈恩寺',pagoda[0]-44,pagoda[1]-34,21,muted,true);

 // Keep the standalone image self-describing; full methodology lives in the page.
 line([[110,1915],[1690,1915]],galleryColors.rule);
 text('直线距离',110,1980,21,muted);
 text(`钟楼 — 永宁门  ${distanceKm(places[0],places[1]).toFixed(1)} km`,110,2027,26,ink,true);
 text(`永宁门 — 大雁塔  ${distanceKm(places[1],places[2]).toFixed(1)} km`,110,2070,26,ink,true);
 line([[1480,2010],[1480+pixelsPerKm,2010]],muted,2);
 for(const x of [1480,1480+pixelsPerKm])line([[x,2004],[x,2016]],muted,1);
 text('0',1476,2052,19,muted);text('1 km',1605,2052,19,muted);
 text('地理示意 · 城墙与道路概括，建筑图形不按比例。',110,2155,19,muted);
 text('资料：维基百科、Mapcarta、三秦都市报',1100,2155,17,muted);
 return canvas;
}
