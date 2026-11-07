import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES, pickRoute, prefer4K, probeRoute, decodingSupport} from '../site/network.js';
test('selects the quickest successful route and ignores failures',()=>{
 assert.equal(pickRoute([{id:'pages',ok:true,ms:1600},{id:'raw',ok:true,ms:700}]).id,'raw');
 assert.equal(pickRoute([{id:'pages',ok:true,ms:1600},{id:'raw',ok:false,ms:30}]).id,'pages');
 assert.equal(pickRoute([{ok:false}]),null);
});
test('4K requires real buffer headroom and no known device limitation',()=>{
 assert.equal(prefer4K({ahead:15,seconds:8,support:null}),true);
 assert.equal(prefer4K({ahead:4,seconds:8,support:true}),false);
 assert.equal(prefer4K({ahead:20,seconds:8,support:false}),false);
 assert.equal(prefer4K({ahead:20,seconds:8,support:true,saveData:true}),false);
});
test('probe requests a small range and closes the stream',async()=>{
 let cancelled=false,request;
 const result=await probeRoute(ROUTES[0],{fetch:async(u,options)=>{
  request=options;return {status:206,body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array(512*1024)}),cancel:async()=>{cancelled=true;}})}};
 }});
 assert.equal(result.ok,true);assert.equal(result.bytes,512*1024);assert.equal(request.headers.Range,'bytes=0-524287');assert.equal(cancelled,true);
});
test('ignored Range is rejected without downloading a whole video',async()=>{
 let cancelled=false;
 const result=await probeRoute(ROUTES[0],{fetch:async()=>({status:200,body:{cancel:async()=>{cancelled=true;}}})});
 assert.equal(result.ok,false);assert.equal(cancelled,true);
});
test('probe timeout aborts a hung fetch',async()=>{
 let signal;
 const result=await probeRoute(ROUTES[0],{timeout:5,fetch:async(u,o)=>{signal=o.signal;return new Promise(()=>{});}});
 assert.equal(result.ok,false);assert.equal(signal.aborted,true);
});
test('unavailable or hanging capability API remains unknown',async()=>{
 assert.equal(await decodingSupport({}),null);
 assert.equal(await decodingSupport({mediaCapabilities:{decodingInfo:async()=>new Promise(()=>{})}},5),null);
 assert.equal(await decodingSupport({mediaCapabilities:{decodingInfo:async()=>({supported:true,smooth:false})}}),false);
});

import {setupNetworkMonitor} from '../site/network.js';
import {setupPlayer} from '../site/player.js';
function monitorFixture({ahead=20,wait=async()=>{},probe}={}) {
 const source=Object.assign(new EventTarget(),{src:'4k'});
 const video=Object.assign(new EventTarget(),{currentTime:42,duration:126,paused:true,ended:false,readyState:2,loads:0,plays:0,
   buffered:{length:1,start:()=>0,end:()=>42+ahead},querySelector:()=>source,
   load(){this.currentTime=0;this.loads++;this.paused=true;},play(){this.plays++;this.paused=false;return Promise.resolve();}});
 const quality=Object.assign(new EventTarget(),{value:'auto'}), message={hidden:true};
 const player=setupPlayer(video,quality,message);
 const ui={summary:{},current:{},device:{},measurements:{},retest:new EventTarget()};
 const monitor=setupNetworkMonitor(video,quality,ui,player,{navigator:{},wait,capabilities:async()=>true,probe:probe??(async route=>({id:route.id,ok:true,ms:route.id==='pages'?100:200}))});
 return {source,video,quality,message,player,ui,monitor};
}
test('initial detection downgrades insufficient 4K buffer while retaining paused position',async()=>{
 const f=monitorFixture({ahead:1,probe:async r=>({id:r.id,ok:true,ms:r.id==='raw'?100:200})});
 await f.monitor.ready;assert.equal(f.source.src,ROUTES[1].url);assert.equal(f.player.getState().quality,'1080p');
 f.video.dispatchEvent(new Event('loadedmetadata'));assert.equal(f.video.currentTime,42);assert.equal(f.video.plays,0);
});
test('one 4K error downgrades once; real 1080P errors fail over once without loops',async()=>{
 const f=monitorFixture();await f.monitor.ready;
 f.source.dispatchEvent(new Event('error'));assert.equal(f.source.src,ROUTES[0].url);assert.equal(f.video.loads,1);
 f.source.dispatchEvent(new Event('error'));assert.equal(f.source.src,ROUTES[1].url);assert.equal(f.video.loads,2);
 f.source.dispatchEvent(new Event('error'));assert.equal(f.video.loads,2);assert.equal(f.message.hidden,false);
});
test('manual change aborts old detection and prevents late automatic downgrade',async()=>{
 let release;const signals=[];
 const f=monitorFixture({ahead:0,wait:()=>new Promise(r=>{release=r;}),probe:async(r,o)=>{signals.push(o.signal);return {id:r.id,ok:true,ms:100};}});
 f.quality.value='4k';f.quality.dispatchEvent(new Event('change'));
 assert.ok(signals.every(s=>s.aborted));release();await f.monitor.ready;
 assert.equal(f.player.getState().quality,'4k');assert.equal(f.video.loads,0);
});
test('completed route samples are reused briefly, explicit retest measures again',async()=>{
 let calls=0;const f=monitorFixture({probe:async r=>{calls++;return {id:r.id,ok:true,ms:100};}});
 await f.monitor.ready;assert.equal(calls,2);await f.monitor.run();assert.equal(calls,2);await f.monitor.run(true);assert.equal(calls,4);
});
test('external cancellation aborts an active range probe',async()=>{
 const controller=new AbortController();let signal;
 const pending=probeRoute(ROUTES[0],{signal:controller.signal,fetch:async(u,o)=>{signal=o.signal;return new Promise(()=>{});}});
 controller.abort();assert.equal((await pending).ok,false);assert.equal(signal.aborted,true);
});
test('errors before initial measurements finish exclude failed playback routes',async()=>{
 let release;
 const f=monitorFixture({wait:()=>new Promise(resolve=>{release=resolve;})});
 f.source.dispatchEvent(new Event('error'));
 f.source.dispatchEvent(new Event('error'));
 assert.equal(f.video.loads,1);
 release();await f.monitor.ready;
 assert.equal(f.source.src,ROUTES[1].url);assert.equal(f.video.loads,2);
 f.video.dispatchEvent(new Event('loadedmetadata'));
 assert.equal(f.video.currentTime,42);assert.equal(f.video.plays,0);
});
