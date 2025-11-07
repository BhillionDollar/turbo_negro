// utils/fullScreenUtils.js
// Unified fullscreen handling across iOS, Android, and desktop

export function addFullscreenButton() {
  const btn = document.getElementById('mobile-fullscreen-button');
  const fsContainer = document.getElementById('fullscreen');

  if (!btn || !fsContainer) return;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;

  if (isIOS && isStandalone) {
    // In iOS PWA mode, no need for fullscreen button
    btn.style.display = 'none';
    document.body.style.cssText = `
      height: 100vh;
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
    `;
    Object.assign(fsContainer.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
    });
    return;
  }

  // Show and hook button for other mobile devices
  btn.style.display = 'flex';
  btn.addEventListener('click', () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  });

  // Adjust layout on orientation change
  const adjustLayout = () => {
    if (!fsContainer || !document.fullscreenElement) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    Object.assign(document.body.style, {
      position: 'absolute',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    });

    Object.assign(fsContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      justifyContent: isLandscape ? 'center' : 'flex-start',
      alignItems: isLandscape ? 'center' : 'flex-start',
    });
  };

  window.addEventListener('orientationchange', () => {
    setTimeout(adjustLayout, 300);
  });

  document.addEventListener('fullscreenchange', adjustLayout);
  adjustLayout(); // initial run
}
