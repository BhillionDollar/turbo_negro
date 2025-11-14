// utils/mobileControls.js
// 🌀 Unified mobile controls — joystick, tilt, swipe-jump, tap attack, with live toggle support.

import { setupJoystick, destroyJoystick, applyJoystickForce } from './joystickUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';

export function setupMobileControls(scene, player) {
  // === Determine active control mode from storage ===
  let mode = localStorage.getItem('controlMode') || 'joystick';

  // === Initial setup based on saved mode ===
  if (mode === 'tilt') {
    hideJoystickUI(true);
    enableTiltControls(scene, player);
  } else {
    hideJoystickUI(false);
    setupJoystick(scene, player);
  }

  // === Swipe Jump + Tap Attack + Dedicated Button ===
  setupSwipeJump(scene, player);
  setupTapAttack(scene, player);
  setupAttackButton(scene, player);

  // === Stop scroll behavior on UI elements ===
  stopScrollOnControl('joystick-area');
  stopScrollOnControl('attack-button');

  // === Drive movement each frame (tilt modifies velocity/movement directly) ===
  const updateFromJoystick = () => {
    if (!player?.body || mode === 'tilt') return; // skip if tilt mode
    // Delegate to joystickUtils → BaseFighter movement helpers
    applyJoystickForce(scene, player, { speed: 200, deadzone: 0.12 });
  };

  scene.events.on('update', updateFromJoystick);
  scene.events.once('shutdown', () => {
    scene.events.off('update', updateFromJoystick);
  });

  // === Listen for ControlManager tilt toggle ===
  window.addEventListener('bdp-toggle-tilt', (e) => {
    const newMode = e.detail.mode;
    mode = newMode;
    localStorage.setItem('controlMode', newMode);

    if (newMode === 'tilt') {
      console.log('[mobileControls] Switching to Tilt');
      destroyJoystick?.();
      hideJoystickUI(true);
      enableTiltControls(scene, player);
    } else {
      console.log('[mobileControls] Switching to Joystick');
      disableTiltControls();
      hideJoystickUI(false);
      setupJoystick(scene, player);
    }
  });
}

// === Swipe up to jump ===
function setupSwipeJump(scene, player) {
  let startY = null;
  scene.input.on('pointerdown', (p) => (startY = p.y));
  scene.input.on('pointerup', (p) => {
    if (startY == null) return;
    const onGround = player.body?.blocked.down || player.body?.touching.down;
    if (p.y < startY - 50 && onGround) {
      if (typeof player.jump === 'function') {
        player.jump();
      } else {
        player.setVelocityY(-500);
        if (typeof player.getMobileAnim === 'function') {
          const anim = player.getMobileAnim('jump');
          if (anim) player.playSafe(anim, true);
        } else if (player.playSafe) {
          player.playSafe('jump', true);
        }
      }
    }
    startY = null;
  });
}

// === Tap screen to attack ===
function setupTapAttack(scene, player) {
  scene.input.on('pointerdown', (pointer) => {
    const target = pointer?.event?.target?.id;
    if (['joystick-area', 'joystick-knob', 'attack-button'].includes(target)) return;
    if (pointer.wasTouch && player?.attack) player.attack();
  });
}

// === Attack button ===
function setupAttackButton(scene, player) {
  const btn = document.getElementById('attack-button');
  if (!btn) return;
  const fire = (e) => {
    e.preventDefault();
    player?.attack?.();
  };
  btn.addEventListener('touchstart', fire, { passive: false });
  btn.addEventListener('click', fire, { passive: false });
}

// === Prevent touch scroll on joystick + attack ===
function stopScrollOnControl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  el.addEventListener('touchstart', stop, { passive: false });
  el.addEventListener('touchmove', stop, { passive: false });
  el.addEventListener('touchend', (e) => e.stopPropagation(), { passive: false });
  el.addEventListener('gesturestart', stop, { passive: false });
}

// === Toggle joystick visibility when tilt is active ===
function hideJoystickUI(hide) {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');
  const label = document.getElementById('joystick');
  if (!area) return;
  area.style.display = hide ? 'none' : 'block';
  if (knob) knob.style.display = hide ? 'none' : 'block';
  if (label) label.style.display = hide ? 'none' : 'block';
}
