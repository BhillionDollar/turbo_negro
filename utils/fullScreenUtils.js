// utils/fullScreenUtils.js
// ✅ Hybrid version — Bhillion Dollar original logic + proper game-container fullscreen focus

export function addFullscreenButton(scene) {
    const fullscreenElement = document.getElementById('game-container'); // ⬅️ changed target
    if (!fullscreenElement) {
        console.error("⚠️ Game container not found!");
        return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    // === MOBILE FULLSCREEN BUTTON ===
    const mobileFullscreenButton = document.getElementById('mobile-fullscreen-button');
    if (isMobile && mobileFullscreenButton) {
        mobileFullscreenButton.style.display = "flex";
        mobileFullscreenButton.addEventListener("click", () => {
            toggleFullscreen(fullscreenElement);
            setTimeout(() => {
                adjustScreenForLandscapeFullscreen();
                restoreOriginalUI();
            }, 400);
        });
    }

    // === DESKTOP PHASER BUTTON ===
    if (!isMobile && scene && scene.add) {
        const fullscreenButton = scene.add.text(20, 20, '[ fullscreen ]', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 5, bottom: 5 },
        }).setInteractive();

        fullscreenButton.on('pointerdown', () => {
            toggleFullscreen(fullscreenElement);
            setTimeout(() => {
                adjustScreenForLandscapeFullscreen();
                restoreOriginalUI();
            }, 400);
        });

        return fullscreenButton;
    }

    // === iOS STANDALONE ===
    if (isIOS && isStandalone) {
        fullscreenElement.style.position = "absolute";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";

        if (mobileFullscreenButton) mobileFullscreenButton.style.display = "none";
    }

    // === Listeners ===
    window.addEventListener("resize", () => {
        adjustScreenForLandscapeFullscreen();
        restoreOriginalUI();
    });

    window.addEventListener("orientationchange", () => {
        console.log("🔄 Orientation changed.");
        resetPlayerIfNeeded();
        setTimeout(() => {
            adjustScreenForLandscapeFullscreen();
            restoreOriginalUI();
            if (window.game && window.game.scale) {
                window.game.scale.resize(window.innerWidth, window.innerHeight);
            }
        }, 400);
    });

    document.addEventListener("fullscreenchange", () => {
        adjustScreenForLandscapeFullscreen();
        restoreOriginalUI();
    });
    document.addEventListener("webkitfullscreenchange", () => {
        adjustScreenForLandscapeFullscreen();
        restoreOriginalUI();
    });
}

// === CORE HELPERS ===
function toggleFullscreen(element) {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
        console.log("🟢 Entering fullscreen...");
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        console.log("🔵 Exiting fullscreen...");
    }
}

function adjustScreenForLandscapeFullscreen() {
    const fullscreenElement = document.getElementById('game-container');
    if (!fullscreenElement) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        fullscreenElement.style.position = "fixed";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.zIndex = "9999";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";

        if (window.game && window.game.scale) {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }
    } else if (isMobile && isLandscape) {
        fullscreenElement.style.position = "fixed";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";
    } else if (isMobile && isStandalone) {
        fullscreenElement.style.position = "absolute";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
    } else {
        fullscreenElement.style.position = "relative";
        fullscreenElement.style.width = "100%";
        fullscreenElement.style.height = "auto";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.zIndex = "";
    }
}

function restoreOriginalUI() {
    const onscreenControls = document.getElementById('onscreen-controls');
    if (!onscreenControls) return;

    onscreenControls.style.display = "flex";
    onscreenControls.style.position = "relative";
    onscreenControls.style.bottom = "auto";
    onscreenControls.style.left = "auto";
    onscreenControls.style.transform = "none";
    onscreenControls.style.zIndex = "10";
}

function resetPlayerIfNeeded() {
    if (window.game && window.game.scene) {
        const currentScene = window.game.scene.getScenes(true)[0];
        if (currentScene && currentScene.player) {
            currentScene.player.setVelocityX(0);
            currentScene.player.anims.play('idle', true);
        }
    }
    if (window.game) {
        window.game.joystickForceX = 0;
        window.game.joystickForceY = 0;
    }
}
