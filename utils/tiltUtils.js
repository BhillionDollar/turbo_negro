// utils/tiltUtils.js
// Handles motion-based (tilt) controls for mobile — unified 2025 version

let state = {
  scene: null,
  player: null,
  enabled: false,
  sensitivity: 6, // ← tuned to feel identical to joystick speed 180
  listener: null,
};

export function enableTiltControls(scene, player) {
  if (state.enabled) return;

  state.scene = scene;
  state.player = player;

  const handleTilt = (event) => {
    if (!state.player?.body) return;
    const gamma = event.gamma;
    if (gamma == null) return;

    const clamped = Math.max(-30, Math.min(30, gamma));
    const velocityX = (clamped / 30) * (state.sensitivity * 30); // normalized curve
    player.setVelocityX(velocityX);

    const grounded = player.body.blocked.down || player.body.touching.down;

    if (velocityX > 1) {
      player.setFlipX(false);
      if (grounded) player.playSafe(`${player.texture.key}_walk`, true);
    } else if (velocityX < -1) {
      player.setFlipX(true);
      if (grounded) player.playSafe(`${player.texture.key}_walk`, true);
    } else {
      if (grounded) player.playSafe(`${player.texture.key}_idle`, true);
    }
  };

  state.listener = handleTilt;
  window.addEventListener('deviceorientation', handleTilt);
  state.enabled = true;
}

export function disableTiltControls() {
  if (!state.enabled) return;
  window.removeEventListener('deviceorientation', state.listener);
  state.listener = null;
  state.enabled = false;
}
