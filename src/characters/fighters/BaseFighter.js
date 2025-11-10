// BaseFighter.js — 2025 unified version with shared projectile creation
import CD from '../../projectiles/cd/CD.js';

export default class BaseFighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.setCollideWorldBounds(true);

    this.speed = 200;
    this.jumpPower = 400;
    this.health = 10;
    this.maxHealth = 10;
    this.canShoot = true;
    this.isAttacking = false;
    this.lastDirection = 1;

    this.projectileConfig = { speed: 600, damage: 1, lifespan: 1800, scale: 1 };
    this.projectiles = scene.physics.add.group({ allowGravity: false });

    this.body.setSize(this.width * 0.5, this.height * 0.9, true);
  }

  moveLeft() {
    this.setVelocityX(-this.speed);
    this.setFlipX(true);
    this.lastDirection = -1;
    this.playSafe(`${this.texture.key}_walk`, true);
  }

  moveRight() {
    this.setVelocityX(this.speed);
    this.setFlipX(false);
    this.lastDirection = 1;
    this.playSafe(`${this.texture.key}_walk`, true);
  }

  stopMoving() {
    this.setVelocityX(0);
    if (this.body?.blocked.down) this.playSafe(`${this.texture.key}_idle`, true);
  }

  jump() {
    if (this.body?.blocked.down) {
      this.setVelocityY(-this.jumpPower);
      this.playSafe(`${this.texture.key}_jump`, true);
    }
  }

  attack() {
    if (!this.canShoot || this.isAttacking) return;

    this.canShoot = false;
    this.isAttacking = true;

    const dir = this.flipX ? -1 : 1;
    const offsetX = dir * 40;
    const offsetY = 40;

    this.playSafe(`${this.texture.key}_attack`, false);

    this.scene.time.delayedCall(100, () => {
      const p = new CD(this.scene, this.x + offsetX, this.getTopCenter().y + offsetY, dir, this.projectileConfig);
      this.projectiles.add(p);
      p.setVelocityX(dir * this.projectileConfig.speed);
      p.body.allowGravity = false;
      p.setDepth(5);
      this.scene.playerProjectileFireSFX?.play?.();
    });

    this.scene.time.delayedCall(350, () => {
      this.isAttacking = false;
      this.playSafe(`${this.texture.key}_idle`, true);
    });

    this.scene.time.delayedCall(400, () => (this.canShoot = true));
  }

  takeDamage(amount = 1) {
    this.health -= amount;
    if (this.health <= 0) this.die();
    else this.playSafe(`${this.texture.key}_hit`, false);
  }

  heal(amount = 1) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  die() {
    this.setVelocity(0);
    this.setActive(false);
    this.setVisible(false);
    this.disableBody(true, true);
  }

  playSafe(key, ignoreIfPlaying = true) {
    if (this.scene.anims.exists(key)) this.play(key, ignoreIfPlaying);
  }
}
