import test from 'node:test';
import assert from 'node:assert/strict';
import {setupMusic} from '../src/exhibition/music.js';

test('soundtrack ignores stale pause events, stays off on failure, and stops when hidden', async t => {
  const previous = {window:globalThis.window, document:globalThis.document};
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(), {hidden:false});
  t.after(() => {
    for (const key of ['window','document']) {
      if (previous[key] === undefined) delete globalThis[key];
      else globalThis[key] = previous[key];
    }
  });
  const attrs = new Map(), symbol = {}, notices = [];
  const button = Object.assign(new EventTarget(), {
    setAttribute:(key,value)=>attrs.set(key,value), querySelector:()=>symbol,
    contains:target=>target===button
  });
  const audio = Object.assign(new EventTarget(), {
    paused:true, rejectPlay:false,
    play(){ if (this.rejectPlay) return Promise.reject(new Error('blocked')); this.paused=false; return Promise.resolve(); },
    pause(){ this.paused=true; }
  });
  setupMusic({audio,button,notice:message=>notices.push(message)});
  const click = async()=>{button.dispatchEvent(new Event('click')); await Promise.resolve();};
  await Promise.resolve();
  assert.equal(audio.paused,false); // Initial automatic playback when allowed.
  assert.equal(audio.volume,0.22);
  assert.equal(audio.loop,true);
  await click(); // Explicitly stop the initial autoplay before exercising the race.
  await click();
  await click();
  await click();
  audio.dispatchEvent(new Event('pause')); // Earlier pause arrives after resumed playback.
  assert.equal(audio.paused,false);
  assert.equal(attrs.get('aria-pressed'),'true');
  await click();
  assert.equal(audio.paused,true);
  assert.equal(attrs.get('aria-pressed'),'false');
  audio.rejectPlay=true;
  await click();
  assert.equal(attrs.get('aria-pressed'),'false');
  assert.equal(attrs.get('aria-busy'),'false');
  assert.equal(notices.length,1);
  audio.rejectPlay=false;
  await click();
  document.hidden=true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(audio.paused,true);
  assert.equal(attrs.get('aria-pressed'),'false');
});

test('blocked autoplay waits for a gesture and never restarts after explicit pause', async t => {
  const previous = {window:globalThis.window,document:globalThis.document};
  globalThis.window = new EventTarget();
  globalThis.document = Object.assign(new EventTarget(),{hidden:false});
  t.after(()=>{
    for (const key of ['window','document']) {
      if(previous[key]===undefined) delete globalThis[key]; else globalThis[key]=previous[key];
    }
  });
  const attrs=new Map(), notices=[], symbol={};
  const button=Object.assign(new EventTarget(),{
    setAttribute:(k,v)=>attrs.set(k,v),querySelector:()=>symbol,contains:target=>target===button
  });
  const audio=Object.assign(new EventTarget(),{
    paused:true,blocked:true,calls:0,
    play(){this.calls++;if(this.blocked)return Promise.reject(Object.assign(new Error('policy'),{name:'NotAllowedError'}));this.paused=false;return Promise.resolve();},
    pause(){this.paused=true;}
  });
  setupMusic({audio,button,notice:text=>notices.push(text)});
  await Promise.resolve();
  assert.equal(audio.calls,1);
  assert.equal(audio.paused,true);
  assert.equal(attrs.get('aria-pressed'),'false');
  assert.equal(notices[0],'轻触页面开启音乐');
  audio.blocked=false;
  document.dispatchEvent(new Event('pointerup'));
  await Promise.resolve();
  assert.equal(audio.paused,false);
  assert.equal(attrs.get('aria-pressed'),'true');
  button.dispatchEvent(new Event('click'));
  document.dispatchEvent(new Event('pointerup'));
  await Promise.resolve();
  assert.equal(audio.calls,2);
  assert.equal(audio.paused,true);
});

test('initial background load defers autoplay until visible and later visibility does not undo pause', async t => {
  const previous={window:globalThis.window,document:globalThis.document};
  globalThis.window=new EventTarget();
  globalThis.document=Object.assign(new EventTarget(),{hidden:true});
  t.after(()=>{for(const key of ['window','document']){if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];}});
  const button=Object.assign(new EventTarget(),{setAttribute(){},querySelector:()=>({}),contains:target=>target===button});
  const audio=Object.assign(new EventTarget(),{paused:true,calls:0,play(){this.calls++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;}});
  setupMusic({audio,button,notice(){}});
  await Promise.resolve();
  assert.equal(audio.calls,0);
  document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));
  await Promise.resolve();
  assert.equal(audio.calls,1);
  assert.equal(audio.paused,false);
  button.dispatchEvent(new Event('click'));
  document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
  document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));
  await Promise.resolve();
  assert.equal(audio.calls,1);
  assert.equal(audio.paused,true);
});
