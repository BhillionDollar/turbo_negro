// utils/joystickUtils.js
// ORIGINAL responsiveness + NEW animation mapping for TurboNegro/ReReMarie

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

        activeInterval = setInterval(() => applyJoystickForce(scene, player), 16);
    });

    joystickArea.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const deltaX = touch.clientX - joystickStartX;
        const deltaY = touch.clientY - joystickStartY;

        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const maxDistance = 50;

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

        playIdle(player);

        clearInterval(activeInterval);
    });

    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    window.addEventListener("orientationchange", () => {
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        playIdle(player);
    });
}

export function applyJoystickForce(scene, player) {
    if (!player || !player.body) return;

    const movingLeft = scene.joystickForceX < -0.1;
    const movingRight = scene.joystickForceX > 0.1;
    const isJumping = scene.joystickForceY < -0.5;
    const onGround = player.body.blocked.down || player.body.touching.down;

    player.setVelocityX(scene.joystickForceX * 160);

    if (movingLeft) player.setFlipX(true);
    if (movingRight) player.setFlipX(false);

    if (isJumping && onGround) {
        player.setVelocityY(-500);
        playJump(player);
    } else if ((movingLeft || movingRight) && onGround) {
        playWalk(player);
    } else if (onGround && scene.joystickForceX === 0) {
        playIdle(player);
    }
}

// === Animation Mappers ===
function playIdle(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboStanding", true);
    else if (key.startsWith("rere")) player.play("rereIdle", true);
}

function playWalk(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboWalk", true);
    else if (key.startsWith("rere")) player.play("rereWalk", true);
}

function playJump(player) {
    const key = player.texture.key;
    if (key.startsWith("turbo")) player.play("turboJump", true);
    else if (key.startsWith("rere")) player.play("rereJump", true);
}
