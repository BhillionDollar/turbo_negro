import { setupJoystick, applyJoystickForce } from './joystickUtils.js';
import { enableTiltControls, setTiltEnabled } from './tiltUtils.js';

let controlMode = 'joystick'; // 'joystick' or 'tilt'
let tiltListenerRegistered = false;

export function setupMobileControls(scene, player) {
  // Start with joystick as default mode
  controlMode = 'joystick';
  setTiltEnabled(false);

  // Initialize tilt (permission + listener), but keep it disabled until toggled
  initializeTiltControls(scene, player);

  // Initialize joystick controls & per-frame application
  initializeJoystick(scene, player);

  // Add swipe-to-jump functionality
  setupSwipeJump(scene, player);

  // Add tap-to-attack functionality (tap anywhere on screen)
  setupTapAttack(scene, player);

  // Add attack button functionality (UI button)
  setupAttackButton(scene, player);

  // Listen for global tilt toggle events from index.html
  if (!tiltListenerRegistered) {
    tiltListenerRegistered = true;

    window.addEventListener('bdp-toggle-tilt', (evt) => {
      const enabled = !!(evt.detail && evt.detail.enabled);
      controlMode = enabled ? 'tilt' : 'joystick';
      setTiltEnabled(enabled);

      if (enabled) {
        // Switching TO tilt: clear joystick forces so there is no conflict
        scene.joystickForceX = 0;
        scene.joystickForceY = 0;
        if (player && player.body) {
          player.setVelocityX(0);
        }
      } else {
        // Switching BACK to joystick: stop motion and reset to idle
        if (player && player.body) {
          player.setVelocityX(0);
          const onGround = player.body.blocked.down || player.body.touching.down;
          if (onGround) {
            playStateAnim(player, 'idle', true);
            player.mobileAnimState = 'idle';
          }
        }
      }
    });
  }
}

function initializeTiltControls(scene, player) {
  if (!window.DeviceOrientationEvent) {
    console.warn('Tilt controls unavailable on this device.');
    return;
  }

  // iOS needs an explicit permission request; non-iOS can proceed directly.
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // We call this once; if the user denies, tilt will simply remain inactive.
    DeviceOrientationEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          enableTiltControls(scene, player);
          setTiltEnabled(false); // still start in joystick mode
        } else {
          console.warn('Motion access denied. Staying on joystick.');
        }
      })
      .catch((error) => {
        console.error('Error requesting motion permission:', error);
      });
  } else {
    // Non-iOS or older browsers
    enableTiltControls(scene, player);
    setTiltEnabled(false); // still start in joystick mode
  }
}

function initializeJoystick(scene, player) {
  setupJoystick(scene, player);

  scene.events.on('update', () => {
    if (!player || !player.body) return;
    if (controlMode !== 'joystick') return;

    applyJoystickForce(scene, player);
  });
}

function setupSwipeJump(scene, player) {
  let startY = null;

  scene.input.on('pointerdown', (pointer) => {
    startY = pointer.y;
  });

  scene.input.on('pointerup', (pointer) => {
    if (startY === null) return;
    if (!player || !player.body) return;

    const onGround = player.body.blocked.down || player.body.touching.down;

    // Simple upward swipe detection
    if (pointer.y < startY - 50 && onGround) {
      player.setVelocityY(-500);
      playStateAnim(player, 'jump', false);
      player.mobileAnimState = 'jump';
    }

    startY = null;
  });
}

function setupTapAttack(scene, player) {
  scene.input.on('pointerdown', (pointer) => {
    if (!pointer.wasTouch) return; // Ensure it's a touch event (not mouse)
    fireProjectile(player);
  });
}

function setupAttackButton(scene, player) {
  const attackButton = document.getElementById('attack-button');
  if (attackButton) {
    attackButton.addEventListener('click', () => {
      fireProjectile(player);
    });
  } else {
    console.warn('Attack button not found in DOM.');
  }
}

function fireProjectile(player) {
  if (!player) return;

  // ✅ Use the same projectile system as desktop
  if (typeof player.fireProjectile === 'function') {
    player.fireProjectile();
  } else {
    console.warn('⚠️ fireProjectile() not found on player.');
  }
}

// === Shared animation helper (same mapping used by joystick/tilt) ===
function mapStateToAnim(player, state) {
  const texKey = (player.texture && player.texture.key) || '';
  const isTurbo = texKey.startsWith('turbo');
  const isRere = texKey.startsWith('rere');

  if (isTurbo) {
    if (state === 'idle') return 'turboStanding';
    if (state === 'walk') return 'turboWalk';
    if (state === 'jump') return 'turboJump';
  } else if (isRere) {
    if (state === 'idle') return 'rereIdle';
    if (state === 'walk') return 'rereWalk';
    if (state === 'jump') return 'rereJump';
  }

  // Fallback to generic state name if a custom anim doesn't exist.
  return state;
}

function playStateAnim(player, state, ignoreIfPlaying = true) {
  const animKey = mapStateToAnim(player, state);
  if (!animKey) return;

  if (typeof player.playSafe === 'function') {
    player.playSafe(animKey, ignoreIfPlaying);
  } else if (player.anims) {
    const current = player.anims.currentAnim?.key;
    if (current !== animKey) {
      player.play(animKey, ignoreIfPlaying);
    }
  }
}
