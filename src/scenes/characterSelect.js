import TurboNegro from '../characters/fighters/TurboNegro.js';
import ReReMarie from '../characters/fighters/ReReMarie.js';


export default class CharacterSelect extends Phaser.Scene {
  constructor() { super({ key: 'CharacterSelect' }); }

  preload() {
    TurboNegro.preload(this);
    ReReMarie.preload(this);
  }

  create() {
    const { width, height } = this.scale;
    const groundY = Math.round(height * 0.78);
    const nameY = groundY + 28;

    this.add.text(width / 2, 80, 'Select Your Fighter', {
      fontFamily: 'Metal Mania',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    TurboNegro.registerAnimations(this);
    ReReMarie.registerAnimations(this);
    this.add.rectangle(width / 2, groundY, width * 0.7, 4, 0xffffff, 0.08);

    // --- Turbo Negro ---
    const turbo = this.add.sprite(width / 3, groundY, 'turboStanding1');
    turbo.setOrigin(0.5, 1);
    turbo.setScale(150 / turbo.height);
    if (this.textures.exists('turboStanding1')) turbo.play('turboStanding', true);
    this.add.text(turbo.x, nameY, 'TURBO NEGRO', {
      fontFamily: 'Nosifer', fontSize: '28px', color: '#ff0000',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    turbo.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startGame('TurboNegro'));

    // --- Re Re Marie ---
    const rere = new ReReMarie(this, (2 * width) / 3, groundY);
    rere.body.setAllowGravity(false);
    rere.visual.y = groundY;
    if (this.textures.exists('rereStanding1')) rere.play('rereStanding', true);

    this.add.text(rere.x, nameY, 'RE RE MARIE', {
      fontFamily: 'Nosifer', fontSize: '28px', color: '#ff00ff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    rere.visual.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startGame('ReReMarie'));
  }

  startGame(character) {
    this.sound.stopAll();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => this.scene.start('Level1', { character }));
  }
}
