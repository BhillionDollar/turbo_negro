// utils/joystickUtils.js
// NEW VERSION — FULL BaseFighter support

export function setupJoystick(scene, player) {
    const area = document.getElementById("joystick-area");
    let knob = document.getElementById("joystick-knob");

    if (!knob) {
        knob = document.createElement("div");
        knob.id = "joystick-knob";
        area.appendChild(knob);
    }

    let startX = 0;
    let startY = 0;

    area.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;

        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
    });

    area.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        const distance = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 50;

        const clampX = (dx / distance) * Math.min(distance, maxDist);
        const clampY = (dy / distance) * Math.min(distance, maxDist);

        knob.style.transform =
            `translate(calc(${clampX}px - 50%), calc(${clampY}px - 50%))`;

        scene.joystickForceX = clampX / maxDist;
        scene.joystickForceY = clampY / maxDist;
    });

    area.addEventListener("touchend", () => {
        knob.style.transform = "translate(-50%, -50%)";

        scene.joystickForceX = 0;
        scene.joystickForceY = 0;

        // STOP movement cleanly
        if (player?.stopMoving) player.stopMoving();
    });

    // Initialize
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;
}

export function applyJoystickForce(scene, player) {
    if (!player || !player.body) return;

    const fx = scene.joystickForceX;
    const fy = scene.joystickForceY;

    const moveLeft = fx < -0.15;
    const moveRight = fx > 0.15;
    const jump = fy < -0.6;
    const onGround = player.body.blocked.down || player.body.touching.down;

    // LEFT / RIGHT
    if (moveLeft) {
        player.moveLeft();
    } else if (moveRight) {
        player.moveRight();
    } else {
        player.stopMoving();
    }

    // JUMP
    if (jump && onGround) {
        player.jump();
    }
}
