import {setupNetworkMonitor} from './network.js?v=network-1';
import {setupPlayer} from './player.js?v=network-1';
const share=document.querySelector('#share');
const dialog=document.querySelector('#share-dialog');
const field=document.querySelector('#share-url');
const feedback=document.querySelector('#share-feedback');
share.addEventListener('click',async()=>{
 dialog.showModal();field.focus();field.select();
 try{await navigator.clipboard.writeText(field.value);feedback.textContent='链接已复制，可以直接分享。';}
 catch{feedback.textContent='请选中下方网址复制分享。';}
});
document.querySelector('#close-share').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>share.focus());
const video=document.querySelector('video'),quality=document.querySelector('#video-quality');
const player=setupPlayer(video,quality,document.querySelector('#video-error'));
setupNetworkMonitor(video,quality,{summary:document.querySelector('#network-summary'),current:document.querySelector('#network-current'),device:document.querySelector('#network-device'),measurements:document.querySelector('#network-results'),retest:document.querySelector('#network-retest')},player);
