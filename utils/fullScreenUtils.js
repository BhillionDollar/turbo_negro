// utils/fullScreenUtils.js
// Option A: fullscreen targets the #fullscreen wrapper (game + HUD + controls)

export function addFullscreenButton(scene) {
  const fullscreenWrapper = document.getElementById('fullscreen');
  if (!fullscreenWrapper) {
    console.error('⚠️ #fullscreen wrapper not found');
    return;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  const mobileFullscreenButton = document.getElementById('mobile-fullscreen-button');

  // === MOBILE FULLSCREEN BUTTON (DOM button under game) ===
  if (isMobile && mobileFullscreenButton) {
    mobileFullscreenButton.style.display = 'flex';
    mobileFullscreenButton.onclick = () => {
      toggleFullscreen(fullscreenWrapper);
    };
  }

  // === DESKTOP FULLSCREEN BUTTON (Phaser text button in HUD) ===
  if (!isMobile && scene && scene.add) {
    const fullscreenText = scene.add
      .text(20, 20, '[ fullscreen ]', {
        fontSize: '20px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setInteractive();

    fullscreenText.on('pointerdown', () => {
      toggleFullscreen(fullscreenWrapper);
    });
  }

  // === iOS standalone "Add to Home Screen" style ===
  if (isIOS && isStandalone) {
    applyStandaloneIOSStyles(fullscreenWrapper);
    if (mobileFullscreenButton) {
      mobileFullscreenButton.style.display = 'none';
    }
  }

  // === Resize / orientation / fullscreen listeners ===
  window.addEventListener('resize', () => {
    adjustScreenForFullscreen();
  });

  window.addEventListener('orientationchange', () => {
    resetPlayerIfNeeded();
    setTimeout(() => {
      adjustScreenForFullscreen();
      if (window.game && window.game.scale) {
        window.game.scale.resize(window.innerWidth, window.innerHeight);
      }
    }, 300);
  });

  document.addEventListener('fullscreenchange', adjustScreenForFullscreen);
  document.addEventListener('webkitfullscreenchange', adjustScreenForFullscreen);

  // Initial pass
  adjustScreenForFullscreen();
}

// === CORE HELPERS ===
function toggleFullscreen(el) {
  if (!el) return;

  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

function adjustScreenForFullscreen() {
  const wrapper = document.getElementById('fullscreen');
  if (!wrapper) return;

  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

  if (isFullscreen) {
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100vw';
    wrapper.style.height = '100vh';
    wrapper.style.zIndex = '999';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'flex-start';
    wrapper.style.overflow = 'hidden';
  } else {
    wrapper.style.position = 'relative';
    wrapper.style.top = '';
    wrapper.style.left = '';
    wrapper.style.width = '100%';
    wrapper.style.height = 'calc(var(--vh, 1vh) * 100)';
    wrapper.style.zIndex = '';
    wrapper.style.overflow = 'hidden';
  }

  // Let Phaser resize the canvas if available
  if (window.game && window.game.scale) {
    window.game.scale.resize(window.innerWidth, window.innerHeight);
  }
}

function applyStandaloneIOSStyles(wrapper) {
  wrapper.style.position = 'absolute';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  wrapper.style.width = '100vw';
  wrapper.style.height = '100vh';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'flex-start';
  wrapper.style.overflow = 'hidden';
}

function resetPlayerIfNeeded() {
  if (window.game && window.game.scene) {
    const currentScene = window.game.scene.getScenes(true)[0];
    if (currentScene && currentScene.player && currentScene.player.body) {
      currentScene.player.setVelocityX(0);
      if (currentScene.player.anims) {
        currentScene.player.anims.play('idle', true);
      }
    }
  }

  if (window.game) {
    window.game.joystickForceX = 0;
    window.game.joystickForceY = 0;
  }
}
