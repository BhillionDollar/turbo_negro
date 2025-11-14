// utils/tiltUtils.js
// Tilt-based movement for mobile, with smooth animations and toggle support.

let tiltEnabled = false;
let tiltState = {
  scene: null,
  player: null,
  initialized: false,
  smoothedTilt: 0,
};

// Public API: called once from mobileControls to wire deviceorientation.
export function enableTiltControls(scene, player) {
  tiltState.scene = scene;
  tiltState.player = player;

  if (tiltState.initialized) {
    return;
  }
  tiltState.initialized = true;

  window.addEventListener('deviceorientation', (event) => {
    if (!tiltEnabled) return;

    const p = tiltState.player;
    if (!p || !p.body) return;

    let tilt;
    const isLandscape = window.innerWidth > window.innerHeight;
    const orientation = (screen.orientation && typeof screen.orientation.angle === 'number')
      ? screen.orientation.angle
      : window.orientation || 0;
    const isClockwise = orientation === 90;

    // Use beta for landscape, gamma for portrait
    tilt = isLandscape ? event.beta : event.gamma;
    if (tilt == null) return;

    // === Sensitivity settings (Option 3: midpoint between aggressive and stable) ===
    const maxTilt = isLandscape ? 35 : 75;   // degrees
    const deadZone = 8;                      // degrees
    const baseVelocity = 340;
    const velocityMultiplier = isLandscape ? 1.3 : 1.4;
    const smoothingFactor = 0.2;

    // Clamp tilt
    let t = Math.max(-maxTilt, Math.min(maxTilt, tilt));

    // In landscape, invert tilt if device is rotated opposite
    if (isLandscape && !isClockwise) {
      t = -t;
    }

    // Smooth
    tiltState.smoothedTilt += (t - tiltState.smoothedTilt) * smoothingFactor;
    const smoothed = tiltState.smoothedTilt;

    const absTilt = Math.abs(smoothed);
    const onGround = p.body.blocked.down || p.body.touching.down;

    if (absTilt > deadZone) {
      const intensity = (absTilt - deadZone) / (maxTilt - deadZone);
      const velocity = intensity * baseVelocity * velocityMultiplier;

      if (smoothed > 0) {
        p.setVelocityX(velocity);
        p.setFlipX(false);
      } else {
        p.setVelocityX(-velocity);
        p.setFlipX(true);
      }

      // Walking animation while on ground
      if (onGround) {
        playStateAnim(p, 'walk', true);
        p.mobileAnimState = 'walk';
      }
    } else {
      // Inside dead zone: stop horizontal movement
      p.setVelocityX(0);

      if (onGround) {
        playStateAnim(p, 'idle', true);
        p.mobileAnimState = 'idle';
      }
    }
  });
}

// Public API: toggled from mobileControls based on UI.
export function setTiltEnabled(enabled) {
  tiltEnabled = !!enabled;
  const p = tiltState.player;
  if (!tiltEnabled && p && p.body) {
    p.setVelocityX(0);
    const onGround = p.body.blocked.down || p.body.touching.down;
    if (onGround) {
      playStateAnim(p, 'idle', true);
      p.mobileAnimState = 'idle';
    }
  }
}

// === Helper: map logical state -> animation key per fighter ===
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
