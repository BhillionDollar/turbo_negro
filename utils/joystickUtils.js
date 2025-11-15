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
      // Do NOT force idle here; final movement/anim handled in applyJoystickForce
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

  area.addEventListener('touchend', () => {
    resetJoystick();
  });

  // Orientation reset
  window.addEventListener('orientationchange', resetJoystick);

  // Init
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
  let facingDir = 0; // -1 left, 1 right

  if (tiltEnabled && tiltMax > 0) {
    // 🎛 Tilt is base movement, joystick amplifies it
    const amplifierStrength = AMPLIFIER_PERCENT * tiltMax; // 70% of tilt max speed
    const joystickBoost = fx * amplifierStrength;
    finalVelX = tiltVelX + joystickBoost;

    if (Math.abs(fx) > JOYSTICK_DEAD_ZONE) {
      facingDir = fx > 0 ? 1 : -1;
    } else if (tiltVelX !== 0) {
      facingDir = tiltVelX > 0 ? 1 : -1;
    }
  } else {
    // 🎮 Tilt disabled → pure joystick control (original)
    finalVelX = fx * JOYSTICK_SPEED;

    if (Math.abs(fx) > JOYSTICK_DEAD_ZONE) {
      facingDir = fx > 0 ? 1 : -1;
    }
  }

  // Apply final horizontal velocity
  player.setVelocityX(finalVelX);

  // Facing
  if (facingDir !== 0) {
    player.setFlipX(facingDir < 0);
  }

  const onGround =
    player.body.blocked.down || player.body.touching.down || false;
  const isMovingHoriz = Math.abs(finalVelX) > 5;

  // Jump via joystick up
  const wantsJump = fy < JUMP_THRESHOLD;

  if (wantsJump && onGround) {
    if (typeof player.jump === 'function') {
      player.jump();
    } else {
      player.setVelocityY(-500);
      const jumpAnim =
        typeof player.getMobileAnim === 'function'
          ? player.getMobileAnim('jump')
          : 'jump';
      if (jumpAnim) {
        if (typeof player.playSafe === 'function') {
          player.playSafe(jumpAnim, true);
        } else if (player.anims) {
          player.play(jumpAnim, true);
        }
      }
    }
    return;
  }

  // Animations based on movement state
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
