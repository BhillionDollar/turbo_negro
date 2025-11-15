// utils/joystickUtils.js

let activeTouchId = null;

/**
 * Setup the on-screen joystick for a given player.
 * Returns a cleanup function you can call on scene shutdown.
 */
export function setupJoystick(player) {
  const area = document.getElementById('joystick-area');
  const knob = document.getElementById('joystick-knob');

  if (!area || !knob || !player) {
    console.warn('[joystickUtils] Missing joystick DOM or player.');
    return null;
  }

  const rect = () => area.getBoundingClientRect();

  const state = {
    startX: 0,
    startY: 0,
    maxDistance: 40,      // how far the knob can move
    horizontalDeadZone: 8, // px before we decide left/right
    verticalJumpZone: 20, // px upward to trigger jump
  };

  function setKnobOffset(dx, dy) {
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = state.maxDistance;
    const scale = dist > max ? max / dist : 1;
    const clampedX = dx * scale;
    const clampedY = dy * scale;

    knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
  }

  function resetKnob() {
    knob.style.transform = 'translate(-50%, -50%)';
  }

  function onTouchStart(e) {
    if (activeTouchId !== null) return; // already handling a touch

    const touch = e.changedTouches[0];
    activeTouchId = touch.identifier;

    const r = rect();
    state.startX = touch.clientX - r.left;
    state.startY = touch.clientY - r.top;

    e.preventDefault();
  }

  function onTouchMove(e) {
    if (activeTouchId === null) return;

    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouchId
    );
    if (!touch) return;

    const r = rect();
    const currentX = touch.clientX - r.left;
    const currentY = touch.clientY - r.top;

    const dx = currentX - state.startX;
    const dy = currentY - state.startY;

    setKnobOffset(dx, dy);

    // Horizontal movement
    if (dx > state.horizontalDeadZone) {
      if (typeof player.moveRight === 'function') {
        player.moveRight();
      }
    } else if (dx < -state.horizontalDeadZone) {
      if (typeof player.moveLeft === 'function') {
        player.moveLeft();
      }
    } else {
      if (typeof player.stopMoving === 'function') {
        player.stopMoving();
      }
    }

    // Upward swipe = jump (only if the swipe is clearly up)
    if (-dy > state.verticalJumpZone) {
      if (typeof player.tryJump === 'function') {
        player.tryJump();
      }
    }

    e.preventDefault();
  }

  function onTouchEnd(e) {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouchId
    );
    if (!touch) return;

    activeTouchId = null;
    resetKnob();

    if (typeof player.stopMoving === 'function') {
      player.stopMoving();
    }

    e.preventDefault();
  }

  area.addEventListener('touchstart', onTouchStart, { passive: false });
  area.addEventListener('touchmove', onTouchMove, { passive: false });
  area.addEventListener('touchend', onTouchEnd, { passive: false });
  area.addEventListener('touchcancel', onTouchEnd, { passive: false });

  // Clean up helper
  function cleanup() {
    area.removeEventListener('touchstart', onTouchStart);
    area.removeEventListener('touchmove', onTouchMove);
    area.removeEventListener('touchend', onTouchEnd);
    area.removeEventListener('touchcancel', onTouchEnd);
    resetKnob();
  }

  return cleanup;
}

/**
 * Called from mobileControls when tearing down the scene.
 */
export function destroyJoystick(cleanupFn) {
  if (typeof cleanupFn === 'function') {
    cleanupFn();
  }
}

export function applyJoystickForce(scene, player) {
    const fx = scene.joystickForceX || 0;
    const fy = scene.joystickForceY || 0;

    const moveL = fx < -0.1;
    const moveR = fx > 0.1;
    const jump = fy < -0.5;
    const onGround = player.body.blocked.down || player.body.touching.down;

    if (moveL) player.moveLeft();
    else if (moveR) player.moveRight();
    else player.stopMoving();

    if (jump && onGround) player.jump();
}
