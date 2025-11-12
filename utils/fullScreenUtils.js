// utils/fullScreenUtils.js
// ✅ Bhillion Dollar Hybrid Version — optimized for fullscreen HUD + bottom controls positioning

export function addFullscreenButton(scene) {
    const fullscreenElement = document.getElementById('game-container');
    if (!fullscreenElement) {
        console.error("⚠️ Game container not found!");
        return;
    }

    const hud = document.getElementById('hud-wrapper');
    const onscreenControls = document.getElementById('onscreen-controls');

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
                positionHUDandControls();
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
                positionHUDandControls();
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

    // === EVENT LISTENERS ===
    window.addEventListener("resize", () => {
        adjustScreenForLandscapeFullscreen();
        positionHUDandControls();
    });

    window.addEventListener("orientationchange", () => {
        console.log("🔄 Orientation changed.");
        resetPlayerIfNeeded();
        setTimeout(() => {
            adjustScreenForLandscapeFullscreen();
            positionHUDandControls();
            if (window.game && window.game.scale) {
                window.game.scale.resize(window.innerWidth, window.innerHeight);
            }
        }, 400);
    });

    document.addEventListener("fullscreenchange", positionHUDandControls);
    document.addEventListener("webkitfullscreenchange", positionHUDandControls);
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

// === MAIN RESPONSIVE HANDLER ===
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

    if (window.game && window.game.scale) {
        window.game.scale.resize(window.innerWidth, window.innerHeight);
    }
}

// === HUD & CONTROLS POSITIONING ===
function positionHUDandControls() {
    const hud = document.getElementById('hud-wrapper');
    const controls = document.getElementById('onscreen-controls');
    const fullscreenElement = document.getElementById('game-container');

    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        if (hud) {
            hud.style.position = "absolute";
            hud.style.top = "10px";
            hud.style.left = "50%";
            hud.style.transform = "translateX(-50%)";
            hud.style.width = "90%";
            hud.style.zIndex = "10000";
        }
        if (controls) {
            controls.style.position = "absolute";
            controls.style.bottom = "12px";
            controls.style.left = "50%";
            controls.style.transform = "translateX(-50%)";
            controls.style.width = "90%";
            controls.style.maxWidth = "1000px";
            controls.style.zIndex = "10000";
        }
    } else {
        if (hud) {
            hud.style.position = "static";
            hud.style.transform = "none";
            hud.style.zIndex = "";
        }
        if (controls) {
            controls.style.position = "relative";
            controls.style.bottom = "auto";
            controls.style.left = "auto";
            controls.style.transform = "none";
            controls.style.zIndex = "10";
        }
    }
}

// === PLAYER RESET ===
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
