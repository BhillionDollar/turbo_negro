export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, direction = 1, config = {}) {
    super(scene, x, y, textureKey);

    // --- Core setup ---
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.direction = direction;

    // --- Configuration ---
    this.speed = (config.speed ?? 500) * direction;
    this.damage = config.damage ?? 1;
    this.lifespan = config.lifespan ?? 2000;
    this.scaleFactor = config.scale ?? 1;

    // --- Physics setup ---
    this.setActive(true).setVisible(true);
    this.setOrigin(0.5, 0.5);
    this.setScale(this.scaleFactor);
    this.setBounce(0);
    this.setDrag(0, 0);
    this.body.allowGravity = false;
    this.body.setAllowGravity(false);
    this.setImmovable(true);

    // --- Motion ---
    this.setVelocity(this.speed, 0); // strictly horizontal
    this.setCollideWorldBounds(false);

    // --- Auto-destroy on leaving world bounds ---
    this.body.onWorldBounds = true;
    const handleWorldBound = (body) => {
      if (body.gameObject === this) this.safeDestroy();
    };
    scene.physics.world.on('worldbounds', handleWorldBound);
    this.once('destroy', () => scene.physics.world.off('worldbounds', handleWorldBound));

    // --- Auto-destroy after lifespan ---
    this._lifespanTimer = scene.time.delayedCall(this.lifespan, () => {
      if (this.active) this.safeDestroy();
    });
  }

  /**
   * Called when the projectile hits an enemy.
   */
  onHit(enemy) {
    if (enemy?.takeDamage) enemy.takeDamage(this.damage);
    this.safeDestroy();
  }

  /**
   * Full safety cleanup for projectiles.
   */
  safeDestroy() {
    if (!this.scene) return;
    if (this._lifespanTimer) this._lifespanTimer.remove();

    // Kill any active tweens or spins
    if (this.scene.tweens) this.scene.tweens.killTweensOf(this);

    this.destroy();
  }

  destroy(fromScene) {
    // Stop any physics listeners or timers before Phaser's destroy
    if (this.scene?.time && this._lifespanTimer) {
      this._lifespanTimer.remove();
      this._lifespanTimer = null;
    }

    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this);
    }

    super.destroy(fromScene);
  }
}
