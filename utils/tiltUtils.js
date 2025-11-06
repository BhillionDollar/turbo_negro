// utils/tiltUtils.js
// ============================================================
// Bhillion Dollar — Turbo Negro Tilt Control Utility
// Enhanced version with iOS permission support, smoothing, and toggle logic
// ============================================================

let tiltEnabled = false;
let currentTiltHandler = null;

/**
 * Enable tilt controls for the given scene + player.
 * Adds deviceorientation listener with smoothing and safe permission handling.
 */
export function enableTiltControls(scene, player) {
  if (!player) {
    console.warn('⚠️ TiltControls: No player object found.');
    return;
  }

  // Prevent multiple listeners
  if (tiltEnabled && currentTiltHandler) {
    window.removeEventListener('deviceorientation', currentTiltHandler);
  }

  let smoothedTilt = 0;
  const smoothingFactor = 0.2;

  currentTiltHandler = (event) => {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isClockwise = screen.orientation?.angle === 90;

    let tilt = isLandscape ? event.beta : event.gamma;
    if (tilt == null) return;

    const maxTilt = isLandscape ? 20 : 90;
    const deadZone = 6;
    const baseVelocity = 320;
    const velocityMultiplier = isLandscape ? 1 : 1.75;
    const adjustedVelocity = baseVelocity * velocityMultiplier;

    // Clamp tilt range
    tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
    if (isLandscape && !isClockwise) tilt = -tilt;

    // Smooth transition
    smoothedTilt += (tilt - smoothedTilt) * smoothingFactor;

    // Apply movement based on smoothed tilt
    if (smoothedTilt > deadZone) {
      player.setVelocityX(
        ((smoothedTilt - deadZone) / (maxTilt - deadZone)) * adjustedVelocity
      );
      player.setFlipX(false);
      if (player.anims?.currentAnim?.key !== 'walk') player.play('walk', true);
    } else if (smoothedTilt < -deadZone) {
      player.setVelocityX(
        ((smoothedTilt + deadZone) / (maxTilt - deadZone)) * adjustedVelocity
      );
      player.setFlipX(true);
      if (player.anims?.currentAnim?.key !== 'walk') player.play('walk', true);
    } else {
      player.setVelocityX(0);
      if (player.anims?.currentAnim?.key !== 'idle') player.play('idle', true);
    }
  };

  // 🔐 Handle iOS 13+ permission requirement
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    DeviceMotionEvent.requestPermission
  ) {
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        if (response === 'granted') {
          console.log('✅ Tilt controls enabled with permission.');
          window.addEventListener('deviceorientation', currentTiltHandler);
          tiltEnabled = true;
        } else {
          console.warn('🚫 Tilt access denied. Using joystick fallback.');
          tiltEnabled = false;
        }
      })
      .catch((err) => {
        console.error('❌ Tilt permission error:', err);
        tiltEnabled = false;
      });
  } else {
    // Android / desktop browsers
    window.addEventListener('deviceorientation', currentTiltHandler);
    tiltEnabled = true;
  }
}

/**
 * Disable active tilt controls and remove listener.
 */
export function disableTiltControls() {
  if (tiltEnabled && currentTiltHandler) {
    window.removeEventListener('deviceorientation', currentTiltHandler);
    tiltEnabled = false;
    console.log('🛑 Tilt controls disabled.');
  }
}

/**
 * Toggle between joystick and tilt controls.
 */
export function toggleTiltControls(scene, player) {
  if (tiltEnabled) {
    disableTiltControls();
    return 'joystick';
  } else {
    enableTiltControls(scene, player);
    return 'tilt';
  }
}
