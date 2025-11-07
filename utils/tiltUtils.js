// utils/tiltUtils.js
// Handles motion-based (tilt) controls for mobile platforms

let state = {
  scene: null,
  player: null,
  enabled: false,
  sensitivity: 2,
  listener: null,
};

export function enableTiltControls(scene, player) {
  if (state.enabled) return;

  state.scene = scene;
  state.player = player;

  const handleTilt = (event) => {
    if (!state.player || !state.player.body) return;
    const gamma = event.gamma;
    if (gamma === null || gamma === undefined) return;

    const clamped = Math.max(-30, Math.min(30, gamma));
    const velocityX = clamped * state.sensitivity;
    state.player.setVelocityX(velocityX);

    // Optional: flip and walk animation logic
    const grounded = player.body.blocked.down || player.body.touching.down;
    if (velocityX > 0) {
      player.setFlipX(false);
      if (grounded) player.anims.play('walk', true);
    } else if (velocityX < 0) {
      player.setFlipX(true);
      if (grounded) player.anims.play('walk', true);
    } else {
      if (grounded) player.anims.play('idle', true);
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
