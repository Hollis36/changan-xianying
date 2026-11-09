import {Muxer,ArrayBufferTarget} from 'mp4-muxer';
import {createFilm} from './film.js';
import {buildings,fps,duration,shots,cutFrames} from './data.js';
const status=document.getElementById('status'),screen=document.getElementById('screen'),choice=document.getElementById('shot');
const middle=(b,i)=>{const s=shots[b*10+(i===undefined?0:i+1)];return(s.startFrame+s.endFrame)/2/fps;};
let film=createFilm(),busy=false;screen.append(film.canvas);film.canvas.style.width='100%';
for(let b=0;b<3;b++){const o=document.createElement('option');o.value=middle(b);o.textContent=`${buildings[b].title} · 整体`;choice.append(o);}
for(let b=0;b<3;b++)for(let i=0;i<8;i++){const o=document.createElement('option');o.value=middle(b,i);o.textContent=`${buildings[b].title} · ${buildings[b].items[i].name}`;choice.append(o);}
function preview(){const r=film.render(+choice.value);status.textContent=`预览：${r.shot.building.title} / ${r.shot.item?.name||'整体'} · 原生4K`;}
choice.onchange=preview;
async function save(blob,name){const r=await fetch('/save/'+encodeURIComponent(name),{method:'POST',headers:{'x-render-token':TOKEN},body:blob});if(!r.ok)throw Error(`保存失败 ${r.status}`);}
const png=canvas=>new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
document.getElementById('stills').onclick=async()=>{if(busy)return;busy=true;try{for(let b=0;b<3;b++)for(let i=0;i<8;i++){film.render(middle(b,i));await save(await png(film.canvas),`${b+1}-${i+1}-${buildings[b].title}-${buildings[b].items[i].name.replaceAll(' · ','-')}.png`);status.textContent=`已保存 ${b*8+i+1}/24 张构件图`;await new Promise(r=>setTimeout(r,0));}for(let b=0;b<3;b++){film.render(middle(b));await save(await png(film.canvas),`${b+1}-0-${buildings[b].title}-整体.png`);}status.textContent='已保存24张构件图与3张整体图';}catch(e){status.textContent=e.message;}finally{busy=false;}};
async function encode(test){if(busy)return;busy=true;document.querySelectorAll('button,select').forEach(b=>b.disabled=true);let encoder,error=null;
 try{await document.fonts.ready;const config={codec:'avc1.640033',width:3840,height:2160,bitrate:40000000,framerate:fps,hardwareAcceleration:'prefer-hardware',avc:{format:'avc'}};if(!(await VideoEncoder.isConfigSupported(config)).supported)throw Error('当前浏览器不支持4K编码');
 const count=(test?12:duration)*fps,muxer=new Muxer({target:new ArrayBufferTarget(),video:{codec:'avc',width:3840,height:2160,frameRate:fps},fastStart:'in-memory'});let chunks=0;encoder=new VideoEncoder({output:(chunk,meta)=>{try{muxer.addVideoChunk(chunk,meta);chunks++;}catch(e){error=e;}},error:e=>error=e});encoder.configure(config);const begin=performance.now();
 for(let i=0;i<count;i++){if(error)throw error;film.render(test?28+i/fps:i/fps);const timestamp=Math.round(i*1e6/fps);const frame=new VideoFrame(film.canvas,{timestamp,duration:Math.round((i+1)*1e6/fps)-timestamp});encoder.encode(frame,{keyFrame:i%60===0||cutFrames.includes(i+(test?28*fps:0))});frame.close();if(encoder.encodeQueueSize>6)await encoder.flush();if(i%15===0){status.textContent=`渲染 ${i+1}/${count} 帧 · ${Math.round((i+1)/count*100)}% · ${Math.round((performance.now()-begin)/1000)}秒`;await new Promise(r=>setTimeout(r,0));}}
 await encoder.flush();if(error)throw error;if(chunks!==count)throw Error('编码帧数不符');muxer.finalize();await save(new Blob([muxer.target.buffer],{type:'video/mp4'}),test?'构件测试-4K-12秒.mp4':'构件详解-4K-无声母版.mp4');status.textContent=`完成：${count}帧 · 3840×2160 · ${fps}fps · ${(muxer.target.buffer.byteLength/1e6).toFixed(1)}MB`;
 }catch(e){status.textContent='失败：'+e.message;}finally{if(encoder?.state!=='closed')encoder?.close();busy=false;document.querySelectorAll('button,select').forEach(b=>b.disabled=false);}}
document.getElementById('test').onclick=()=>encode(true);document.getElementById('export').onclick=()=>encode(false);
document.fonts.ready.then(preview);
