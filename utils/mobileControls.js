// utils/mobileControls.js
// MOBILE → hybrid tilt + joystick system:
// - Tilt ON → tilt drives, joystick amplifies & steers
// - Tilt OFF → joystick full control
// Animations are handled via BaseFighter.getMobileAnim + playSafe.

import { setupJoystick, applyJoystickForce } from './joystickUtils.js';
import { enableTiltControls, setTiltEnabled } from './tiltUtils.js';

let tiltListenerRegistered = false;

export function setupMobileControls(scene, player) {
  // Disable desktop keyboard controls on mobile
  if (scene.input.keyboard) {
    scene.input.keyboard.enabled = false;
  }

  // Start in joystick-only mode
  setTiltEnabled(false);

  // Initialize tilt permissions + listener
  initializeTilt(scene, player);

  // Initialize joystick
  initializeJoystick(scene, player);

  // Swipe jump
  setupSwipeJump(scene, player);

  // Tap anywhere to attack
  setupTapAttack(scene, player);

  // Attack button
  setupAttackButton(scene, player);

  // Hook into tilt toggle events from the UI (ControlManager / checkbox)
  if (!tiltListenerRegistered) {
    tiltListenerRegistered = true;

    window.addEventListener('bdp-toggle-tilt', (evt) => {
      const enabled = !!(evt.detail && evt.detail.enabled);
      setTiltEnabled(enabled);

      if (!enabled) {
        // Switching to joystick-only: clean stop, joystick will drive movement
        player.setVelocityX(0);
      } else {
        // Hybrid mode: reset joystick for a clean feel
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        player.setVelocityX(0);
      }

      console.log(`🎛 Tilt mode ${enabled ? 'ENABLED (hybrid)' : 'DISABLED (joystick only)'}`);
    });
  }

  // Make sure joystick and attack button don't interfere
  const joystickArea = document.getElementById('joystick-area');
  const attackButton = document.getElementById('attack-button');

  if (joystickArea) {
    joystickArea.addEventListener('touchstart', (event) => {
      event.stopPropagation();
    });
  }

  if (attackButton) {
    attackButton.addEventListener('touchstart', (event) => {
      event.stopPropagation();
    });
  }
}

function initializeTilt(scene, player) {
  if (!window.DeviceOrientationEvent) {
    console.warn('Tilt controls unavailable on this device.');
    return;
  }

  const requestPermission = DeviceOrientationEvent.requestPermission;
  if (typeof requestPermission === 'function') {
    // iOS motion permission
    requestPermission()
      .then((res) => {
        if (res === 'granted') {
          enableTiltControls(scene, player);
          setTiltEnabled(false); // start as joystick-only until user toggles tilt
        } else {
          console.warn('Motion access denied. Staying in joystick-only mode.');
        }
      })
      .catch((err) => {
        console.error('Error requesting motion permission:', err);
      });
  } else {
    // Non-iOS / older devices
    enableTiltControls(scene, player);
    setTiltEnabled(false); // joystick-only until toggled
  }
}

function initializeJoystick(scene, player) {
  setupJoystick(scene, player);

  // 🔁 Apply hybrid movement every frame
  scene.events.on('update', () => {
    applyJoystickForce(scene, player);
  });
}

function setupSwipeJump(scene, player) {
  let startY = null;

  scene.input.on('pointerdown', (p) => {
    startY = p.y;
  });

  scene.input.on('pointerup', (p) => {
    if (startY == null) return;

    const onGround = player.body.blocked.down || player.body.touching.down;
    if (p.y < startY - 50 && onGround) {
      if (typeof player.jump === 'function') {
        player.jump();
      } else {
        player.setVelocityY(-500);
      }
    }
    startY = null;
  });
}

function setupTapAttack(scene, player) {
  scene.input.on('pointerdown', (p) => {
    if (!p.wasTouch) return; // Ensure it's a touch event
    if (typeof player.attack === 'function') {
      player.attack();
    }
  });
}

function setupAttackButton(scene, player) {
  const btn = document.getElementById('attack-button');
  if (!btn) {
    console.warn('Attack button not found in DOM.');
    return;
  }

  const fire = (e) => {
    e.preventDefault();
    if (typeof player.attack === 'function') {
      player.attack();
    }
  };

  btn.addEventListener('touchstart', fire, { passive: false });
  btn.addEventListener('click', fire, { passive: false });
}
