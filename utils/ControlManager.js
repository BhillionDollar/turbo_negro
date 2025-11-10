// utils/ControlManager.js
// ✨ Modern hybrid ControlManager for Turbo Negro (2025 update)
// Handles joystick, tilt, and keyboard with automatic fullscreen + mobile setup

import { setupMobileControls } from './mobileControls.js';
import { addFullscreenButton } from './fullScreenUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';
import { setupJoystick, applyJoystickForce } from './joystickUtils.js';

let controlManagerInstance = null;

export class ControlManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // === Device Detection ===
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // === Saved mode (fallback to joystick on mobile, keyboard on desktop) ===
    this.mode =
      localStorage.getItem('controlMode') ||
      (this.isMobile ? 'joystick' : 'keyboard');

    // === Internal state ===
    this.joystickEnabled = false;
    this.tiltEnabled = false;
    this.keyboardEnabled = false;
    this.updateHandler = this.updateHandler.bind(this);
  }

  // 🧩 Setup controls based on current mode
  setup() {
    addFullscreenButton();

    if (this.isMobile) {
      setupMobileControls(this.scene, this.player);
      if (this.mode === 'tilt') {
        this.enableTilt();
      } else if (this.mode === 'joystick') {
        this.enableJoystick();
      }
    } else {
      this.enableKeyboard();
    }

    this.scene.events.on('update', this.updateHandler);
    this.scene.events.once('shutdown', () => this.disable());
  }

  // === Individual setup methods ===
  enableTilt() {
    this.tiltEnabled = true;
    enableTiltControls(this.scene, this.player);
  }

  enableJoystick() {
    this.joystickEnabled = true;
    setupJoystick(this.scene, this.player);
    this.scene.events.on('update', () => applyJoystickForce(this.scene, this.player));
  }

  enableKeyboard() {
    this.keyboardEnabled = true;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.attackKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  // === Update per frame ===
  updateHandler() {
    if (this.keyboardEnabled) {
      const onGround = this.player.body?.blocked?.down || this.player.body?.touching?.down;

      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
        this.player.setFlipX(true);
        if (onGround) this.player.play('walk', true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.setFlipX(false);
        if (onGround) this.player.play('walk', true);
      } else {
        this.player.setVelocityX(0);
        if (onGround) this.player.play('idle', true);
      }

      if (this.cursors.up.isDown && onGround) {
        this.player.setVelocityY(-500);
        this.player.play('jump', true);
      }

      if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        const projectile = this.scene.projectiles?.create(
          this.player.x,
          this.player.y,
          'projectileCD'
        );
        if (projectile) {
          projectile.setVelocityX(this.player.flipX ? -500 : 500);
          projectile.body.setAllowGravity(false);
          this.scene.sound?.play('playerProjectileFire');
        }
      }
    }
  }

  // === Disable everything ===
  disable() {
    this.scene.events.off('update', this.updateHandler);
    disableTiltControls();
    this.tiltEnabled = false;
    this.joystickEnabled = false;
    this.keyboardEnabled = false;
  }

  // === Allow runtime switching ===
  switchMode(newMode) {
    if (this.mode === newMode) return;
    this.disable();
    this.mode = newMode;
    localStorage.setItem('controlMode', newMode);
    this.setup();
  }
}

// ✅ Global initializer: waits for the player to be ready
export function initControlManager() {
  if (controlManagerInstance) return;

  window.addEventListener('bdp-player-ready', (e) => {
    const { scene, player } = e.detail;
    controlManagerInstance = new ControlManager(scene, player);
    controlManagerInstance.setup();
    window.currentControlManager = controlManagerInstance;

    console.log('[ControlManager] Initialized:', controlManagerInstance.mode);
  });
}
