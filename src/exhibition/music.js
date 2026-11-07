export function setupMusic({audio, button, notice}) {
  let wanted = false;
  let request = 0;
  let waitingForGesture = false;
  let initialPlaybackPending = document.hidden;
  audio.volume = 0.22;
  audio.loop = true;

  function render(playing = false, loading = false) {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-busy', String(loading));
    button.setAttribute('aria-label', wanted ? '关闭背景音乐' : '播放背景音乐《长安万象》');
    button.querySelector('.music-symbol').textContent = loading ? '·' : playing ? 'Ⅱ' : '♪';
  }
  function stop() {
    initialPlaybackPending = false;
    wanted = false;
    waitingForGesture = false;
    request++;
    audio.pause();
    render();
  }
  function failed() {
    if (!wanted) return;
    stop();
    notice('音乐暂时无法播放，请再次点击音乐重试。');
  }
  async function play(automatic = false) {
    initialPlaybackPending = false;
    waitingForGesture = false;
    wanted = true;
    const current = ++request;
    render(false, true);
    try {
      await audio.play();
      if (current === request && wanted) render(!audio.paused);
    } catch (error) {
      if (current !== request) return;
      if (automatic && error?.name === 'NotAllowedError') {
        stop();
        waitingForGesture = true;
        notice('轻触页面开启音乐');
      } else failed();
    }
  }
  button.addEventListener('click', () => {
    if (wanted) stop();
    else void play();
  });
  function unlock(event) {
    if (!waitingForGesture || document.hidden || button.contains(event.target)) return;
    if (event.type === 'keydown' && (event.ctrlKey || event.metaKey || event.altKey ||
        ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab'].includes(event.key))) return;
    void play(true);
  }
  document.addEventListener('pointerup', unlock);
  document.addEventListener('keydown', unlock);
  audio.addEventListener('playing', () => { if (wanted && !audio.paused) render(true); });
  audio.addEventListener('pause', () => { if (audio.paused) { wanted = false; render(); } });
  audio.addEventListener('error', failed);
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (initialPlaybackPending) void play(true);
  });
  render();
  if (!initialPlaybackPending) void play(true);
}
