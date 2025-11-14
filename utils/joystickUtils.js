// utils/joystickUtils.js
// Virtual joystick for mobile: computes joystickForce on the scene
// and lets mobileControls decide how to move/animate the player.

export function setupJoystick(scene, player) {
  const joystickArea = document.getElementById('joystick-area');
  if (!joystickArea) {
    console.warn('🕹️ Joystick area not found in DOM.');
    return;
  }

  let joystickKnob = document.getElementById('joystick-knob');
  if (!joystickKnob) {
    joystickKnob = document.createElement('div');
    joystickKnob.id = 'joystick-knob';
    joystickArea.appendChild(joystickKnob);
  }

  let joystickStartX = 0;
  let joystickStartY = 0;

  const maxDistance = 50; // radius in px

  joystickArea.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    joystickStartX = touch.clientX;
    joystickStartY = touch.clientY;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
  });

  joystickArea.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    const deltaX = touch.clientX - joystickStartX;
    const deltaY = touch.clientY - joystickStartY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
    const clampedDistance = Math.min(distance, maxDistance);

    const clampedX = (deltaX / distance) * clampedDistance;
    const clampedY = (deltaY / distance) * clampedDistance;

    joystickKnob.style.transform = `translate(calc(${clampedX}px - 50%), calc(${clampedY}px - 50%))`;

    scene.joystickForceX = clampedX / maxDistance;
    scene.joystickForceY = clampedY / maxDistance;
  });

  joystickArea.addEventListener('touchend', () => {
    joystickKnob.style.transform = 'translate(-50%, -50%)';
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;

    if (player && player.body) {
      player.setVelocityX(0);
      const onGround = player.body.blocked.down || player.body.touching.down;
      if (onGround) {
        playStateAnim(player, 'idle', true);
        player.mobileAnimState = 'idle';
      }
    }
  });

  // Initialize joystick force values
  scene.joystickForceX = 0;
  scene.joystickForceY = 0;

  // Reset joystick on orientation change
  window.addEventListener('orientationchange', () => {
    scene.joystickForceX = 0;
    scene.joystickForceY = 0;
    if (player && player.body) {
      player.setVelocityX(0);
      const onGround = player.body.blocked.down || player.body.touching.down;
      if (onGround) {
        playStateAnim(player, 'idle', true);
        player.mobileAnimState = 'idle';
      }
    }
  });
}

// Called from mobileControls once per frame when control mode is 'joystick'
export function applyJoystickForce(scene, player) {
  if (!player || !player.body) return;

  const forceX = scene.joystickForceX || 0;
  const forceY = scene.joystickForceY || 0;

  const movingLeft = forceX < -0.1;
  const movingRight = forceX > 0.1;
  const wantsJump = forceY < -0.5;
  const onGround = player.body.blocked.down || player.body.touching.down;

  // Horizontal movement
  const speed = 200; // tuned for mobile
  player.setVelocityX(forceX * speed);

  if (movingLeft) {
    player.setFlipX(true);
  } else if (movingRight) {
    player.setFlipX(false);
  }

  // Optional: joystick-up jump
  if (wantsJump && onGround) {
    player.setVelocityY(-500);
    playStateAnim(player, 'jump', false);
    player.mobileAnimState = 'jump';
    return; // let jump anim play; state machine will pick up on next frame
  }

  // Animation state machine (Option B: smoothed / modern)
  let nextState = player.mobileAnimState || 'idle';

  if (!onGround) {
    nextState = 'jump';
  } else if (Math.abs(forceX) > 0.15) {
    nextState = 'walk';
  } else {
    nextState = 'idle';
  }

  if (nextState !== player.mobileAnimState) {
    playStateAnim(player, nextState, true);
    player.mobileAnimState = nextState;
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
