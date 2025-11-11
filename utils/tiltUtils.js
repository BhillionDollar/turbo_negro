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
  const baseVelocity = 320; // base move speed in px/s

  const handleTilt = (event) => {
    if (!_state.player?.body) return;

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

    // Velocity & direction
    let vx = 0;
    if (abs > deadZone) {
      const ratio = (abs - deadZone) / (maxTilt - deadZone);
      vx = ratio * baseVelocity * Math.sign(t);
    }
    player.setVelocityX(vx);

    // Directional flip
    if (vx > 0) player.setFlipX(false);
    else if (vx < 0) player.setFlipX(true);

    // Animation state (only when grounded)
    const onGround = player.body.blocked.down || player.body.touching.down;
    if (onGround) {
      if (abs > deadZone) player.playSafe(`${player.texture.key}_walk`, true);
      else player.playSafe(`${player.texture.key}_idle`, true);
    }
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
