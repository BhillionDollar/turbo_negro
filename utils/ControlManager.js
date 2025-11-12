// utils/ControlManager.js
import { setupMobileControls } from './mobileControls.js';

let _initialized = false; // Prevent double initialization across reloads
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

    // === 2️⃣ Attach debounce-protected toggle ===
    if (tiltCheckbox) {
        tiltCheckbox.addEventListener('change', (e) => {
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                const useTilt = e.target.checked;
                localStorage.setItem('controlMode', useTilt ? 'tilt' : 'joystick');

                window.dispatchEvent(
                    new CustomEvent('bdp-toggle-tilt', {
                        detail: { mode: useTilt ? 'tilt' : 'joystick' },
                    })
                );

                console.log(`🎮 Control mode switched → ${useTilt ? 'TILT' : 'JOYSTICK'}`);
            }, 250); // debounce delay (prevents double-fire)
        });
    }

    // === 3️⃣ Initialize controls once game + player exist ===
    const trySetup = () => {
        if (!window.game) return setTimeout(trySetup, 200);
        const scene = window.game.scene.getScenes(true)[0];
        const player = scene?.player;
        if (!scene || !player) return setTimeout(trySetup, 200);

        console.log("🎮 Initializing mobile controls...");
        setupMobileControls(scene, player);
    };
    trySetup();

    // === 4️⃣ Listen for global mode toggle events ===
    window.addEventListener('bdp-toggle-tilt', (e) => {
        const mode = e.detail?.mode || 'joystick';
        const scene = window.game?.scene?.getScenes(true)[0];
        const player = scene?.player;

        if (!scene || !player) return;
        console.log(`🔄 Applying control mode: ${mode}`);

        // Re-init mobile controls to reflect mode change
        setupMobileControls(scene, player);
    });

    console.log("✅ ControlManager initialized.");
}
