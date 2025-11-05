export default class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config = {}) {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.textureKey = textureKey;

    // --- Add to world + physics ---
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // --- Core attributes ---
    this.speed = config.speed || 100;
    this.jumpPower = config.jumpPower || 300;
    this.maxHealth = config.maxHealth || 1;
    this.health = this.maxHealth;
    this.damage = config.damage || 1;
    this.alive = true;

    // 🟡 Default point value (can be overridden in subclass)
    this.points = config.points || 100;

    // --- Core physics behavior ---
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.setDepth(config.depth || 5);
    this.body.setAllowGravity(true);

    // --- Target + AI ---
    this.target = scene.player || null;
    this.aiTimer = null;

    // === Optional spawn-from-sky animation ===
    this._spawnY = y;
    if (y < 0) {
      this.setAlpha(0);
      this.scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 300,
        ease: 'Sine.easeInOut',
      });
    }

    // --- Animations ---
    this.registerAnimations();

    // --- Optional AI startup ---
    if (typeof this.enemyAI === 'function') {
      this.startAI();
    }

    // --- Detect ground landing for sky spawns ---
    this._setupLandingReaction();
  }

  applyGroundCollisions(platforms) {
    if (!platforms || !this.scene?.physics) return;
    if (!this._groundCollider) {
      this._groundCollider = this.scene.physics.add.collider(this, platforms);
    }
  }

  _setupLandingReaction() {
    this.body.onWorldBounds = true;
    this.scene.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === this && this.body.blocked.down) {
        if (this._spawnY < 0) {
          this.setVelocityY(-80);
          this.scene.cameras.main.shake(80, 0.003);
        }
      }
    });
  }

  startAI(interval = 500) {
    if (this.aiTimer) this.aiTimer.remove();
    this.aiTimer = this.scene.time.addEvent({
      delay: interval,
      callback: () => {
        if (this.alive && this.scene?.scene?.isActive()) {
          this.enemyAI?.();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  stopAI() {
    if (this.aiTimer) {
      this.aiTimer.remove();
      this.aiTimer = null;
    }
  }

  takeDamage(amount = 1) {
    if (!this.alive || !this.scene?.scene?.isActive()) return;
    this.health -= amount;

    // Flash red briefly
    this.setTint(0xff6666);
    this.scene.time.delayedCall(150, () => this.clearTint());

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;

    this.stopAI();

    if (this._groundCollider && this.scene?.physics?.world) {
      this.scene.physics.world.removeCollider(this._groundCollider);
      this._groundCollider = null;
    }

    if (this.scene?._levelCleaningUp) {
      this.destroy();
      return;
    }

    // 💥 Camera feedback
    this.scene.cameras.main.shake(100, 0.004);

    // 🟡 Add score automatically if Level has addScore()
    if (typeof this.scene.addScore === 'function') {
      this.scene.addScore(this.points);
    }

    // 🔥 Destroy the sprite
    this.destroy();

    // --- Scene tracking + rewards ---
    this.scene.totalEnemiesDefeated = (this.scene.totalEnemiesDefeated || 0) + 1;
    console.log(`💀 Enemy defeated: ${this.scene.totalEnemiesDefeated}`);

    this.dropHealthPackIfNeeded();
    this.playDeathSound();

    if (typeof this.scene.updateEnemyCountUI === 'function') {
      this.scene.updateEnemyCountUI();
    }

    if (
      this.scene.totalEnemiesDefeated >= 20 &&
      typeof this.scene.levelComplete === 'function'
    ) {
      this.scene.levelComplete();
    }
  }

  dropHealthPackIfNeeded() {
    if (this.scene.totalEnemiesDefeated % 12 === 0) {
      console.log('🎁 Spawning health pack!');
      if (typeof this.scene.spawnHealthPack === 'function') {
        this.scene.spawnHealthPack();
      }
    }
  }

  playDeathSound() {
    if (this.scene.mardiGrasZombieHitSFX) {
      this.scene.mardiGrasZombieHitSFX.play();
    }
  }

  handleProjectileEnemyCollision(projectile) {
    projectile.destroy();
    this.takeDamage(projectile.damage || 1);
  }

  registerAnimations() {
    const animKey = `${this.textureKey}_idle`;
    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: [{ key: this.textureKey }],
        frameRate: 1,
        repeat: -1,
      });
    }
    this.play(animKey, true);
  }

  destroy(fromScene) {
    this.stopAI();

    if (this._groundCollider && this.scene?.physics?.world) {
      this.scene.physics.world.removeCollider(this._groundCollider);
      this._groundCollider = null;
    }

    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this);
    }

    if (this.scene?.enemies && this.scene.enemies.contains(this)) {
      this.scene.enemies.remove(this, true, true);
    }

    if (!this.scene?.sys?.isDestroyed) {
      super.destroy(fromScene);
    }
  }
}
