// utils/fullScreenUtils.js
// Manages fullscreen toggling and responsive layout for desktop + mobile orientation

export function addFullscreenButton() {
  const fsButton = document.getElementById('mobile-fullscreen-button');
  const fullscreenEl = document.getElementById('fullscreen');

  if (!fsButton || !fullscreenEl) return;

  fsButton.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await fullscreenEl.requestFullscreen();
        fsButton.textContent = '[ exit ]';
      } else {
        await document.exitFullscreen();
        fsButton.textContent = '[ fullscreen ]';
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  });

  // Sync layout when orientation changes
  const adjustLayout = () => {
    const isLandscape = window.innerWidth > window.innerHeight;
    fullscreenEl.style.justifyContent = isLandscape ? 'center' : 'flex-start';
    fullscreenEl.style.alignItems = isLandscape ? 'center' : 'flex-start';
  };

  window.addEventListener('orientationchange', () => setTimeout(adjustLayout, 300));
  window.addEventListener('resize', adjustLayout);
  adjustLayout();
}

// --- Core Toggle ---
function toggleFullscreen(element) {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  } else {
    document.exitFullscreen?.();
  }

  // Always adjust after state change
  setTimeout(() => adjustForMobileFullscreen(element), 400);
}

// --- Layout Adjustments ---
function adjustForMobileFullscreen(fullscreenElement) {
  if (!fullscreenElement) return;

  const isLandscape = window.innerWidth > window.innerHeight;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;
  const onscreenControls = document.getElementById("onscreen-controls");

  if (isLandscape || isStandalone) {
    // Landscape fullscreen layout
    fullscreenElement.style.position = "fixed";
    fullscreenElement.style.top = "0";
    fullscreenElement.style.left = "0";
    fullscreenElement.style.width = "100vw";
    fullscreenElement.style.height = "100vh";
    fullscreenElement.style.display = "flex";
    fullscreenElement.style.justifyContent = "center";
    fullscreenElement.style.alignItems = "center";
    fullscreenElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    if (onscreenControls) {
      onscreenControls.style.display = "flex";
      onscreenControls.style.position = "absolute";
      onscreenControls.style.bottom = "20px";
      onscreenControls.style.left = "50%";
      onscreenControls.style.transform = "translateX(-50%)";
      onscreenControls.style.zIndex = "50";
    }
  } else {
    // Portrait or normal layout
    fullscreenElement.style.position = "relative";
    fullscreenElement.style.width = "100%";
    fullscreenElement.style.height = "auto";
    fullscreenElement.style.display = "flex";
    fullscreenElement.style.justifyContent = "center";
    fullscreenElement.style.alignItems = "center";
    fullscreenElement.style.overflow = "visible";
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";

    if (onscreenControls) {
      onscreenControls.style.position = "relative";
      onscreenControls.style.bottom = "auto";
      onscreenControls.style.left = "auto";
      onscreenControls.style.transform = "none";
      onscreenControls.style.zIndex = "10";
    }
  }

  // 🔄 Force Phaser to resize canvas properly
  if (window.game && window.game.scale) {
    window.game.scale.resize(window.innerWidth, window.innerHeight);
  }

  console.log(
    `📲 Fullscreen adjusted for ${
      isLandscape ? "landscape" : "portrait"
    } (${window.innerWidth}x${window.innerHeight})`
  );
}

// --- Listen to fullscreen state changes ---
document.addEventListener("fullscreenchange", () => {
  const el = document.getElementById("fullscreen");
  adjustForMobileFullscreen(el);
});

document.addEventListener("webkitfullscreenchange", () => {
  const el = document.getElementById("fullscreen");
  adjustForMobileFullscreen(el);
});
