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
const video=document.querySelector('video');
video.addEventListener('error',()=>document.querySelector('#video-error').hidden=false);
video.querySelector('source').addEventListener('error',()=>document.querySelector('#video-error').hidden=false);
