// utils/fullScreenUtils.js
// Manages fullscreen toggling and responsive layout for desktop + mobile orientation

export function addFullscreenButton(scene) {
  const fullscreenElement = document.getElementById("fullscreen");
  if (!fullscreenElement) {
    console.error("⚠️ Fullscreen element not found!");
    return;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    const mobileBtn = document.getElementById("mobile-fullscreen-button");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", () => {
        toggleFullscreen(fullscreenElement);
      });
    }

    // auto adjust when loaded or rotated
    window.addEventListener("orientationchange", () => {
      setTimeout(() => adjustForMobileFullscreen(fullscreenElement), 300);
    });
    window.addEventListener("resize", () =>
      adjustForMobileFullscreen(fullscreenElement)
    );
  } else {
    // 🖥️ Desktop fullscreen button inside Phaser
    const fullscreenText = scene.add
      .text(20, 20, "[ fullscreen ]", {
        fontSize: "20px",
        fill: "#fff",
        backgroundColor: "#000",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
      })
      .setInteractive();

    fullscreenText.on("pointerdown", () =>
      toggleFullscreen(fullscreenElement)
    );
  }
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
