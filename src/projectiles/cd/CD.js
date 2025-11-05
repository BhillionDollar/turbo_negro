import Projectile from '../Projectile.js';

export default class CD extends Projectile {
  static preload(scene) {
    scene.load.image('cdProjectile', 'assets/Characters/projectiles/cd/cd.png');
  }

  constructor(scene, x, y, direction = 1, config = {}) {
    super(scene, x, y, 'CD', direction, {
      ...config,
      speed: config.speed || 600,
      damage: config.damage || 1,
      lifespan: config.lifespan || 2000,
      scale: config.scale || 1, // full-size CD
    });

    // 🔒 Guarantee gravity-free horizontal CD
    this.body.allowGravity = false;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setVelocity(this.speed, 0);
    this.setBounce(0);
    this.body.velocity.y = 0;

    // 💿 Spin animation
    this.spinTween = scene.tweens.add({
      targets: this,
      angle: { from: 0, to: 360 },
      duration: 300,
      repeat: -1,
      ease: 'Linear',
    });
  }

  handleProjectileEnemyCollision(projectile, enemy) {
    const scene = this.scene;
    if (!scene || !enemy) return;

    enemy.destroy();
    this.safeDestroy();

    // 🔢 Count & track kills safely
    scene.totalEnemiesDefeated = (scene.totalEnemiesDefeated || 0) + 1;

    if (scene.totalEnemiesDefeated % 12 === 0 && scene.spawnHealthPack) {
      scene.spawnHealthPack();
    }

    if (scene.mardiGrasZombieHitSFX) {
      scene.mardiGrasZombieHitSFX.play();
    }

    if (scene.updateEnemyCountUI) scene.updateEnemyCountUI();
    if (scene.totalEnemiesDefeated >= 20 && scene.levelComplete) {
      scene.levelComplete();
    }
  }

  onHit(enemy) {
    this.handleProjectileEnemyCollision(this, enemy);
  }

  destroy(fromScene) {
    if (this.scene?.tweens && this.spinTween) {
      this.scene.tweens.killTweensOf(this);
      this.spinTween.stop();
      this.spinTween = null;
    }

    super.destroy(fromScene);
  }
}
