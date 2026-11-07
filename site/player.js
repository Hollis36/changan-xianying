export function setupPlayer(video, quality, message, timers = {}) {
  const source = video.querySelector('source');
  const sources = {
    '4k': 'https://github.com/Hollis36/changan-xianying/releases/download/v2026.11.07/changan-xianying-4k-web.mp4',
    '1080p': 'assets/film.mp4',
  };
  const setTimer = timers.setTimeout ?? setTimeout;
  const clearTimer = timers.clearTimeout ?? clearTimeout;
  let pendingMetadata, pendingRestore, bufferingTimer;
  let activeQuality = '4k';
  let activeUrl = sources['4k'];
  let sourceGeneration = 0;
  let routeErrorHandler;
  function clearBuffering() {
    if (bufferingTimer !== undefined) clearTimer(bufferingTimer);
    bufferingTimer = undefined;
  }
  function changeSource(target, automatic = false) {
    clearBuffering();
    const generation = ++sourceGeneration;
    const position = pendingRestore?.position ?? video.currentTime;
    const resume = pendingRestore?.resume ?? (!video.paused && !video.ended);
    pendingRestore = { position, resume };
    activeQuality = target;
    activeUrl = sources[target];
    message.hidden = !automatic;
    if (automatic) message.textContent = '已切换至 1080P，减少等待。可在画质中选择 4K。';
    if (pendingMetadata) video.removeEventListener('loadedmetadata', pendingMetadata);
    pendingMetadata = () => {
      pendingMetadata = undefined;
      pendingRestore = undefined;
      if (position > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(position, Math.max(0, video.duration - 0.1));
      }
      if (resume) video.play().catch(() => {
        if (generation !== sourceGeneration) return;
        message.textContent = '清晰度已切换，点击播放继续观看。';
        message.hidden = false;
      });
    };
    video.addEventListener('loadedmetadata', pendingMetadata, { once: true });
    source.src = sources[target];
    video.load();
  }
  function showError() {
    clearBuffering();
    if (quality.value === 'auto' && activeQuality === '4k') {
      changeSource('1080p', true);
      return;
    }
    if (activeQuality === '1080p' && quality.value === 'auto' && routeErrorHandler?.(activeUrl)) return;
    message.textContent = activeQuality === '4k'
      ? '4K 暂未加载，可切换 1080P，或下载原片观看。'
      : '影片暂未加载，请稍后重试，或下载原片观看。';
    message.hidden = false;
  }
  function watchBuffering() {
    if (quality.value !== 'auto' || activeQuality !== '4k' || video.paused || video.ended || video.readyState >= 3 || bufferingTimer !== undefined) return;
    bufferingTimer = setTimer(() => {
      bufferingTimer = undefined;
      if (quality.value === 'auto' && activeQuality === '4k' && !video.paused && !video.ended && video.readyState < 3) {
        changeSource('1080p', true);
      }
    }, 8000);
  }
  video.addEventListener('playing', () => {
    if (message.textContent === '清晰度已切换，点击播放继续观看。') message.hidden = true;
  });
  video.addEventListener('error', showError);
  source.addEventListener('error', showError);
  video.addEventListener('waiting', watchBuffering);
  video.addEventListener('stalled', watchBuffering);
  video.addEventListener('play', () => { if (video.readyState < 3) watchBuffering(); });
  for (const event of ['playing', 'pause', 'ended']) video.addEventListener(event, clearBuffering);
  for (const event of ['seeking', 'seeked']) video.addEventListener(event, () => {
    clearBuffering();
    watchBuffering();
  });
  quality.addEventListener('change', () => {
    const target = quality.value === 'auto' ? '4k' : quality.value;
    if (sources[target]) {
      if (activeQuality === target && activeUrl === sources[target] && !video.error) {
        clearBuffering();
        if (quality.value === 'auto') watchBuffering();
      } else changeSource(target);
    }
  });
  return {
    onRouteError(handler) { routeErrorHandler=handler; },
    getState: () => ({quality:activeQuality,url:activeUrl}),
    set1080Route(url) {
      const allowed=['assets/film.mp4','https://raw.githubusercontent.com/Hollis36/changan-xianying/main/docs/assets/film.mp4'];
      if (!allowed.includes(url)) return;
      sources['1080p']=url;
      if (activeQuality==='1080p' && activeUrl!==url) changeSource('1080p');
    },
    selectAutomatic(target) {
      if (quality.value==='auto' && sources[target] && activeQuality!==target) changeSource(target);
    },
  };
}
