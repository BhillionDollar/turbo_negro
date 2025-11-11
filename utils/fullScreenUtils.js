// utils/fullScreenUtils.js
// Unified fullscreen handling across iOS, Android, and desktop
// Works both with Phaser scenes and direct DOM button (mobile)

export function addFullscreenButton(scene) {
  const btn = document.getElementById('mobile-fullscreen-button');
  const fsContainer = document.getElementById('fullscreen');

  // --- In-game button for desktop / web full-screen ---
  if (scene && scene.add) {
    const fullscreenButton = scene.add.text(1060, 20, '[⛶]', {
      fontFamily: 'Metal Mania',
      fontSize: '24px',
      fill: '#FFD700',
      backgroundColor: '#000',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    })
      .setOrigin(1, 0)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000);

    fullscreenButton.on('pointerdown', () => {
      if (!scene.scale.isFullscreen) {
        scene.scale.startFullscreen();
        fullscreenButton.setText('[×]');
      } else {
        scene.scale.stopFullscreen();
        fullscreenButton.setText('[⛶]');
      }
    });

    fullscreenButton.on('pointerover', () =>
      fullscreenButton.setStyle({ fill: '#FFFFFF' })
    );
    fullscreenButton.on('pointerout', () =>
      fullscreenButton.setStyle({ fill: '#FFD700' })
    );
  }

  // --- DOM-level fullscreen (for mobile browsers) ---
  if (!btn || !fsContainer) return;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;

  if (isIOS && isStandalone) {
    // In iOS PWA mode, hide button and pin layout
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

  // Other mobile browsers: show and hook button
  btn.style.display = 'flex';
  btn.onclick = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // Adjust layout after orientation/fullscreen changes
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

  window.addEventListener('orientationchange', () => setTimeout(adjustLayout, 300));
  document.addEventListener('fullscreenchange', adjustLayout);
  adjustLayout();
}
