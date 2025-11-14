// utils/ControlManager.js
import { setupMobileControls } from './mobileControls.js';

let _initialized = false;
let _debounceTimer = null;

export function initControlManager() {
    if (_initialized) {
        console.warn("⚠️ ControlManager already initialized — skipping duplicate setup.");
        return;
    }
    _initialized = true;

    const tiltCheckbox = document.getElementById('tilt-toggle');

    // === 1️⃣ Set default control mode ===
    let savedMode = localStorage.getItem('controlMode');
    if (!savedMode) {
        savedMode = 'joystick';
        localStorage.setItem('controlMode', savedMode);
    }
    if (tiltCheckbox) {
        tiltCheckbox.checked = savedMode === 'tilt';
    }

    // === 2️⃣ Toggle with debounce ===
    if (tiltCheckbox) {
        tiltCheckbox.addEventListener('change', (e) => {
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                const useTilt = e.target.checked;
                localStorage.setItem('controlMode', useTilt ? 'tilt' : 'joystick');

                // 🔥 correct payload for mobileControls.js
                window.dispatchEvent(
                    new CustomEvent('bdp-toggle-tilt', {
                        detail: { enabled: useTilt }
                    })
                );

                console.log(`🎮 Control mode switched → ${useTilt ? 'TILT' : 'JOYSTICK'}`);
            }, 250);
        });
    }

    // === 3️⃣ Initialize controls after scene + player are available ===
    const trySetup = () => {
        if (!window.game) return setTimeout(trySetup, 200);

        const scene = window.game.scene.getScenes(true)[0];
        const player = scene?.player;
        if (!scene || !player) return setTimeout(trySetup, 200);

        console.log("🎮 Initializing mobile controls...");
        setupMobileControls(scene, player);
    };
    trySetup();

    // === 4️⃣ Listen for tilt toggle WITHOUT re-initializing controls ===
    window.addEventListener('bdp-toggle-tilt', (e) => {
        console.log("🔄 Received toggle event:", e.detail);

        const enabled = !!e.detail?.enabled;
        const scene = window.game?.scene?.getScenes(true)[0];
        const player = scene?.player;

        if (!scene || !player) return;

        console.log(`🔁 Applying control mode → ${enabled ? "TILT" : "JOYSTICK"}`);

        // 🔥 Do NOT rerun setupMobileControls — let mobileControls.js handle switching cleanly
        // mobileControls.js already listens for this event and handles switching modes.
    });

    console.log("✅ ControlManager initialized.");
}
