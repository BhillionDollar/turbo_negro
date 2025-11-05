import { setupJoystick, applyJoystickForce } from './joystickUtils.js';
import { enableTiltControls } from './tiltUtils.js';

export function setupMobileControls(scene, player) {
    // Initialize tilt and joystick controls together
    initializeTiltControls(scene, player);
    initializeJoystick(scene, player);

    // Add swipe-to-jump functionality
    setupSwipeJump(scene, player);

    // Add tap-to-attack functionality
    setupTapAttack(scene, player);

    // Add attack button functionality
    setupAttackButton(scene, player);

    // Ensure the joystick and attack button don't interfere
    document.getElementById("joystick-area").addEventListener("touchstart", (event) => {
        event.stopPropagation(); // Prevent touches from affecting the attack button
    });

    document.getElementById("attack-button").addEventListener("touchstart", (event) => {
        event.stopPropagation(); // Prevent attack button from interfering with movement
    });
}

function initializeTiltControls(scene, player) {
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS-specific permission request
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        enableTiltControls(scene, player);
                    } else {
                        console.warn("Motion access denied. Enabling joystick as fallback.");
                    }
                })
                .catch(error => {
                    console.error("Error requesting motion permission:", error);
                });
        } else {
            // Non-iOS or older versions
            enableTiltControls(scene, player);
        }
    } else {
        console.warn("Tilt controls unavailable.");
    }
}

function initializeJoystick(scene, player) {
    setupJoystick(scene, player);

    scene.events.on('update', () => {
        if (!player || !player.body) return;

        const movingLeft = scene.joystickForceX < -0.1;
        const movingRight = scene.joystickForceX > 0.1;
        const isJumping = scene.joystickForceY < -0.5;
        const onGround = player.body.blocked.down || player.body.touching.down;
        const combinedForceX = scene.joystickForceX * 160;

        // Apply movement
        player.setVelocityX(combinedForceX);

        // Ensure direction flip
        if (movingLeft) {
            player.setFlipX(true);
        } else if (movingRight) {
            player.setFlipX(false);
        }

        // **Fix: Prevent idle from stopping walking animation**
        if (isJumping && onGround) {
            player.setVelocityY(-500);
            player.play('jump', true);
        } else if ((movingLeft || movingRight) && onGround) {
            if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'walk') {
                console.log("🚶 Joystick walk animation triggered");
                player.play('walk', true);
            }
        } else if (onGround && scene.joystickForceX === 0) {
            if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'idle') {
                console.log("🛑 Joystick idle animation triggered");
                player.play('idle', true);
            }
        }
    });
}

function setupSwipeJump(scene, player) {
    let startY = null;

    scene.input.on('pointerdown', (pointer) => {
        startY = pointer.y;
    });

    scene.input.on('pointerup', (pointer) => {
        if (startY !== null && pointer.y < startY - 50 && player.body.touching.down) {
            player.setVelocityY(-500);
            player.play('jump', true);
        }
        startY = null;
    });
}

function setupTapAttack(scene, player) {
    scene.input.on('pointerdown', (pointer) => {
        if (!pointer.wasTouch) return; // Ensure it's a touch event
        fireProjectile(scene, player);
    });
}

function setupAttackButton(scene, player) {
    const attackButton = document.getElementById('attack-button');
    if (attackButton) {
        attackButton.addEventListener('click', () => {
            fireProjectile(scene, player);
        });
    } else {
        console.warn("Attack button not found in DOM.");
    }
}

function fireProjectile(scene, player) {
    if (!scene || !scene.projectiles) return;

    console.log("🔥 Mobile fireProjectile() called!");

    // Create projectile
    const projectile = scene.projectiles.create(player.x, player.y, 'projectileCD');
    if (projectile) {
        console.log("🎯 Mobile projectile spawned!");

        projectile.setVelocityX(player.flipX ? -500 : 500); // Fire direction
        projectile.body.setAllowGravity(false);
        scene.sound.play('playerProjectileFire');

        // ✅ Ensure projectiles collide with the boss
        if (scene.boss) {
            scene.physics.add.overlap(projectile, scene.boss, () => {
                console.log("💥 Mobile projectile hit boss!");
                scene.takeBossDamage(1);
                projectile.destroy();
            });
        }
    }
}



