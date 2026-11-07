import {makeGeography} from './map.js';
import {downloadCanvas} from '../print.js';
export function setupGeography({onSelect,notice}){
 const $=id=>document.getElementById(id),dialog=$('geographyDialog');let ready=false,busy=false;
 $('openGeography').onclick=async()=>{
  if(busy)return;busy=true;$('openGeography').disabled=true;
  try{
   await document.fonts.ready;
   if(!ready){const canvas=makeGeography();$('geographyCanvas').getContext('2d').drawImage(canvas,0,0);ready=true;}
   $('geographyStatus').textContent='';document.querySelector('.geography-viewport').classList.remove('zoomed');$('zoomGeography').setAttribute('aria-pressed','false');$('zoomGeography').textContent='放大细看';dialog.returnValue='';dialog.showModal();
  }catch{notice('地理图未能生成，请稍后重试');}
  finally{busy=false;$('openGeography').disabled=false;}
 };
 $('closeGeography').onclick=()=>dialog.close();
 $('zoomGeography').onclick=()=>{const zoomed=document.querySelector('.geography-viewport').classList.toggle('zoomed');$('zoomGeography').setAttribute('aria-pressed',String(zoomed));$('zoomGeography').textContent=zoomed?'还原全图':'放大细看';};
 $('saveGeography').onclick=async()=>{
  const button=$('saveGeography');button.disabled=true;
  $('geographyStatus').textContent='正在保存地理图…';
  try{await downloadCanvas($('geographyCanvas'),'长安显影-中轴与三景-地理图.png');$('geographyStatus').textContent='已保存 1800 × 2200 地理图';}
  catch{$('geographyStatus').textContent='地理图未能保存，请重试';}finally{button.disabled=false;}
 };
 document.querySelectorAll('[data-map-building]').forEach(button=>button.onclick=()=>{dialog.close(button.dataset.mapBuilding);onSelect(button.dataset.mapBuilding);document.querySelector('header').scrollIntoView({block:'start'});});
 return {get open(){return dialog.open;}};
}
