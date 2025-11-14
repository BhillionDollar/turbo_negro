// utils/mobileControls.js
// MOBILE → uses fighter movement functions ONLY
// All animations are handled by BaseFighter to avoid conflicts.

import { setupJoystick, applyJoystickForce } from './joystickUtils.js';
import { enableTiltControls, setTiltEnabled } from './tiltUtils.js';

let controlMode = 'joystick'; // or 'tilt'
let tiltListenerRegistered = false;

export function setupMobileControls(scene, player) {
    // Disable desktop controls when mobile is active
    if (scene.input.keyboard) {
        scene.input.keyboard.enabled = false;
    }

    controlMode = 'joystick';
    setTiltEnabled(false);

    // Initialize tilt permissions + listener
    initializeTilt(scene, player);

    // Initialize joystick
    initializeJoystick(scene, player);

    // Swipe jump
    setupSwipeJump(scene, player);

    // Tap anywhere to attack
    setupTapAttack(scene, player);

    // Attack button
    setupAttackButton(scene, player);

    // Toggle tilt listener
    if (!tiltListenerRegistered) {
        tiltListenerRegistered = true;

        window.addEventListener('bdp-toggle-tilt', (evt) => {
            const enabled = !!(evt.detail && evt.detail.enabled);
            controlMode = enabled ? 'tilt' : 'joystick';
            setTiltEnabled(enabled);

            if (enabled) {
                // Cleanly switch TO tilt
                scene.joystickForceX = 0;
                scene.joystickForceY = 0;
                player.stopMoving();
            } else {
                // Switch back to joystick
                player.stopMoving();
            }
        });
    }
}

function initializeTilt(scene, player) {
    if (!window.DeviceOrientationEvent) return;

    const requestPermission = DeviceOrientationEvent.requestPermission;
    if (typeof requestPermission === 'function') {
        requestPermission()
            .then((res) => {
                if (res === 'granted') {
                    enableTiltControls(scene, player);
                    setTiltEnabled(false);
                }
            })
            .catch(() => {});
    } else {
        enableTiltControls(scene, player);
        setTiltEnabled(false);
    }
}

function initializeJoystick(scene, player) {
    setupJoystick(scene, player);

    scene.events.on('update', () => {
        if (controlMode !== 'joystick') return;
        applyJoystickForce(scene, player);
    });
}

function setupSwipeJump(scene, player) {
    let startY = null;

    scene.input.on('pointerdown', (p) => {
        startY = p.y;
    });

    scene.input.on('pointerup', (p) => {
        if (startY == null) return;
        const onGround = player.body.blocked.down || player.body.touching.down;

        if (p.y < startY - 50 && onGround) {
            player.jump();
        }
        startY = null;
    });
}

function setupTapAttack(scene, player) {
    scene.input.on('pointerdown', (p) => {
        if (!p.wasTouch) return;
        player.attack();
    });
}

function setupAttackButton(scene, player) {
    const btn = document.getElementById('attack-button');
    if (!btn) return;

    const fire = (e) => {
        e.preventDefault();
        player.attack();
    };

    btn.addEventListener('touchstart', fire, { passive: false });
    btn.addEventListener('click', fire, { passive: false });
}
