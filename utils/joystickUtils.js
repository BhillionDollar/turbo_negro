// utils/joystickUtils.js
// Bhillion Dollar — Mobile Joystick Utility (v2.1)
// Works seamlessly with tilt toggle + Level1 player dispatch

export function setupJoystick(scene, player) {
  const joystickArea = document.getElementById("joystick-area");
  let joystickKnob = document.getElementById("joystick-knob");

  if (!joystickArea) {
    console.warn("⚠️ Joystick area not found — skipping setup.");
    return;
  }

  if (!joystickKnob) {
    joystickKnob = document.createElement("div");
    joystickKnob.id = "joystick-knob";
    joystickArea.appendChild(joystickKnob);
  }

  let startX = 0,
    startY = 0,
    activeInterval = null;

  // --- Initialize force values
  scene.joystickForceX = 0;
  scene.joystickForceY = 0;

  // --- Handle touch start
  joystickArea.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    joystickKnob.style.transition = "none"; // Remove smooth delay for real-time response

    if (!activeInterval) {
      activeInterval = setInterval(() => applyJoystickForce(scene, player), 16);
    }
  });

  // --- Handle movement
  joystickArea.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const distance = Math.hypot(dx, dy);
    const maxDist = 50;

    const clampedX = (dx / distance) * Math.min(distance, maxDist);
    const clampedY = (dy / distance) * Math.min(distance, maxDist);

    joystickKnob.style.transform = `translate(calc(${clampedX}px - 50%), calc(${clampedY}px - 50%))`;
    scene.joystickForceX = clampedX / maxDist;
    scene.joystickForceY = clampedY / maxDist;
  });

  // --- Reset when touch ends
  joystickArea.addEventListener("touchend", () => {
    joystickKnob.style.transition = "transform 0.15s ease-out";
    joystickKnob.style.transform = "translate(-50%, -50%)";

    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    if (player) {
      player.setVelocityX(0);
      if (player.anims) player.play("idle", true);
    }

    clearInterval(activeInterval);
    activeInterval = null;
  });

  // --- Reset on orientation change
  window.addEventListener("orientationchange", () => {
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;
    if (player) {
      player.setVelocityX(0);
      if (player.anims) player.play("idle", true);
    }
    joystickKnob.style.transform = "translate(-50%, -50%)";
  });
}

// === Apply continuous joystick input ===
export function applyJoystickForce(scene, player) {
  if (!player || !player.body) return;

  const { joystickForceX, joystickForceY } = scene;
  const moveLeft = joystickForceX < -0.1;
  const moveRight = joystickForceX > 0.1;
  const jump = joystickForceY < -0.5;
  const onGround = player.body.blocked.down || player.body.touching.down;

  // Apply horizontal movement
  player.setVelocityX(joystickForceX * 160);

  // Flip direction visually
  if (moveLeft) player.setFlipX(true);
  else if (moveRight) player.setFlipX(false);

  // Jump logic
  if (jump && onGround) {
    player.setVelocityY(-500);
    if (player.anims) player.play("jump", true);
  }

  // Movement animations
  if ((moveLeft || moveRight) && onGround) {
    if (!player.anims.isPlaying || player.anims.currentAnim.key !== "walk") {
      player.play("walk", true);
    }
  } else if (onGround && !moveLeft && !moveRight) {
    if (!player.anims.isPlaying || player.anims.currentAnim.key !== "idle") {
      player.play("idle", true);
    }
  }
}
