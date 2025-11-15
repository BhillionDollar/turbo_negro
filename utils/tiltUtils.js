// utils/tiltUtils.js
// Option 1: EXCLUSIVE tilt mode. Either tilt OR joystick, never both.

let tiltState = {
  scene: null,
  player: null,
  enabled: false,
  smoothedGamma: 0,
  listener: null,
};

function handleOrientation(event) {
  if (!tiltState.enabled || !tiltState.player) return;

  const { gamma } = event; // left/right tilt
  if (gamma == null) return;

  // Dead zone so tiny shakes don't move the player
  const deadZone = 8; // degrees
  if (Math.abs(gamma) < deadZone) {
    tiltState.smoothedGamma = 0;
  } else {
    // Clamp tilt range
    const maxTilt = 35;
    const clamped = Math.max(-maxTilt, Math.min(maxTilt, gamma));

    // Basic smoothing
    const alpha = 0.2; // lower = smoother/slower
    tiltState.smoothedGamma =
      tiltState.smoothedGamma + alpha * (clamped - tiltState.smoothedGamma);
  }

  const maxTilt = 35;
  const normalized = tiltState.smoothedGamma / maxTilt; // -1 → 1

  // Decide movement based on normalized tilt
  const threshold = 0.15; // how much tilt before we move

  if (normalized > threshold) {
    // Move right
    if (typeof tiltState.player.moveRight === 'function') {
      tiltState.player.moveRight();
    }
  } else if (normalized < -threshold) {
    // Move left
    if (typeof tiltState.player.moveLeft === 'function') {
      tiltState.player.moveLeft();
    }
  } else {
    // Stop if inside dead zone
    if (typeof tiltState.player.stopMoving === 'function') {
      tiltState.player.stopMoving();
    }
  }
}

/**
 * Call this once per scene when the player is created.
 */
export function enableTiltControls(scene, player) {
  tiltState.scene = scene;
  tiltState.player = player;

  if (!tiltState.listener) {
    tiltState.listener = handleOrientation;
    window.addEventListener('deviceorientation', tiltState.listener);
  }
}

/**
 * Turn tilt on/off from outside (mobileControls or the tilt toggle button).
 */
export function setTiltEnabled(enabled) {
  tiltState.enabled = enabled;

  // When disabling tilt, make sure we stop any leftover movement.
  if (!enabled && tiltState.player && typeof tiltState.player.stopMoving === 'function') {
    tiltState.player.stopMoving();
  }
}

/**
 * Clean up when the scene shuts down.
 */
export function disableTiltControls() {
  tiltState.enabled = false;
  if (tiltState.listener) {
    window.removeEventListener('deviceorientation', tiltState.listener);
    tiltState.listener = null;
  }
}
