// utils/mobileControls.js
// Hybrid mobile controls with a persistent Joystick ↔ Tilt toggle.

import * as J from './joystickUtils.js';
import * as T from './tiltUtils.js';

const UA_IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function el(id) { return document.getElementById(id); }

function ensureMobileUiRoot() {
  let root = el('mobile-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'mobile-ui';
    document.body.appendChild(root);
  }
  // Base styles so it never blocks gameplay visuals
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',       // children re-enable as needed
    zIndex: 1000
  });
  return root;
}

function makeToggleButton(currentMode) {
  let btn = el('control-toggle');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'control-toggle';
    el('mobile-ui').appendChild(btn);
  }
  btn.type = 'button';
  btn.textContent = currentMode === 'tilt' ? '🌀 Tilt' : '🎮 Joystick';
  Object.assign(btn.style, {
    position: 'absolute',
    right: '12px',
    bottom: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '10px',
    border: 'none',
    pointerEvents: 'auto',
    backdropFilter: 'blur(6px)',
    background: 'rgba(0,0,0,0.4)',
    color: '#fff',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
  });
  return btn;
}

/**
 * Public: attach controls for mobile. No-op on desktop.
 * - Adds a persistent toggle for Joystick/Tilt (localStorage: controlMode).
 * - Wires update loop to whichever mode is active.
 */
export function setupMobileControls(scene, player) {
  if (!UA_IS_MOBILE) return; // Desktop: skip

  ensureMobileUiRoot();

  // read preference (default: joystick)
  let mode = localStorage.getItem('controlMode') || 'joystick';

  // state holders
  let joystick = null;
  let tilt = null;

  const activateJoystick = () => {
    // disable tilt if active
    if (tilt) { tilt.disable(); tilt = null; }
    if (!joystick) joystick = J.createJoystick({ parent: el('mobile-ui') });
    J.showJoystick(joystick);
    mode = 'joystick';
    localStorage.setItem('controlMode', mode);
    refreshToggleUi();
  };

  const activateTilt = async () => {
    // clean joystick if active
    if (joystick) J.hideJoystick(joystick);
    // enable tilt (requests permission on iOS if needed)
    if (!tilt) tilt = T.enableTilt();
    mode = 'tilt';
    localStorage.setItem('controlMode', mode);
    refreshToggleUi();
  };

  const toggleBtn = makeToggleButton(mode);
  toggleBtn.onclick = async () => {
    if (mode === 'joystick') {
      await activateTilt();
    } else {
      activateJoystick();
    }
  };

  function refreshToggleUi() {
    toggleBtn.textContent = mode === 'tilt' ? '🌀 Tilt' : '🎮 Joystick';
  }

  // Initialize preferred mode
  if (mode === 'tilt') {
    activateTilt();
  } else {
    activateJoystick();
  }

  // Map control vectors into player movement on every frame
  const updateHandler = () => {
    if (!player || !player.body) return;

    if (mode === 'joystick' && joystick) {
      const v = J.getVector(joystick); // { x, y, mag }
      // Horizontal
      if (Math.abs(v.x) > 0.08) {
        player.setVelocityX(v.x * (player.speed || 220));
        if (v.x < 0) player._setFacing?.(-1);
        if (v.x > 0) player._setFacing?.(1);
      } else {
        // let existing keyboard or inertia handle if needed; otherwise stop
        if (!player.isAttacking) player.setVelocityX(0);
      }
      // Jump on upward drag (optional: simple threshold)
      if (v.y < -0.65 && player.body.blocked.down) {
        player.jump?.();
      }
    }

    if (mode === 'tilt' && tilt) {
      const ax = T.getAxisX(); // -1..+1
      if (Math.abs(ax) > 0.05) {
        player.setVelocityX(ax * (player.speed || 220));
        if (ax < 0) player._setFacing?.(-1);
        if (ax > 0) player._setFacing?.(1);
      } else {
        if (!player.isAttacking) player.setVelocityX(0);
      }
      // Jump with quick "jerk up" gesture if you want later (currently off)
    }
  };

  scene.events.on('update', updateHandler);

  // Cleanup on scene shutdown/destroy
  const cleanup = () => {
    scene.events.off('update', updateHandler);
    if (joystick) { J.destroyJoystick(joystick); joystick = null; }
    if (tilt) { tilt.disable(); tilt = null; }
    toggleBtn?.remove?.();
  };
  scene.events.once('shutdown', cleanup);
  scene.events.once('destroy', cleanup);
}

export default { setupMobileControls };
