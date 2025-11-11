// scenes/startMenu.js
/* global Phaser */
import { addFullscreenButton } from '../../utils/fullScreenUtils.js';

export default class StartMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'StartMenu' });
  }

  preload() {
    this.load.image('startBackground', 'assets/levels/BackGrounds/StartMenu.webp');
    this.load.image('turboNegroLogo', 'assets/Logo/TurboNegro.png');
    this.load.audio('menuMusic', 'assets/Audio/LevelMusic/mp3/TurboNegroShortVersion.mp3');
  }

  create() {
    const width = 1100;
    const height = 500;

    this.input.once('pointerdown', () => this.sound.context.resume());

    // Background
    const background = this.add.image(width / 2, height / 2, 'startBackground');
    background.setDisplaySize(width, height).setOrigin(0.5);

    // Logo + shadow
    this.add.image(width / 2 + 5, height / 3.1 + 5.1, 'turboNegroLogo')
      .setOrigin(0.5)
      .setScale(0.6)
      .setTint(0xffffff)
      .setAlpha(0.7);
    this.add.image(width / 2, height / 3.1, 'turboNegroLogo')
      .setOrigin(0.5)
      .setScale(0.6);

    // Subtitle
    this.add.text(width / 2, height / 1.7, 'Saves The French Quarter!!!', {
      fontSize: '42px',
      fontFamily: 'Nosifer',
      color: 'red',
      align: 'center',
      stroke: '#000',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: 'red', blur: 8, stroke: false, fill: true },
    }).setOrigin(0.5);

    // Start button
    const startButton = this.add.text(width / 2, height / 1.3, 'Start Game', {
      fontSize: '42px',
      fontFamily: 'Metal Mania',
      fill: '#FFD700',
      backgroundColor: '#000000',
      padding: { left: 20, right: 20, top: 10, bottom: 10 },
      stroke: '#8B0000',
      strokeThickness: 5,
    }).setOrigin(0.5).setInteractive();

    this.tweens.add({ targets: startButton, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    startButton.on('pointerover', () =>
      startButton.setStyle({ fill: '#ffffff', backgroundColor: '#ff0000' })
    );
    startButton.on('pointerout', () =>
      startButton.setStyle({ fill: '#FFD700', backgroundColor: '#000000' })
    );

    startButton.on('pointerdown', () => {
      this.sound.stopAll();
      if (typeof fbq !== 'undefined') fbq('trackCustom', 'GameStarted');
      this.scene.start('CharacterSelect');
    });

    this.music = this.sound.add('menuMusic', { loop: true, volume: 0.6 });
    this.music.play();

    addFullscreenButton(this);
  }
}
