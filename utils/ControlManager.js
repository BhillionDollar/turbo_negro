// utils/ControlManager.js
// Central control hub for Turbo Negro (mobile + desktop + fullscreen)

import { setupMobileControls } from './mobileControls.js';
import { addFullscreenButton } from './fullScreenUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';

export class ControlManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.mode = localStorage.getItem('controlMode') || 'joystick';
    this.updateHandler = this.updateHandler.bind(this);
  }

  setup() {
    addFullscreenButton();

    if (this.isMobile) {
      // Always set up joystick + toggle logic via mobileControls
      setupMobileControls(this.scene, this.player);

      // Handle tilt preference restore
      if (this.mode === 'tilt') enableTiltControls(this.scene, this.player);
    }

    // Hook updates
    this.scene.events.on('update', this.updateHandler);
    this.scene.events.once('shutdown', () => this.disable());
  }

  updateHandler() {
    // Optional shared update logic if needed in the future
  }

  disable() {
    this.scene.events.off('update', this.updateHandler);
    disableTiltControls();
  }
}

// === Auto-register global listener for emitted events ===
window.addEventListener('bdp-player-ready', (e) => {
  const { scene, player } = e.detail;
  const manager = new ControlManager(scene, player);
  manager.setup();
  window.currentControlManager = manager;
});

// === ✅ Exported function for manual init from index.html ===
export function initControlManager() {
  window.addEventListener('bdp-player-ready', (e) => {
    const { scene, player } = e.detail;
    const manager = new ControlManager(scene, player);
    manager.setup();
    window.currentControlManager = manager;
  });
}
