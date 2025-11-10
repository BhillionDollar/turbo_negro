// utils/mobileControls.js
// Wires joystick + tilt + swipe jump + tap attack for mobile.

import { setupJoystick } from './joystickUtils.js';
import { enableTiltControls } from './tiltUtils.js';

export function setupMobileControls(scene, player) {
  // Joystick
  setupJoystick(scene, player);

  // Tilt (graceful; does nothing if permission denied)
  enableTiltControls(scene, player);

  // Swipe-to-jump
  setupSwipeJump(scene, player);

  // Tap-to-attack anywhere on canvas (but not on joystick/attack button)
  setupTapAttack(scene, player);

  // Dedicated attack button
  setupAttackButton(scene, player);

  // Keep touch for joystick/attack from bubbling to page scroll
  stopScrollOnControl('joystick-area');
  stopScrollOnControl('attack-button');

  // Drive movement from joystick each frame (tilt sets velocity directly)
  const updateFromJoystick = () => {
    if (!player?.body) return;

    const forceX = scene.joystickForceX || 0;
    const forceY = scene.joystickForceY || 0;

    // Move
    const vx = forceX * 160; // tune speed
    player.setVelocityX(vx);

    // Face direction
    if (forceX < -0.1) player.setFlipX(true);
    else if (forceX > 0.1) player.setFlipX(false);

    const onGround = player.body.blocked.down || player.body.touching.down;
    const wantJump = forceY > 0.55; // joystick pushed up

    if (wantJump && onGround) {
      player.setVelocityY(-500);
      player.play('jump', true);
    } else if (Math.abs(forceX) > 0.1 && onGround) {
      if (player.anims.currentAnim?.key !== 'walk') player.play('walk', true);
    } else if (onGround && Math.abs(forceX) <= 0.1) {
      if (player.anims.currentAnim?.key !== 'idle') player.play('idle', true);
    }
  };

  scene.events.on('update', updateFromJoystick);
  scene.events.once('shutdown', () => {
    scene.events.off('update', updateFromJoystick);
  });
}

function setupSwipeJump(scene, player) {
  let startY = null;
  scene.input.on('pointerdown', (p) => { startY = p.y; });
  scene.input.on('pointerup',   (p) => {
    if (startY == null) return;
    const onGround = player.body?.blocked.down || player.body?.touching.down;
    if (p.y < startY - 50 && onGround) {
      player.setVelocityY(-500);
      player.play('jump', true);
    }
    startY = null;
  });
}

function setupTapAttack(scene, player) {
  scene.input.on('pointerdown', (pointer, currentlyOver) => {
    // If touching UI controls, skip
    const hitUI = (pointer?.event?.target && (
      pointer.event.target.id === 'joystick-area' ||
      pointer.event.target.id === 'joystick-knob' ||
      pointer.event.target.id === 'attack-button'
    ));
    if (hitUI) return;

    // Only treat as touch on mobile
    if (pointer.wasTouch) fireProjectile(scene, player);
  });
}

function setupAttackButton(scene, player) {
  const btn = document.getElementById('attack-button');
  if (!btn) return;
  const fire = (e) => { e.preventDefault(); fireProjectile(scene, player); };
  btn.addEventListener('touchstart', fire, { passive: false });
  btn.addEventListener('click', fire, { passive: false });
}

function stopScrollOnControl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  el.addEventListener('touchstart', stop, { passive: false });
  el.addEventListener('touchmove',  stop, { passive: false });
  el.addEventListener('touchend',   (e)=>e.stopPropagation(), { passive: false });
  el.addEventListener('gesturestart', stop, { passive: false });
}

function fireProjectile(scene, player) {
  if (!scene?.projectiles || !player) return;

  // Spawn
  const projectile = scene.projectiles.create(player.x, player.y, 'projectileCD');
  if (!projectile) return;

  // Direction + physics
  projectile.setVelocityX(player.flipX ? -500 : 500);
  projectile.body?.setAllowGravity(false);

  // SFX (ignore if missing)
  try { scene.sound?.play?.('playerProjectileFire'); } catch {}

  // Boss overlap (if present)
  if (scene.boss) {
    scene.physics.add.overlap(projectile, scene.boss, () => {
      if (typeof scene.takeBossDamage === 'function') scene.takeBossDamage(1);
      projectile.destroy();
    });
  }
}
