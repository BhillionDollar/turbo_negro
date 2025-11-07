// utils/ControlManager.js
// Central control hub for Turbo Negro (mobile + desktop + fullscreen)

import { setupMobileControls } from './mobileControls.js';
import { addFullscreenButton } from './fullScreenUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';

let controlManagerInstance = null;

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
      setupMobileControls(this.scene, this.player);
      if (this.mode === 'tilt') enableTiltControls(this.scene, this.player);
    }

    this.scene.events.on('update', this.updateHandler);
    this.scene.events.once('shutdown', () => this.disable());
  }

  updateHandler() {
    // Reserved for future joystick/tilt updates per frame
  }

  disable() {
    this.scene.events.off('update', this.updateHandler);
    disableTiltControls();
  }
}

// ✅ Auto-inits when window dispatches "bdp-player-ready"
export function initControlManager() {
  if (controlManagerInstance) return;

  window.addEventListener('bdp-player-ready', (e) => {
    const { scene, player } = e.detail;
    controlManagerInstance = new ControlManager(scene, player);
    controlManagerInstance.setup();
    window.currentControlManager = controlManagerInstance;
  });
}
