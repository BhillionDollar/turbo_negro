// utils/fullScreenUtils.js
// Adds a small helper so overlays (like mobile controls) stay sane in fullscreen.

export function addFullscreenButton(scene) {
  // If you already have a working button elsewhere, you can ignore this helper.
  const btn = document.getElementById('fullscreen-btn');
  if (!btn) return;

  btn.onclick = () => {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
      (docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen)?.call(docEl);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
    }
  };

  // Keep overlays tidy when fullscreen toggles.
  const onFsChange = () => refreshOverlayLayout();
  document.addEventListener('fullscreenchange', onFsChange);
  scene.events.once('shutdown', () => document.removeEventListener('fullscreenchange', onFsChange));
}

export function refreshOverlayLayout() {
  const root = document.getElementById('mobile-ui');
  if (!root) return;
  // In fullscreen, give controls a bit more margin from edges.
  const fs = !!document.fullscreenElement;
  root.style.padding = fs ? '8px' : '0';
}

export default { addFullscreenButton, refreshOverlayLayout };
