import BaseEnemy from '../enemies/BaseEnemy.js';

export default class MardiGrasZombie extends BaseEnemy {
  // =========================
  // === STATIC PRELOAD ===
  // =========================
  static preload(scene) {
    scene.load.image('mardiGrasZombie', 'assets/Characters/enemies/mardigraszombie/mardigraszombie.png');
    scene.load.audio('mardiGrasZombieHit', 'assets/Audio/soundfx/mp3/mardigraszombiehit.mp3');
    console.log('🧟 MardiGrasZombie assets preloaded ✅');
  }

  // =========================
  // === CONSTRUCTOR ===
  // =========================
  constructor(scene, x, y) {
    super(scene, x, y, 'mardiGrasZombie', { points: 100, maxHealth: 1, speed: 100 });

    this.player = scene.player;
    this.jumpPower = 300;

    // Visual + physics setup
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.setDepth(5);

    // === Idle animation ===
    this.registerAnimations();
    this.play('mardiGrasZombieIdle', true);

    // === Simple AI loop ===
    this.startAI(500);
  }

  // =========================
  // === ANIMATIONS ===
  // =========================
  registerAnimations() {
    const anims = this.scene.anims;
    if (!anims.exists('mardiGrasZombieIdle')) {
      anims.create({
        key: 'mardiGrasZombieIdle',
        frames: [{ key: 'mardiGrasZombie' }],
        frameRate: 1,
        repeat: -1,
      });
    }
  }

  // =========================
  // === AI BEHAVIOR ===
  // =========================
  enemyAI() {
    if (!this.body || !this.player?.body) return;

    const playerX = this.player.x;
    const distance = Math.abs(this.x - playerX);

    // Move toward player
    if (this.x < playerX - 10) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else if (this.x > playerX + 10) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }

    // Occasional hop if close
    if (Phaser.Math.Between(0, 100) < 20 && this.body.blocked.down && distance < 200) {
      this.setVelocityY(-this.jumpPower);
    }
  }
}
