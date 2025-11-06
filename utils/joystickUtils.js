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
  center: { x: 0, y: 0 },
  radius: 50,
  knobEl: null,
  areaEl: null,
  attackBtn: null,
  moveAnim: { walk: 'walk', idle: 'idle', jump: 'jump' }, // keep names consistent with your scene
};

// --- helpers ---
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function setKnob(dx, dy) {
  if (!state.knobEl) return;
  // limit the knob within the circle
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

// Converts page pointer to local joystick center deltas
function computeForcesFromEvent(e) {
  const t = (e.touches && e.touches[0]) || e;
  const rect = state.areaEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = t.clientX - cx;
  const dy = t.clientY - cy;

  // Normalize to [-1, 1]
  const nx = clamp(dx / state.radius, -1, 1);
  const ny = clamp(dy / state.radius, -1, 1);

  state.forceX = nx;        // left(-1) … right(+1)
  state.forceY = ny;        // up(-1) … down(+1)  (unused for this platformer move)
  setKnob(dx, dy);
}

// --- public API ---
export function setupJoystick(scene, player) {
  // idempotent
  if (state.enabled) return;

  state.scene = scene;
  state.player = player;

  state.areaEl = document.getElementById('joystick-area');
  state.knobEl = document.getElementById('joystick-knob');
  state.attackBtn = document.getElementById('attack-button');

  if (!state.areaEl || !state.knobEl) {
    console.warn('[joystickUtils] joystick DOM not found — skipping init');
    state.enabled = false;
    return;
  }

  // Determine a radius that matches your CSS (100px tall area with 40px knob)
  const rect = state.areaEl.getBoundingClientRect();
  state.radius = Math.min(rect.width, rect.height) * 0.38; // feel-good factor

  // Prevent the page from scrolling while dragging
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

  // pointer + touch
  state.areaEl.addEventListener('pointerdown', onDown, activeOpts);
  window.addEventListener('pointermove', onMove, activeOpts);
  window.addEventListener('pointerup', onUp, activeOpts);
  state.areaEl.addEventListener('touchstart', onDown, activeOpts);
  window.addEventListener('touchmove', onMove, activeOpts);
  window.addEventListener('touchend', onUp, activeOpts);
  window.addEventListener('touchcancel', onUp, activeOpts);

  // Attack button (optional — triggers a simple projectile if your scene exposes a method)
  if (state.attackBtn) {
    state.attackBtn.addEventListener('click', () => {
      // If your scene has a public attack method, call it
      if (scene && typeof scene.playerAttack === 'function') {
        scene.playerAttack();
        return;
      }
      // Fallback: fire basic projectile if your scene exposes a group & sound keys
      if (scene && scene.projectiles && player && player.body) {
        const p = scene.projectiles.create(player.x, player.y, 'projectileCD');
        if (p) {
          p.setVelocityX(player.flipX ? -500 : 500);
          p.body.setAllowGravity(false);
          try { scene.sound.play('playerProjectileFire'); } catch (_) {}
        }
      }
    }, { passive: true });
  }

  // Resize recalculates radius and recenters knob
  state._onResize = () => {
    const r = state.areaEl.getBoundingClientRect();
    state.radius = Math.min(r.width, r.height) * 0.38;
    resetKnob();
  };
  window.addEventListener('resize', state._onResize);

  // Public flag
  state.enabled = true;
}

export function applyJoystickForce(scene, player, opts = {}) {
  if (!state.enabled || !player || !player.body) return;

  const speed = opts.speed || 180; // horizontal move speed
  const dead = opts.deadzone ?? 0.12;

  let fx = state.forceX;
  if (Math.abs(fx) < dead) fx = 0;

  // Apply horizontal velocity
  player.setVelocityX(fx * speed);

  // Flip & anims only when grounded
  const onGround = player.body.blocked.down || player.body.touching.down;

  if (fx > 0) {
    player.setFlipX(false);
    if (onGround && state.moveAnim.walk) player.anims.play(state.moveAnim.walk, true);
  } else if (fx < 0) {
    player.setFlipX(true);
    if (onGround && state.moveAnim.walk) player.anims.play(state.moveAnim.walk, true);
  } else {
    if (onGround && state.moveAnim.idle) player.anims.play(state.moveAnim.idle, true);
  }
}

export function destroyJoystick() {
  if (!state.enabled) return;

  // Remove listeners
  const opts = { passive: false };
  if (state.areaEl) {
    state.areaEl.replaceWith(state.areaEl.cloneNode(true)); // quick detach trick for element-bound handlers
  }
  window.removeEventListener('pointermove', () => {}, opts);
  window.removeEventListener('pointerup', () => {}, opts);
  window.removeEventListener('touchmove', () => {}, opts);
  window.removeEventListener('touchend', () => {}, opts);
  window.removeEventListener('touchcancel', () => {}, opts);
  window.removeEventListener('resize', state._onResize);

  // Reset visual + forces
  resetKnob();

  // Clear refs
  state = {
    scene: null,
    player: null,
    enabled: false,
    forceX: 0,
    forceY: 0,
    dragging: false,
    center: { x: 0, y: 0 },
    radius: 50,
    knobEl: null,
    areaEl: null,
    attackBtn: null,
    moveAnim: state.moveAnim,
  };
}
