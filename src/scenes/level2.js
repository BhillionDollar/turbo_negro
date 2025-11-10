// src/scenes/level2.js

import { addFullscreenButton } from '../../utils/fullScreenUtils.js';
import { setupMobileControls } from '../../utils/mobileControls.js';

export default class Level2 extends Phaser.Scene {
  constructor() {
    super({ key: 'Level2' });
  }

  preload() {
    // Preload assets specific to Level 2
    this.load.image('level2bg', 'assets/levels/BackGrounds/Level2.webp');
    this.load.audio('level2Music', 'assets/Audio/LevelMusic/mp3/Level2.mp3');
  }

  create() {
    const width = 1100;
    const height = 500;

    this.input.once('pointerdown', () => {
      this.sound.context.resume();
    });

    const bg = this.add.image(width / 2, height / 2, 'level2bg');
    bg.setDisplaySize(width, height).setOrigin(0.5);

    this.music = this.sound.add('level2Music', { loop: true, volume: 0.5 });
    this.music.play();

    // Initialize fullscreen + mobile controls
    addFullscreenButton(this);
    setupMobileControls(this);

    // Example text to indicate Level 2
    this.add.text(width / 2, height / 2, 'Level 2', {
      fontSize: '42px',
      fontFamily: 'Metal Mania',
      fill: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
  }
}
