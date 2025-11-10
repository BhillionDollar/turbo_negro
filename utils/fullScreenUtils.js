// utils/tiltUtils.js
// Smooth, orientation-aware tilt controls with enable/disable.

let _tiltListener = null;

export async function enableTiltControls(scene, player) {
  // Request permission on iOS 13+
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        console.warn('Motion permission denied; tilt disabled.');
        return;
      }
    } catch (e) {
      console.warn('Motion permission request failed; tilt disabled.', e);
      return;
    }
  }

  const smoothing = 0.2;
  let smoothed = 0;

  _tiltListener = (event) => {
    const isLandscape = window.innerWidth > window.innerHeight;
    const clockwise = (screen.orientation?.angle ?? 0) === 90;
    let tilt = isLandscape ? event.beta : event.gamma;

    if (tilt == null) return;

    const maxTilt = isLandscape ? 20 : 90;
    const dead = 6;
    const baseV = 320;
    const mult = isLandscape ? 1 : 1.75;
    const v = baseV * mult;

    tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
    if (isLandscape && !clockwise) tilt = -tilt;

    smoothed += (tilt - smoothed) * smoothing;

    if (smoothed > dead) {
      const pct = (smoothed - dead) / (maxTilt - dead);
      player.setVelocityX(pct * v);
      player.setFlipX(false);
      if (player.anims.currentAnim?.key !== 'walk') player.play('walk', true);
    } else if (smoothed < -dead) {
      const pct = (smoothed + dead) / (maxTilt - dead);
      player.setVelocityX(pct * v);
      player.setFlipX(true);
      if (player.anims.currentAnim?.key !== 'walk') player.play('walk', true);
    } else {
      player.setVelocityX(0);
      if (player.anims.currentAnim?.key !== 'idle') player.play('idle', true);
    }
  };

  window.addEventListener('deviceorientation', _tiltListener, { passive: true });
}

export function disableTiltControls() {
  if (_tiltListener) {
    window.removeEventListener('deviceorientation', _tiltListener);
    _tiltListener = null;
  }
}
