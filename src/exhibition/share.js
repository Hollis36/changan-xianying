export const SHARE_URL='https://hollis36.github.io/changan-xianying/exhibition/';
export function setupShare(){
 const $=id=>document.getElementById(id);
 const button=$('copyShare'),dialog=$('shareDialog'),message=$('shareMessage'),field=$('shareLink');
 $('shareStatus').textContent='↗';button.title='复制展览网址';
 async function copy(){
  field.value=SHARE_URL;$('shareField').hidden=false;$('retryShare').hidden=false;
  if(!dialog.open)dialog.showModal();field.focus();field.select();
  try{await navigator.clipboard.writeText(SHARE_URL);message.textContent='已复制展览链接，可以直接分享。';}
  catch{message.textContent='请选中下方网址复制分享。';}
 }
 button.addEventListener('click',copy);$('retryShare').addEventListener('click',copy);
 $('closeShare').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>$('moreMenu').querySelector('summary').focus({preventScroll:true}));
}
