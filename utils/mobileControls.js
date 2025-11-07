// utils/mobileControls.js
// Mobile control setup including joystick, tilt toggle, and fullscreen placement

import { setupJoystick, destroyJoystick } from './joystickUtils.js';
import { enableTiltControls, disableTiltControls } from './tiltUtils.js';

let isTiltEnabled = false;

export function setupMobileControls(scene, player) {
  const toggleButton = document.getElementById('mobile-fullscreen-button');
  if (!toggleButton) return;

  // Initial setup
  activateJoystick(scene, player);

  toggleButton.addEventListener('click', () => {
    isTiltEnabled = !isTiltEnabled;
    localStorage.setItem('controlMode', isTiltEnabled ? 'tilt' : 'joystick');

    if (isTiltEnabled) {
      destroyJoystick();
      enableTiltControls(scene, player);
      toggleButton.innerText = '[ tilt mode ]';
    } else {
      disableTiltControls();
      activateJoystick(scene, player);
      toggleButton.innerText = '[ joystick ]';
    }
  });

  // Restore last used mode
  const savedMode = localStorage.getItem('controlMode');
  if (savedMode === 'tilt') {
    isTiltEnabled = true;
    destroyJoystick();
    enableTiltControls(scene, player);
    toggleButton.innerText = '[ tilt mode ]';
  } else {
    toggleButton.innerText = '[ joystick ]';
  }
}

function activateJoystick(scene, player) {
  setupJoystick(scene, player);
}
