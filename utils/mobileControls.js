// utils/mobileControls.js
// EXACT original behavior — with animation mapping + updated fireProjectile routing

import { setupJoystick } from './joystickUtils.js';
import { enableTiltControls } from './tiltUtils.js';

export function setupMobileControls(scene, player) {
    // Enable tilt (non-blocking fallback)
    initializeTilt(scene, player);

    // Enable original joystick system
    setupJoystick(scene, player);

    // Swipe jump
    setupSwipeJump(scene, player);

    // Tap anywhere = attack
    setupTapAttack(scene, player);

    // Attack button
    setupAttackButton(scene, player);

    // Prevent UI touch interference
    stopPropagation("joystick-area");
    stopPropagation("attack-button");
}

function initializeTilt(scene, player) {
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            DeviceOrientationEvent.requestPermission()
                .then(res => {
                    if (res === "granted") enableTiltControls(scene, player);
                })
                .catch(() => {});
        } else {
            enableTiltControls(scene, player);
        }
    }
}

function setupSwipeJump(scene, player) {
    let startY = null;

    scene.input.on("pointerdown", (p) => {
        startY = p.y;
    });

    scene.input.on("pointerup", (p) => {
        const onGround = player.body.blocked.down || player.body.touching.down;
        if (startY !== null && p.y < startY - 50 && onGround) {
            player.setVelocityY(-500);
            playJump(player);
        }
        startY = null;
    });
}

function setupTapAttack(scene, player) {
    scene.input.on("pointerdown", (pointer) => {
        if (!pointer.wasTouch) return;
        fireProjectile(scene, player);
    });
}

function setupAttackButton(scene, player) {
    const attackBtn = document.getElementById("attack-button");
    if (!attackBtn) return;

    attackBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        fireProjectile(scene, player);
    });
    attackBtn.addEventListener("click", () => fireProjectile(scene, player));
}

function fireProjectile(scene, player) {
    if (!scene.projectiles) return;

    const proj = scene.projectiles.create(player.x, player.y, 'projectileCD');
    if (!proj) return;

    proj.setVelocityX(player.flipX ? -500 : 500);
    proj.body.setAllowGravity(false);

    scene.sound?.play('playerProjectileFire');

    if (scene.boss) {
        scene.physics.add.overlap(proj, scene.boss, () => {
            scene.takeBossDamage?.(1);
            proj.destroy();
        });
    }
}

function stopPropagation(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: false });
}

// Animation mapping (same as joystickUtils)
function playJump(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboJump", true);
    else if (key.startsWith("rere")) player.play("rereJump", true);
}
