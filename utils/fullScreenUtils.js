export function addFullscreenButton(scene) {
    const fullscreenElement = document.getElementById('fullscreen');

    if (!fullscreenElement) {
        console.error("⚠️ Fullscreen element not found!");
        return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileFullscreenButton = document.getElementById('mobile-fullscreen-button');

    if (isMobile && mobileFullscreenButton) {
        mobileFullscreenButton.addEventListener('click', () => {
            toggleFullscreen(fullscreenElement);
            setTimeout(() => {
                adjustScreenForFullscreen();
                restoreOriginalUI();
            }, 300);
        });
        return;
    }

    // Desktop fullscreen button
    const fullscreenButton = scene.add.text(20, 20, '[ fullscreen ]', {
        fontSize: '20px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setInteractive();

    fullscreenButton.on('pointerdown', () => {
        toggleFullscreen(fullscreenElement);
        setTimeout(() => {
            adjustScreenForFullscreen();
            restoreOriginalUI();
        }, 300);
    });

    return fullscreenButton;
}

function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// 🔥 FIXED — FULLSCREEN MODE CORRECTLY EXPANDS GAME + HUD + CONTROLS
function adjustScreenForFullscreen() {
    const fullscreenElement = document.getElementById('fullscreen');

    if (!fullscreenElement) return;

    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        // 👇 FORCE fullscreen container to fill entire screen
        fullscreenElement.style.position = "fixed";
        fullscreenElement.style.top = "0";
        fullscreenElement.style.left = "0";
        fullscreenElement.style.width = "100vw";
        fullscreenElement.style.height = "100vh";
        fullscreenElement.style.padding = "0";
        fullscreenElement.style.margin = "0";

        // 👇 DISABLE FLEXBOX (this is what originally caused your shrink-to-center bug)
        fullscreenElement.style.display = "block";
        fullscreenElement.style.justifyContent = "flex-start";
        fullscreenElement.style.alignItems = "flex-start";
        fullscreenElement.style.overflow = "hidden";
    } else {
        // 👇 RESTORE ORIGINAL NON-FULLSCREEN LAYOUT
        fullscreenElement.style.position = "relative";
        fullscreenElement.style.width = "100%";
        fullscreenElement.style.height = "auto";

        fullscreenElement.style.display = "flex";
        fullscreenElement.style.flexDirection = "column";
        fullscreenElement.style.justifyContent = "center";
        fullscreenElement.style.alignItems = "center";
        fullscreenElement.style.overflow = "visible";
    }
}

// 🔧 HUD + ON-SCREEN CONTROLS RESET
function restoreOriginalUI() {
    const controls = document.getElementById('onscreen-controls');
    const fullscreenElement = document.getElementById('fullscreen');

    if (!controls || !fullscreenElement) return;

    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        // Keep controls visible in fullscreen
        controls.style.display = "flex";
        controls.style.position = "relative";
        controls.style.bottom = "auto";
        controls.style.left = "auto";
        controls.style.transform = "none";

        // Ensure fullscreen layout stays block-based
        fullscreenElement.style.display = "block";

    } else {
        // Restore original layout
        controls.style.display = "flex";
        controls.style.position = "relative";
        controls.style.bottom = "auto";
        controls.style.left = "auto";
        controls.style.transform = "none";

        // Return flexbox for normal view
        fullscreenElement.style.display = "flex";
    }
}

// 🔄 Global listeners
document.addEventListener("fullscreenchange", () => {
    adjustScreenForFullscreen();
    restoreOriginalUI();
});

document.addEventListener("webkitfullscreenchange", () => {
    adjustScreenForFullscreen();
    restoreOriginalUI();
});

window.addEventListener("resize", () => {
    adjustScreenForFullscreen();
    restoreOriginalUI();
});

window.addEventListener("orientationchange", () => {
    setTimeout(() => {
        adjustScreenForFullscreen();
        restoreOriginalUI();
    }, 350);
});
