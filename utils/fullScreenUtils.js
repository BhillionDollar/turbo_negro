export function addFullscreenButton(scene) {
    const fullscreenElement = document.getElementById('fullscreen');
    const gameIframe = document.getElementById('game-iframe');

    if (!fullscreenElement) {
        console.error("⚠️ Fullscreen element not found!");
        return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        console.log("📱 Mobile detected. Adding fullscreen button.");
        const mobileFullscreenButton = document.getElementById('mobile-fullscreen-button');
        if (mobileFullscreenButton) {
            mobileFullscreenButton.addEventListener('click', () => {
                exitIframeFullscreen(() => {
                    toggleFullscreen(fullscreenElement);
                    setTimeout(() => {
                        adjustScreenForLandscapeFullscreen();
                        restoreOriginalUI(); // Ensures UI layout remains consistent
                    }, 500);
                });
            });
        }
    } else {
        console.log("🖥️ Desktop detected. Adding fullscreen button.");
        const fullscreenButton = scene.add.text(20, 20, '[ fullscreen ]', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { left: 10, right: 10, top: 5, bottom: 5 },
            borderRadius: '5px',
        }).setInteractive();

        fullscreenButton.on('pointerdown', () => {
            exitIframeFullscreen(() => {
                toggleFullscreen(fullscreenElement);
                setTimeout(() => {
                    adjustScreenForLandscapeFullscreen();
                    restoreOriginalUI(); // Ensures UI layout remains consistent
                }, 500);
            });
        });

        return fullscreenButton;
    }
}

function exitIframeFullscreen(callback) {
    const iframe = document.getElementById('game-iframe');
    
    if (document.fullscreenElement === iframe || document.webkitFullscreenElement === iframe) {
        console.log("🔄 Exiting iframe fullscreen before entering game fullscreen...");
        document.exitFullscreen().then(() => {
            setTimeout(() => {
                iframe.style.width = `${window.innerWidth}px`;
                iframe.style.height = `${window.innerHeight}px`;
                callback();
            }, 500);
        }).catch((err) => {
            console.error("❌ Error exiting iframe fullscreen:", err);
            callback();
        });
    } else {
        callback();
    }
}

function toggleFullscreen(element) {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
    } else {
        document.exitFullscreen();
    }
}

function adjustScreenForLandscapeFullscreen() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const fullscreenElement = document.getElementById('fullscreen');

    if (!fullscreenElement) return;

    if (isMobile && isStandalone) {
        console.log("🚀 Adjusting fullscreen for standalone mode...");
        fullscreenElement.style.position = "absolute";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";
    } else if (isMobile && isLandscape) {
        console.log("📱 Adjusting fullscreen for mobile landscape mode...");
        fullscreenElement.style.position = "fixed";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";
    } else {
        console.log("🔄 Adjusting fullscreen for normal mode...");
        fullscreenElement.style.position = "relative";
        fullscreenElement.style.width = "100%";
        fullscreenElement.style.height = "auto";
        fullscreenElement.style.display = "flex";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "hidden";
    }

    restoreOriginalUI(); // Keeps UI in original layout
}

function restoreOriginalUI() {
    const onscreenControls = document.getElementById('onscreen-controls');
    if (!onscreenControls) return;

    if (document.fullscreenElement || document.webkitFullscreenElement) {
        console.log("📺 Fullscreen Mode Active - Keeping UI original");
        onscreenControls.style.display = "flex"; 
        onscreenControls.style.position = "relative";
        onscreenControls.style.bottom = "auto";
        onscreenControls.style.left = "auto";
        onscreenControls.style.transform = "none";
        onscreenControls.style.zIndex = "10";
    } else {
        console.log("🔄 Exiting Fullscreen - Resetting UI to original layout");
        onscreenControls.style.display = "flex"; 
        onscreenControls.style.position = "relative";
        onscreenControls.style.bottom = "auto";
        onscreenControls.style.left = "auto";
        onscreenControls.style.transform = "none";
    }
}

// Listen for fullscreen and orientation changes
document.addEventListener("fullscreenchange", () => {
    adjustScreenForLandscapeFullscreen();
    restoreOriginalUI(); // Ensures UI remains unchanged
});

document.addEventListener("webkitfullscreenchange", () => {
    adjustScreenForLandscapeFullscreen();
    restoreOriginalUI(); // Ensures UI remains unchanged
});

window.addEventListener("resize", () => {
    adjustScreenForLandscapeFullscreen();
    restoreOriginalUI(); // Ensures UI remains unchanged
});

window.addEventListener("orientationchange", () => {
    console.log("🔄 Orientation changed. Resetting controls...");

    if (window.game && window.game.scene) {
        const currentScene = window.game.scene.getScenes(true)[0];
        if (currentScene && currentScene.player) {
            currentScene.player.setVelocityX(0);
            currentScene.player.anims.play('idle', true);
        }
    }

    // Reset joystick and tilt input
    if (window.game) {
        window.game.joystickForceX = 0;
        window.game.joystickForceY = 0;
    }

    setTimeout(() => {
        adjustScreenForLandscapeFullscreen();
        restoreOriginalUI(); // Keeps UI elements in place
        if (window.game && window.game.scale) {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }
    }, 500);
});
