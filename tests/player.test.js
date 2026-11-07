import test from 'node:test';
import assert from 'node:assert/strict';
import {setupPlayer} from '../site/player.js';
function fixture(paused, timers) {
  const source=new EventTarget();source.src='original';
  const video=Object.assign(new EventTarget(),{currentTime:42,duration:126,paused,ended:false,plays:0,querySelector:()=>source,load(){this.currentTime=0;this.paused=true;},play(){this.plays++;this.paused=false;return Promise.resolve();}});
  const quality=Object.assign(new EventTarget(),{value:'1080p'}),message={hidden:true};
  setupPlayer(video,quality,message,timers);return {source,video,quality,message};
}
test('quality change restores the playhead and resumes an active film',async()=>{
  const {source,video,quality}=fixture(false);
  quality.dispatchEvent(new Event('change'));assert.equal(source.src,'assets/film.mp4');assert.equal(video.currentTime,0);
  video.dispatchEvent(new Event('loadedmetadata'));await Promise.resolve();assert.equal(video.currentTime,42);assert.equal(video.plays,1);
});
test('paused film stays paused and 4K failure offers the low-bandwidth option',()=>{
  const {source,video,quality,message}=fixture(true);quality.value='4k';quality.dispatchEvent(new Event('change'));
  video.dispatchEvent(new Event('loadedmetadata'));assert.equal(video.currentTime,42);assert.equal(video.plays,0);assert.match(source.src,/changan-xianying-4k-web.mp4$/);
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

// The HTML must use the same optimized stream before JavaScript runs.
test('initial 4K stream is optimized while the original download stays separate', async()=>{
  const {readFile}=await import('node:fs/promises');
  const html=await readFile(new URL('../site/index.html',import.meta.url),'utf8');
  assert.match(html, /<video[^>]+preload="metadata"/);
  assert.match(html, /<source src="[^"]+changan-xianying-4k-web\.mp4"/);
  assert.match(html, /href="[^"]+changan-xianying-4k\.mp4">下载 4K 原片/);
});

function bufferingFixture() {
  let callback;
  const f=fixture(false,{setTimeout(fn){callback=fn;return 1;},clearTimeout(){callback=undefined;}});
  f.quality.value='auto'; f.video.readyState=2;
  return {...f, tick(){const fn=callback;callback=undefined;fn?.();}, pending(){return Boolean(callback);}};
}
test('auto mode falls back after sustained buffering and restores position',async()=>{
  const f=bufferingFixture();f.video.dispatchEvent(new Event('waiting'));assert.equal(f.pending(),true);
  f.tick();assert.equal(f.source.src,'assets/film.mp4');assert.equal(f.message.hidden,false);assert.match(f.message.textContent,/1080P/);
  f.video.dispatchEvent(new Event('loadedmetadata'));await Promise.resolve();assert.equal(f.video.currentTime,42);assert.equal(f.video.plays,1);
  f.video.dispatchEvent(new Event('waiting'));assert.equal(f.pending(),false);
});
test('brief buffering or pausing cancels automatic quality fallback',()=>{
  for(const event of ['playing','pause']) {
    const f=bufferingFixture();f.video.dispatchEvent(new Event('waiting'));f.video.dispatchEvent(new Event(event));f.tick();assert.equal(f.source.src,'original');
  }
});
test('manual 4K selection is never automatically downgraded',()=>{
  const f=bufferingFixture();f.quality.value='4k';f.video.dispatchEvent(new Event('waiting'));f.tick();assert.equal(f.source.src,'original');
});
test('initial play with no buffer starts the automatic fallback timer',()=>{
  const f=bufferingFixture();f.video.dispatchEvent(new Event('play'));f.tick();assert.equal(f.source.src,'assets/film.mp4');
});
test('auto mode recovers from 4K load failure without starting a paused video',()=>{
  const f=bufferingFixture();f.video.paused=true;f.source.dispatchEvent(new Event('error'));assert.equal(f.source.src,'assets/film.mp4');
  f.video.dispatchEvent(new Event('loadedmetadata'));assert.equal(f.video.plays,0);
});

test('seeking into an unbuffered region can fall back at the requested position',async()=>{
  const f=bufferingFixture();f.video.currentTime=72;f.video.seeking=true;
  f.video.dispatchEvent(new Event('seeking'));f.video.dispatchEvent(new Event('waiting'));f.tick();
  assert.equal(f.source.src,'assets/film.mp4');f.video.dispatchEvent(new Event('loadedmetadata'));
  await Promise.resolve();assert.equal(f.video.currentTime,72);assert.equal(f.video.plays,1);
});
test('download stalls with enough buffered video do not start the fallback timer',()=>{
  const f=bufferingFixture();f.video.readyState=4;f.video.dispatchEvent(new Event('stalled'));assert.equal(f.pending(),false);
});
