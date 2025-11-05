export function setupJoystick(scene, player) {
    const joystickArea = document.getElementById('joystick-area');
    let joystickKnob = document.getElementById('joystick-knob');

    if (!joystickKnob) {
        joystickKnob = document.createElement('div');
        joystickKnob.id = 'joystick-knob';
        joystickArea.appendChild(joystickKnob);
    }

    let joystickStartX = 0;
    let joystickStartY = 0;
    let activeInterval;

    joystickArea.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        joystickStartX = touch.clientX;
        joystickStartY = touch.clientY;
        joystickKnob.style.transform = `translate(-50%, -50%)`;

        activeInterval = setInterval(() => applyJoystickForce(scene, player), 16); // Run every ~16ms (60 FPS)
    });

    joystickArea.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const deltaX = touch.clientX - joystickStartX;
        const deltaY = touch.clientY - joystickStartY;

        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const maxDistance = 50; // Joystick radius limit

        const clampedX = (deltaX / distance) * Math.min(distance, maxDistance);
        const clampedY = (deltaY / distance) * Math.min(distance, maxDistance);

        joystickKnob.style.transform = `translate(calc(${clampedX}px - 50%), calc(${clampedY}px - 50%))`;

        scene.joystickForceX = clampedX / maxDistance;
        scene.joystickForceY = clampedY / maxDistance;
    });

    joystickArea.addEventListener('touchend', () => {
        joystickKnob.style.transform = `translate(-50%, -50%)`;
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;

        if (player) {
            player.setVelocityX(0); // Stop horizontal movement
            player.anims.play('idle', true);
        }

        clearInterval(activeInterval);
    });

    // Initialize joystick force values
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    // Reset joystick on orientation change
    window.addEventListener("orientationchange", () => {
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        if (player) {
            player.setVelocityX(0);
            player.anims.play('idle', true);
        }
    });
}

export function applyJoystickForce(scene, player) {
    if (!player || !player.body) return;

    const movingLeft = scene.joystickForceX < -0.1;
    const movingRight = scene.joystickForceX > 0.1;
    const isJumping = scene.joystickForceY < -0.5;
    const onGround = player.body.blocked.down || player.body.touching.down;
    
    // Apply movement
    player.setVelocityX(scene.joystickForceX * 160);

    // Ensure direction flip
    if (movingLeft) {
        player.setFlipX(true);
    } else if (movingRight) {
        player.setFlipX(false);
    }

    // **Fix: Ensure animations play correctly**
    if (isJumping && onGround) {
        player.setVelocityY(-500);
        player.play('jump', true);
    } else if ((movingLeft || movingRight) && onGround) {
        if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'walk') {
            console.log("🚶 Walking animation triggered");
            player.play('walk', true);
        }
    } else if (onGround && scene.joystickForceX === 0) {
        // **Fix: Ensure idle only plays when not moving at all**
        if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'idle') {
            console.log("🛑 Idle animation triggered");
            player.play('idle', true);
        }
    }
}