// utils/fullScreenUtils.js
// Handles fullscreen toggle + orientation + control persistence

export function addFullscreenButton() {
  const fsBtn = document.getElementById('mobile-fullscreen-button');
  const fsContainer = document.getElementById('fullscreen');
  if (!fsBtn || !fsContainer) return;

  fsBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await fsContainer.requestFullscreen();
        fsBtn.textContent = '[ exit ]';
      } else {
        await document.exitFullscreen();
        fsBtn.textContent = '[ fullscreen ]';
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  });

  const adjust = () => {
    const landscape = window.innerWidth > window.innerHeight;
    fsContainer.style.justifyContent = landscape ? 'center' : 'flex-start';
    fsContainer.style.alignItems = landscape ? 'center' : 'flex-start';
  };

  window.addEventListener('orientationchange', () => setTimeout(adjust, 300));
  window.addEventListener('resize', adjust);
  adjust();
}
