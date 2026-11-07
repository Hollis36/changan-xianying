export function setupPlayer(video, quality, message) {
  const source = video.querySelector('source');
  const sources = {
    '4k': 'https://github.com/Hollis36/changan-xianying/releases/download/v2026.11.07/changan-xianying-4k.mp4',
    '1080p': 'assets/film.mp4',
  };
  let pendingMetadata, pendingRestore;
  function showError() {
    message.textContent = quality.value === '4k'
      ? '4K 暂未加载，可切换 1080P，或下载原片观看。'
      : '影片暂未加载，请稍后重试，或下载原片观看。';
    message.hidden = false;
  }
  video.addEventListener('error', showError);
  source.addEventListener('error', showError);
  quality.addEventListener('change', () => {
    if (!sources[quality.value]) return;
    const position = pendingRestore?.position ?? video.currentTime;
    const resume = pendingRestore?.resume ?? (!video.paused && !video.ended);
    pendingRestore = { position, resume };
    message.hidden = true;
    if (pendingMetadata) video.removeEventListener('loadedmetadata', pendingMetadata);
    pendingMetadata = () => {
      pendingMetadata = undefined;
      pendingRestore = undefined;
      if (position > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(position, Math.max(0, video.duration - 0.1));
      }
      if (resume) video.play().catch(() => {
        message.textContent = '清晰度已切换，点击播放继续观看。';
        message.hidden = false;
      });
    };
    video.addEventListener('loadedmetadata', pendingMetadata, { once: true });
    source.src = sources[quality.value];
    video.load();
  });
}
