// utils/joystickUtils.js
// Mobile joystick → fighter movement only (no animations here)

export function setupJoystick(scene, player) {
    const area = document.getElementById('joystick-area');
    if (!area) return;

    let knob = document.getElementById('joystick-knob');
    if (!knob) {
        knob = document.createElement('div');
        knob.id = 'joystick-knob';
        area.appendChild(knob);
    }

    let startX = 0, startY = 0;
    const maxDist = 50;

    area.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        knob.style.transform = 'translate(-50%, -50%)';
    });

    area.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const clamp = Math.min(dist, maxDist);

        const nx = (dx/dist)*clamp;
        const ny = (dy/dist)*clamp;

        knob.style.transform = `translate(calc(${nx}px - 50%), calc(${ny}px - 50%))`;

        scene.joystickForceX = nx/maxDist;
        scene.joystickForceY = ny/maxDist;
    });

    area.addEventListener('touchend', () => {
        knob.style.transform = 'translate(-50%, -50%)';
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        player.stopMoving();
    });

    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    window.addEventListener('orientationchange', () => {
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        player.stopMoving();
    });
}

export function applyJoystickForce(scene, player) {
    const fx = scene.joystickForceX || 0;
    const fy = scene.joystickForceY || 0;

    const moveL = fx < -0.1;
    const moveR = fx > 0.1;
    const jump = fy < -0.5;
    const onGround = player.body.blocked.down || player.body.touching.down;

    if (moveL) player.moveLeft();
    else if (moveR) player.moveRight();
    else player.stopMoving();

    if (jump && onGround) player.jump();
}
