// src/scenes/characterSelect.js

export default class CharacterSelect extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelect' });
  }

  preload() {
    // Load character thumbnails and assets (spritesheets, etc.)
    this.load.image('turbonegro', 'assets/Characters/fighters/turbonegro/standing/Standingwithbackground.png');
    this.load.image('reremarie', 'assets/Characters/fighters/reremarie/standing/Standingwithbackground.png');
    // Add more if needed
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Title
    this.add.text(centerX, 60, 'Select Your Fighter', {
      fontFamily: 'Metal Mania, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Turbo Negro thumbnail
    const turbo = this.add.image(centerX - 150, centerY + 20, 'turbonegro')
      .setInteractive({ useHandCursor: true })
      .setScale(0.6);
    
    this.add.text(turbo.x, turbo.y + 110, 'Turbo Negro', {
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);

    turbo.on('pointerdown', () => {
      localStorage.setItem('selectedCharacter', 'TurboNegro');
      this.scene.start('Level1');
    });

    // Rere Marie thumbnail
    const rere = this.add.image(centerX + 150, centerY + 20, 'reremarie')
      .setInteractive({ useHandCursor: true })
      .setScale(0.6);

    this.add.text(rere.x, rere.y + 110, 'ReRe Marie', {
      fontSize: '20px',
      color: '#fff',
    }).setOrigin(0.5);

    rere.on('pointerdown', () => {
      localStorage.setItem('selectedCharacter', 'ReReMarie');
      this.scene.start('Level1');
    });

    // Optional: back to start menu
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('StartMenu');
    });
  }
}
