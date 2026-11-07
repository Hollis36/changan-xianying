import test from 'node:test';
import assert from 'node:assert/strict';
import {setupPlayer} from '../site/player.js';
function fixture(paused) {
  const source=new EventTarget();source.src='original';
  const video=Object.assign(new EventTarget(),{currentTime:42,duration:126,paused,ended:false,plays:0,querySelector:()=>source,load(){this.currentTime=0;this.paused=true;},play(){this.plays++;this.paused=false;return Promise.resolve();}});
  const quality=Object.assign(new EventTarget(),{value:'1080p'}),message={hidden:true};
  setupPlayer(video,quality,message);return {source,video,quality,message};
}
test('quality change restores the playhead and resumes an active film',async()=>{
  const {source,video,quality}=fixture(false);
  quality.dispatchEvent(new Event('change'));assert.equal(source.src,'assets/film.mp4');assert.equal(video.currentTime,0);
  video.dispatchEvent(new Event('loadedmetadata'));await Promise.resolve();assert.equal(video.currentTime,42);assert.equal(video.plays,1);
});
test('paused film stays paused and 4K failure offers the low-bandwidth option',()=>{
  const {source,video,quality,message}=fixture(true);quality.value='4k';quality.dispatchEvent(new Event('change'));
  video.dispatchEvent(new Event('loadedmetadata'));assert.equal(video.currentTime,42);assert.equal(video.plays,0);assert.match(source.src,/changan-xianying-4k.mp4$/);
  source.dispatchEvent(new Event('error'));assert.equal(message.hidden,false);assert.match(message.textContent,/1080P/);
});

test('rapid changes during loading keep the original playhead and play intent',async()=>{
  const {video,quality}=fixture(false);
  quality.dispatchEvent(new Event('change'));quality.value='4k';quality.dispatchEvent(new Event('change'));
  video.dispatchEvent(new Event('loadedmetadata'));await Promise.resolve();assert.equal(video.currentTime,42);assert.equal(video.plays,1);
});
test('failed source can be downgraded without discarding the saved position',async()=>{
  const {source,video,quality,message}=fixture(false);quality.value='4k';quality.dispatchEvent(new Event('change'));
  source.dispatchEvent(new Event('error'));assert.equal(message.hidden,false);
  quality.value='1080p';quality.dispatchEvent(new Event('change'));assert.equal(message.hidden,true);
  video.dispatchEvent(new Event('loadedmetadata'));await Promise.resolve();assert.equal(video.currentTime,42);assert.equal(video.plays,1);
});
