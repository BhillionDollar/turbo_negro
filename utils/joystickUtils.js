// utils/joystickUtils.js
// Lightweight virtual joystick for mobile/touch
// Exports: setupJoystick(scene, player), applyJoystickForce(scene, player), destroyJoystick()

let state = {
  scene: null,
  player: null,
  enabled: false,
  forceX: 0,
  forceY: 0,
  dragging: false,
  radius: 50,
  knobEl: null,
  areaEl: null,
  attackBtn: null,
  moveAnim: { walk: 'walk', idle: 'idle', jump: 'jump' },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function setKnob(dx, dy) {
  if (!state.knobEl) return;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(len, state.radius);
  const nx = (dx / len) * k;
  const ny = (dy / len) * k;
  state.knobEl.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
}

function resetKnob() {
  if (state.knobEl) {
    state.knobEl.style.transform = 'translate(-50%, -50%)';
  }
  state.forceX = 0;
  state.forceY = 0;
}

function computeForcesFromEvent(e) {
  const t = (e.touches && e.touches[0]) || e;
  const rect = state.areaEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = t.clientX - cx;
  const dy = t.clientY - cy;

  state.forceX = clamp(dx / state.radius, -1, 1);
  state.forceY = clamp(dy / state.radius, -1, 1);
  setKnob(dx, dy);
}

export function setupJoystick(scene, player) {
  if (state.enabled) return;

  state.scene = scene;
  state.player = player;
  state.areaEl = document.getElementById('joystick-area');
  state.knobEl = document.getElementById('joystick-knob');
  state.attackBtn = document.getElementById('attack-button');

  if (!state.areaEl || !state.knobEl) {
    console.warn('[joystickUtils] joystick DOM not found — skipping init');
    return;
  }

  const rect = state.areaEl.getBoundingClientRect();
  state.radius = Math.min(rect.width, rect.height) * 0.38;

  const activeOpts = { passive: false };
  const onDown = (e) => {
    state.dragging = true;
    e.preventDefault();
    computeForcesFromEvent(e);
  };
  const onMove = (e) => {
    if (!state.dragging) return;
    e.preventDefault();
    computeForcesFromEvent(e);
  };
  const onUp = (e) => {
    if (!state.dragging) return;
    e.preventDefault();
    state.dragging = false;
    resetKnob();
  };

  state.areaEl.addEventListener('pointerdown', onDown, activeOpts);
  window.addEventListener('pointermove', onMove, activeOpts);
  window.addEventListener('pointerup', onUp, activeOpts);
  state.areaEl.addEventListener('touchstart', onDown, activeOpts);
  window.addEventListener('touchmove', onMove, activeOpts);
  window.addEventListener('touchend', onUp, activeOpts);
  window.addEventListener('touchcancel', onUp, activeOpts);

  if (state.attackBtn) {
    state.attackBtn.addEventListener('click', () => {
      if (scene?.playerAttack) {
        scene.playerAttack();
      } else if (scene?.projectiles && player?.body) {
        const p = scene.projectiles.create(player.x, player.y, 'projectileCD');
        if (p) {
          p.setVelocityX(player.flipX ? -500 : 500);
          p.body.setAllowGravity(false);
          try {
            scene.sound.play('playerProjectileFire');
          } catch (_) {}
        }
      }
    }, { passive: true });
  }

  state._onResize = () => {
    const r = state.areaEl.getBoundingClientRect();
    state.radius = Math.min(r.width, r.height) * 0.38;
    resetKnob();
  };
  window.addEventListener('resize', state._onResize);
  state.enabled = true;
}

export function applyJoystickForce(scene, player, opts = {}) {
  if (!state.enabled || !player?.body) return;
  const speed = opts.speed || 180;
  const dead = opts.deadzone ?? 0.12;
  let fx = state.forceX;
  if (Math.abs(fx) < dead) fx = 0;
  player.setVelocityX(fx * speed);

  const grounded = player.body.blocked.down || player.body.touching.down;
  if (fx > 0) {
    player.setFlipX(false);
    if (grounded) player.anims.play(state.moveAnim.walk, true);
  } else if (fx < 0) {
    player.setFlipX(true);
    if (grounded) player.anims.play(state.moveAnim.walk, true);
  } else {
    if (grounded) player.anims.play(state.moveAnim.idle, true);
  }
}

export function destroyJoystick() {
  if (!state.enabled) return;
  if (state.areaEl) state.areaEl.replaceWith(state.areaEl.cloneNode(true));
  window.removeEventListener('pointermove', () => {}, { passive: false });
  window.removeEventListener('pointerup', () => {}, { passive: false });
  window.removeEventListener('touchmove', () => {}, { passive: false });
  window.removeEventListener('touchend', () => {}, { passive: false });
  window.removeEventListener('touchcancel', () => {}, { passive: false });
  window.removeEventListener('resize', state._onResize);

  resetKnob();
  state = {
    scene: null,
    player: null,
    enabled: false,
    forceX: 0,
    forceY: 0,
    dragging: false,
    radius: 50,
    knobEl: null,
    areaEl: null,
    attackBtn: null,
    moveAnim: state.moveAnim,
  };
}
