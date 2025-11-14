// utils/tiltUtils.js
// Unified tilt controls for mobile (iOS/Android) with smoothing + safe enable/disable
// Compatible with Turbo Negro 2025 control architecture

let _state = {
  scene: null,
  player: null,
  listener: null,
  enabled: false,
  smoothing: 0.15,
  smoothedTilt: 0,
};

export async function enableTiltControls(scene, player) {
  if (_state.enabled || !scene || !player) return;

  // iOS 13+ requires explicit permission for motion sensors
  if (
    window.DeviceOrientationEvent &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        console.warn('Tilt controls: motion permission denied');
        return;
      }
    } catch (err) {
      console.warn('Tilt controls: permission request failed', err);
      return;
    }
  }

  _state.scene = scene;
  _state.player = player;
  _state.enabled = true;
  _state.smoothedTilt = 0;

  const maxTilt = 30;      // degrees to clamp at
  const deadZone = 4;      // degrees to ignore minor jitter
  const baseVelocity = 320; // fallback move speed in px/s (if fighter helpers missing)

  const handleTilt = (event) => {
    const player = _state.player;
    if (!player?.body) return;

    // Landscape detection + orientation correction
    const isLandscape = window.innerWidth > window.innerHeight;
    const clockwise = (screen.orientation?.angle ?? 0) === 90;

    let tilt = isLandscape ? event.beta : event.gamma;
    if (tilt == null) return;

    // Clamp and smooth
    tilt = Math.max(-maxTilt, Math.min(maxTilt, tilt));
    if (isLandscape && !clockwise) tilt = -tilt;
    _state.smoothedTilt += (tilt - _state.smoothedTilt) * _state.smoothing;

    const t = _state.smoothedTilt;
    const abs = Math.abs(t);

    const hasMoveLeft = typeof player.moveLeft === 'function';
    const hasMoveRight = typeof player.moveRight === 'function';
    const hasStopMoving = typeof player.stopMoving === 'function';

    if (abs <= deadZone) {
      if (hasStopMoving) {
        player.stopMoving();
      } else {
        player.setVelocityX(0);
      }
      return;
    }

    const dir = Math.sign(t);

    if (dir > 0) {
      if (hasMoveRight) {
        player.moveRight();
      } else {
        player.setVelocityX(baseVelocity);
      }
    } else if (dir < 0) {
      if (hasMoveLeft) {
        player.moveLeft();
      } else {
        player.setVelocityX(-baseVelocity);
      }
    }
    // Animations are handled by BaseFighter movement helpers
  };

  _state.listener = handleTilt;
  window.addEventListener('deviceorientation', handleTilt, { passive: true });

  console.log('✅ Tilt controls enabled');
}

export function disableTiltControls() {
  if (!_state.enabled) return;
  window.removeEventListener('deviceorientation', _state.listener);
  _state.listener = null;
  _state.scene = null;
  _state.player = null;
  _state.enabled = false;
  console.log('⏹️ Tilt controls disabled');
}
