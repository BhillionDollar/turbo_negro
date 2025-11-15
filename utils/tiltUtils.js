// utils/tiltUtils.js
// Recreates original tilt behavior but exposes values for hybrid control:
// - Orientation aware (beta in landscape, gamma in portrait)
// - Smoothing
// - Dead zone
// - Portrait speed boost
// Joystick can then amplify this tilt movement.

let tiltState = {
  enabled: false,
  smoothedTilt: 0,
  velX: 0,
  direction: 0,           // -1 left, 1 right, 0 idle
  adjustedVelocity: 0,    // max tilt speed for current orientation
  listener: null,
};

const SMOOTHING_FACTOR = 0.2; // original smoothing
const DEAD_ZONE = 6;          // original dead zone
const BASE_VELOCITY = 320;    // original base velocity

function handleOrientation(event) {
  if (!tiltState.enabled) return;

  // Determine orientation
  const isLandscape = window.innerWidth > window.innerHeight;
  const isClockwise = (screen.orientation && typeof screen.orientation.angle === 'number')
    ? screen.orientation.angle === 90
    : true; // fall back to normal

  // Read tilt depending on orientation (original logic)
  let rawTilt = isLandscape ? event.beta : event.gamma;
  if (rawTilt == null) return;

  // Normalize + clamp
  const maxTilt = isLandscape ? 20 : 90;        // original ranges
  const velocityMultiplier = isLandscape ? 1 : 1.75; // original portrait boost
  const adjustedVelocity = BASE_VELOCITY * velocityMultiplier;

  rawTilt = Math.max(-maxTilt, Math.min(maxTilt, rawTilt));

  // Reverse in landscape if counter-clockwise (original behavior)
  if (isLandscape && !isClockwise) {
    rawTilt = -rawTilt;
  }

  // Exponential smoothing (original feel)
  tiltState.smoothedTilt += (rawTilt - tiltState.smoothedTilt) * SMOOTHING_FACTOR;
  const s = tiltState.smoothedTilt;

  let velX = 0;
  let dir = 0;

  if (s > DEAD_ZONE) {
    const factor = (s - DEAD_ZONE) / (maxTilt - DEAD_ZONE); // 0 → 1
    velX = factor * adjustedVelocity;
    dir = 1;
  } else if (s < -DEAD_ZONE) {
    const factor = (s + DEAD_ZONE) / (maxTilt - DEAD_ZONE); // 0 → -1
    velX = factor * adjustedVelocity;
    dir = -1;
  } else {
    velX = 0;
    dir = 0;
  }

  tiltState.velX = velX;
  tiltState.direction = dir;
  tiltState.adjustedVelocity = adjustedVelocity;
}

// === PUBLIC API =========================================================

export function enableTiltControls(scene, player) {
  // scene/player kept for compatibility, but movement is driven elsewhere
  if (!tiltState.listener) {
    tiltState.listener = handleOrientation;
    window.addEventListener('deviceorientation', tiltState.listener);
  }
  tiltState.enabled = true;
}

export function setTiltEnabled(enabled) {
  tiltState.enabled = enabled;

  if (!enabled) {
    // Reset tilt so we don't leave residual movement when toggling off
    tiltState.smoothedTilt = 0;
    tiltState.velX = 0;
    tiltState.direction = 0;
    tiltState.adjustedVelocity = 0;
  }
}

export function disableTiltControls() {
  tiltState.enabled = false;
  if (tiltState.listener) {
    window.removeEventListener('deviceorientation', tiltState.listener);
    tiltState.listener = null;
  }
  tiltState.smoothedTilt = 0;
  tiltState.velX = 0;
  tiltState.direction = 0;
  tiltState.adjustedVelocity = 0;
}

// Main hook used by joystickUtils/applyJoystickForce
export function getTiltInfo() {
  return {
    enabled: tiltState.enabled,
    velX: tiltState.velX || 0,
    direction: tiltState.direction || 0,
    adjustedVelocity: tiltState.adjustedVelocity || 0,
  };
}
