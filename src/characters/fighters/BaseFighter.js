// fighters/BaseFighter.js
// ✅ Unified 2025 Fighter Core — supports joystick, tilt, and keyboard
export default class BaseFighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, frame) {
    super(scene, x, y, textureKey, frame);

    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // === Physics Setup ===
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.body.setAllowGravity(true);
    this.setDepth(5);

    // === Visual Layer ===
    this.setVisible(false);
    this.visual = scene.add.sprite(x, y, textureKey, frame).setOrigin(0.5, 1);
    this.visual.setDepth(5);
    this.targetHeight = 150;
    this.scaleToHeight(this.targetHeight);

    // === Stats ===
    this.speed = 200;
    this.acceleration = 1000;
    this.deceleration = 1200;
    this.jumpPower = 480;
    this.health = 10;
    this.maxHealth = 10;
    this.canShoot = true;
    this.isAttacking = false;
    this.isInvulnerable = false;
    this.lockFacing = false;
    this.currentAnim = null;

    // === Input flags ===
    this.isMoving = false;
    this.isJumping = false;

    // === Hitbox ===
    this.standardizeBodySize();
  }

  scaleToHeight(targetHeight = 150) {
    const k = targetHeight / this.height;
    this.setScale(k);
    this.visual?.setScale(k);
  }

  standardizeBodySize() {
    const w = this.displayWidth || 50;
    const h = this.displayHeight || 150;
    this.body?.setSize(w * 0.45, h * 0.85).setOffset(w * 0.275, h * 0.15);
  }

  // === Controls ===
  moveLeft() {
    if (this.lockFacing) return;
    this.setVelocityX(-this.speed);
    this.setFlipX(true);
    this.visual?.setFlipX(true);
    this.isMoving = true;
    this.playSafe(`${this.texture.key}_walk`);
  }

  moveRight() {
    if (this.lockFacing) return;
    this.setVelocityX(this.speed);
    this.setFlipX(false);
    this.visual?.setFlipX(false);
    this.isMoving = true;
    this.playSafe(`${this.texture.key}_walk`);
  }

  stopMoving() {
    this.setVelocityX(0);
    this.isMoving = false;
    this.playSafe(`${this.texture.key}_idle`);
  }

  jump() {
    if (this.body.onFloor() && !this.isJumping) {
      this.setVelocityY(-this.jumpPower);
      this.isJumping = true;
      this.playSafe(`${this.texture.key}_jump`);
    }
  }

  land() {
    this.isJumping = false;
    this.playSafe(`${this.texture.key}_idle`);
  }

  // === Damage ===
  takeDamage(amount = 1) {
    if (this.isInvulnerable) return;
    this.health -= amount;
    this.flashRed();
    if (this.health <= 0) this.handleDeath();
    if (typeof this.playHitReaction === 'function') this.playHitReaction();
    this.scene.updateHealthUI?.();
  }

  flashRed() {
    if (!this.visual) return;
    this.isInvulnerable = true;
    this.visual.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.visual.clearTint());
    this.scene.time.delayedCall(600, () => (this.isInvulnerable = false));
  }

  handleDeath() {
    this.setVelocity(0);
    this.scene.physics.pause();
    this.visual.setTint(0x555555);
    this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'GAME OVER', {
        fontFamily: 'Metal Mania',
        fontSize: '48px',
        color: '#ff0000',
      })
      .setOrigin(0.5);
  }

  // === Safe Animation Wrapper ===
  playSafe(animKey, ignoreIfPlaying = true) {
    if (!this.scene.anims.exists(animKey)) return;
    if (this.visual?.anims?.currentAnim?.key !== animKey) {
      this.visual.play(animKey, ignoreIfPlaying);
      this.currentAnim = animKey;
    }
  }

  update() {
    // === Sync visual ===
    if (this.visual) {
      this.visual.x = this.x;
      this.visual.y = this.y;
    }

    // === Land detection ===
    if (this.isJumping && this.body.onFloor()) this.land();
  }
}
