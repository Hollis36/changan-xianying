export const ROUTES = [
  {id:'pages', name:'站点线路', url:'assets/film.mp4'},
  {id:'raw', name:'备用线路', url:'https://raw.githubusercontent.com/Hollis36/changan-xianying/main/docs/assets/film.mp4'},
];
const SAMPLE_BYTES = 512 * 1024;
export function pickRoute(results) {
  return results.filter(r => r.ok).sort((a,b) => a.ms-b.ms)[0] ?? null;
}
export function prefer4K({ahead, seconds, support, saveData = false}) {
  return !saveData && support !== false && ahead >= Math.max(12, seconds * 1.5);
}
export async function probeRoute(route, options = {}) {
  const fetcher = options.fetch ?? globalThis.fetch;
  const controller = new AbortController();
  const start = performance.now();
  let timer, reader, abortListener;
  try {
    const work = (async () => {
      const response = await fetcher(route.url, {headers:{Range:`bytes=0-${SAMPLE_BYTES-1}`},cache:'no-store',signal:controller.signal});
      if (response.status !== 206 || !response.body) {
        await response.body?.cancel();
        throw new Error('Range unavailable');
      }
      reader = response.body.getReader();
      let bytes = 0;
      while (bytes < SAMPLE_BYTES) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
      }
      if (bytes < SAMPLE_BYTES) throw new Error('Incomplete sample');
      return {id:route.id,ok:true,bytes,ms:Math.max(1,performance.now()-start)};
    })();
    const cancelled=new Promise((_,reject)=>{
      abortListener=()=>{controller.abort();reject(new Error('Cancelled'));};
      if(options.signal?.aborted) abortListener();
      else options.signal?.addEventListener('abort',abortListener,{once:true});
    });
    return await Promise.race([work,cancelled,new Promise((_,reject) => {
      timer = setTimeout(() => {controller.abort();reject(new Error('Timeout'));},options.timeout ?? 4000);
    })]);
  } catch {
    return {id:route.id,ok:false,ms:performance.now()-start};
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort',abortListener);
    controller.abort();
    if (reader) reader.cancel().catch(() => {});
  }
}
export async function decodingSupport(nav = globalThis.navigator, timeout = 1000) {
  if (!nav?.mediaCapabilities?.decodingInfo) return null;
  let timer;
  try {
    return await Promise.race([
      nav.mediaCapabilities.decodingInfo({type:'file',video:{contentType:'video/mp4; codecs="avc1.640033"',width:3840,height:2160,bitrate:15000000,framerate:30}})
        .then(info => Boolean(info.supported && info.smooth)),
      new Promise(resolve => {timer = setTimeout(() => resolve(null),timeout);}),
    ]);
  } catch { return null; }
  finally { clearTimeout(timer); }
}
export function bufferAhead(video) {
  for (let i=0;i<video.buffered.length;i++) {
    if (video.buffered.start(i) <= video.currentTime+0.1 && video.buffered.end(i) > video.currentTime) {
      return video.buffered.end(i)-video.currentTime;
    }
  }
  return 0;
}
export function setupNetworkMonitor(video, quality, ui, player, env = {}) {
  const nav = env.navigator ?? globalThis.navigator;
  const probe = env.probe ?? probeRoute;
  const capabilities = env.capabilities ?? decodingSupport;
  const wait = env.wait ?? (ms => new Promise(resolve => setTimeout(resolve,ms)));
  let generation=0, results=[], support=null, observing=false, runController;
  let cachedResults=[], measuredAt=0;
  const failed = new Set();
  function render(note='') {
    const state=player.getState();
    const route=ROUTES.find(r => r.url===state.url);
    ui.summary.textContent = `${observing ? '正在检测' : '播放状态'} · ${state.quality==='4k'?'4K': '1080P'}`;
    ui.current.textContent = `当前：${state.quality==='4k'?'4K · 高清线路':`1080P · ${route?.name ?? '站点线路'}`}${note ? '。'+note : ''}`;
    ui.device.textContent = support===null?'设备：未提供解码评估，以实际播放为准。':support?'设备评估：预计可流畅解码 4K。':'设备：建议使用 1080P。';
    ui.measurements.textContent = results.map(r => `${ROUTES.find(route=>route.id===r.id).name}：${r.ok?`${(r.ms/1000).toFixed(2)} 秒`:'本次未测通'}`).join('；') || '正在读取小段视频，比较当前加载情况。';
    ui.retest.disabled=observing;
  }
  async function run(force=false) {
    runController?.abort();
    runController=new AbortController();
    const signal=runController.signal;
    const token=++generation;
    const initial=player.getState();
    const started=performance.now();
    observing=true;results=[];failed.clear();render();
    const saveData=Boolean(nav?.connection?.saveData);
    const [measured, device] = await Promise.all([
      saveData?Promise.resolve([]):!force && cachedResults.length && performance.now()-measuredAt<60000?Promise.resolve(cachedResults):Promise.all(ROUTES.map(route=>probe(route,{signal}))),
      capabilities(nav),
      wait(saveData?0:8000),
    ]);
    if (token!==generation) return;
    results=measured;support=device;observing=false;
    if(measured.length && measured!==cachedResults){cachedResults=measured;measuredAt=performance.now();}
    const best=pickRoute(results.filter(result=>!failed.has(ROUTES.find(route=>route.id===result.id).url)));
    if (best) player.set1080Route(ROUTES.find(route=>route.id===best.id).url);
    const current=player.getState();
    if (quality.value==='auto' && initial.quality==='4k' && current.quality==='4k') {
      const keep=prefer4K({ahead:bufferAhead(video),seconds:(performance.now()-started)/1000,support,saveData});
      if (!keep) player.selectAutomatic('1080p');
    }
    render(saveData?'已按省流量设置选择。':best?'已按本次加载情况选择。':'测速未完成，保留可用线路。');
  }
  function recover() {
    const state=player.getState();
    if (quality.value!=='auto' || state.quality!=='1080p') return false;
    failed.add(state.url);
    const alternative=results.filter(r=>r.ok).sort((a,b)=>a.ms-b.ms).map(r=>ROUTES.find(route=>route.id===r.id)).find(route=>!failed.has(route.url));
    if (alternative) { player.set1080Route(alternative.url);render('已切换备用线路。');return true; }
    return false;
  }
  quality.addEventListener('change',()=>{
    ++generation;runController?.abort();observing=false;
    if (quality.value==='auto') void run(); else render('手动画质优先。');
  });
  video.addEventListener('loadedmetadata',()=>render());
  player.onRouteError(recover);
  ui.retest.addEventListener('click',()=>void run(true));
  const ready=run();
  return {run,ready};
}
