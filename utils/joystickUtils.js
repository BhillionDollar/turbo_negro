// utils/joystickUtils.js
// Hybrid controller:
// - When tilt is enabled: tilt is base, joystick amplifies (70% of tilt max speed) + sets direction
// - When tilt is disabled: joystick fully controls movement (original behavior)

import { getTiltInfo } from './tiltUtils.js';

const JOYSTICK_SPEED = 160; // original joystick speed
const JOYSTICK_DEAD_ZONE = 0.10;
const JUMP_THRESHOLD = -0.50;
const AMPLIFIER_PERCENT = 0.7; // 70% of tilt max speed

export function setupJoystick(scene, player) {
  const area = document.getElementById('joystick-area');
  if (!area) {
    console.warn('⚠️ joystick-area not found in DOM.');
    return;
  }

  let knob = document.getElementById('joystick-knob');
  if (!knob) {
    knob = document.createElement('div');
    knob.id = 'joystick-knob';
    area.appendChild(knob);
  }

  let startX = 0;
  let startY = 0;

  const resetJoystick = () => {
    knob.style.transform = 'translate(-50%, -50%)';
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    if (player) {
      player.setVelocityX(0);
    }
  };

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

    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const maxDist = 50;

    const clampedX = (dx / dist) * Math.min(dist, maxDist);
    const clampedY = (dy / dist) * Math.min(dist, maxDist);

    knob.style.transform = `translate(calc(${clampedX}px - 50%), calc(${clampedY}px - 50%))`;

    scene.joystickForceX = clampedX / maxDist; // -1 → 1
    scene.joystickForceY = clampedY / maxDist; // -1 → 1 (up = negative)
  });

  area.addEventListener('touchend', resetJoystick);

  window.addEventListener('orientationchange', resetJoystick);

  scene.joystickForceX = 0;
  scene.joystickForceY = 0;
}

export function applyJoystickForce(scene, player) {
  if (!player || !player.body) return;

  const fx = scene.joystickForceX || 0;
  const fy = scene.joystickForceY || 0;

  const tilt = getTiltInfo();
  const tiltEnabled = tilt.enabled;
  const tiltVelX = tilt.velX || 0;
  const tiltMax = tilt.adjustedVelocity || 0;

  let finalVelX = 0;
  let steeringDir = 0; // -1 left, 1 right

  // === JOYSTICK ACTIVE → joystick steering wins
  const joystickActive = Math.abs(fx) > JOYSTICK_DEAD_ZONE;

  // === HYBRID MOVEMENT (Tilt ON)
  if (tiltEnabled && tiltMax > 0) {
    const amplifierStrength = AMPLIFIER_PERCENT * tiltMax;
    const joystickBoost = fx * amplifierStrength;

    // Tilt is base movement
    finalVelX = tiltVelX + joystickBoost;

    if (joystickActive) {
      steeringDir = fx > 0 ? 1 : -1;
    } else if (tiltVelX !== 0) {
      steeringDir = tiltVelX > 0 ? 1 : -1;
    }

  } else {
    // === JOYSTICK ONLY MODE
    finalVelX = fx * JOYSTICK_SPEED;

    if (joystickActive) {
      steeringDir = fx > 0 ? 1 : -1;
    }
  }

  // === Apply velocity
  player.setVelocityX(finalVelX);

  // ============================================================
  // === FINAL FACING LOGIC (MOST IMPORTANT PART)
  // joystick steering > tilt steering > do nothing
  // ============================================================
  if (joystickActive) {
    // Joystick steering
    player.setFlipX(steeringDir < 0);

    if (typeof player._setFacing === 'function') {
      player._setFacing(steeringDir);
    } else {
      player.lastDirection = steeringDir;
    }

  } else if (tiltEnabled && tilt.direction !== 0) {
    // Tilt steering when joystick neutral
    const tiltDir = tilt.direction;

    player.setFlipX(tiltDir < 0);

    if (typeof player._setFacing === 'function') {
      player._setFacing(tiltDir);
    } else {
      player.lastDirection = tiltDir;
    }
  }

  // ============================================================

  const onGround =
    player.body.blocked.down || player.body.touching.down || false;
  const isMovingHoriz = Math.abs(finalVelX) > 5;

  // === Jumping
  const wantsJump = fy < JUMP_THRESHOLD;

  if (wantsJump && onGround) {
    if (typeof player.jump === 'function') {
      player.jump();
    } else {
      player.setVelocityY(-500);
    }
    return;
  }

  // === Animations
  let animKey = null;

  if (!onGround) {
    animKey =
      typeof player.getMobileAnim === 'function'
        ? player.getMobileAnim('jump')
        : 'jump';

  } else if (isMovingHoriz) {
    animKey =
      typeof player.getMobileAnim === 'function'
        ? player.getMobileAnim('walk')
        : 'walk';

  } else {
    animKey =
      typeof player.getMobileAnim === 'function'
        ? player.getMobileAnim('idle')
        : 'idle';
  }

  if (animKey) {
    if (typeof player.playSafe === 'function') {
      player.playSafe(animKey, true);
    } else if (player.anims) {
      if (!player.anims.currentAnim || player.anims.currentAnim.key !== animKey) {
        player.play(animKey, true);
      }
    }
  }
}
