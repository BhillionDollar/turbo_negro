// utils/ControlManager.js
// ✨ Modern hybrid ControlManager for Turbo Negro (2025 update)
// Handles joystick, tilt, and keyboard with automatic fullscreen + mobile setup
// ✅ Updated for live tilt toggle event

import { setupMobileControls } from './mobileControls.js';
import { addFullscreenButton } from './fullScreenUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';
import { setupJoystick, applyJoystickForce, destroyJoystick } from './joystickUtils.js';

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

    // === 🔄 NEW: Listen for live toggle events from index.html ===
    window.addEventListener('bdp-toggle-tilt', (e) => {
      const mode = e.detail.mode;
      if (mode === this.mode) return;

      console.log(`[ControlManager] Switching to ${mode.toUpperCase()} mode`);
      this.switchMode(mode);
    });

    this.scene.events.on('update', this.updateHandler);
    this.scene.events.once('shutdown', () => this.disable());
  }

  // === Individual setup methods ===
  enableTilt() {
    this.tiltEnabled = true;
    disableTiltControls();
    destroyJoystick?.();
    enableTiltControls(this.scene, this.player);
  }

  enableJoystick() {
    this.joystickEnabled = true;
    disableTiltControls();
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
        if (onGround) this.player.playSafe(`${this.player.texture.key}_walk`, true);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
        this.player.setFlipX(false);
        if (onGround) this.player.playSafe(`${this.player.texture.key}_walk`, true);
      } else {
        this.player.setVelocityX(0);
        if (onGround) this.player.playSafe(`${this.player.texture.key}_idle`, true);
      }

      if (this.cursors.up.isDown && onGround) {
        this.player.setVelocityY(-500);
        this.player.playSafe(`${this.player.texture.key}_jump`, true);
      }

      if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.player.attack?.();
      }
    }
  }

  // === Disable everything ===
  disable() {
    this.scene.events.off('update', this.updateHandler);
    disableTiltControls();
    destroyJoystick?.();
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

    if (newMode === 'tilt') this.enableTilt();
    else if (newMode === 'joystick') this.enableJoystick();
    else if (newMode === 'keyboard') this.enableKeyboard();
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
