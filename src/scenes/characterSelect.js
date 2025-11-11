// scenes/characterSelect.js
// ✅ 2025-compatible with BaseFighter architecture
// ✅ Uses correct idle animations: turboIdle / rereIdle
// ✅ Safe texture guards to prevent undefined texture errors

import TurboNegro from '../characters/fighters/TurboNegro.js';
import ReReMarie from '../characters/fighters/ReReMarie.js';

export default class CharacterSelect extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelect' });
  }

  preload() {
    TurboNegro.preload(this);
    ReReMarie.preload(this);
  }

  create() {
    const { width, height } = this.scale;
    const groundY = Math.round(height * 0.78);
    const nameY = groundY + 28;

    // === Title ===
    this.add.text(width / 2, 80, 'Select Your Fighter', {
      fontFamily: 'Metal Mania',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8 },
    }).setOrigin(0.5);

    // Register animations
    TurboNegro.registerAnimations(this);
    ReReMarie.registerAnimations(this);

    this.add.rectangle(width / 2, groundY, width * 0.7, 4, 0xffffff, 0.08);

    // === TURBO NEGRO ===
    const turbo = this.add.sprite(width / 3, groundY, 'turboStanding1').setOrigin(0.5, 1);
    if (turbo.height > 0) turbo.setScale(150 / turbo.height);

    // Safe idle animation play
    this.textures.once(Phaser.Textures.Events.ONLOAD, () => {
      if (this.anims.exists('turboIdle') && turbo.texture?.key) {
        turbo.play('turboIdle', true);
      }
    });

    this.add.text(turbo.x, nameY, 'TURBO NEGRO', {
      fontFamily: 'Nosifer',
      fontSize: '28px',
      color: '#ff0000',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    turbo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.selectFighter('TurboNegro');
    });

    // === RE RE MARIE ===
    const rere = this.add.sprite((2 * width) / 3, groundY, 'rereIdle1').setOrigin(0.5, 1);
    if (rere.height > 0) rere.setScale(150 / rere.height);

    this.textures.once(Phaser.Textures.Events.ONLOAD, () => {
      if (this.anims.exists('rereIdle') && rere.texture?.key) {
        rere.play('rereIdle', true);
      }
    });

    this.add.text(rere.x, nameY, 'RE RE MARIE', {
      fontFamily: 'Nosifer',
      fontSize: '28px',
      color: '#ff00ff',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    rere.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.selectFighter('ReReMarie');
    });

    // === Floating idle motion ===
    this.tweens.add({
      targets: [turbo, rere],
      y: '+=8',
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  selectFighter(character) {
    this.sound.stopAll();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Level1', { character });
    });
  }
}
