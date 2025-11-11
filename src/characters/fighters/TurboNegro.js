// fighters/TurboNegro.js
import BaseFighter from '../fighters/BaseFighter.js';
import CD from '../../projectiles/cd/CD.js';

export default class TurboNegro extends BaseFighter {
  static preload(scene) {
    const base = 'assets/Characters/fighters/turbonegro/';

    // === Standing ===
    scene.load.image('turboStanding1', `${base}standing/standing1.png`);
    scene.load.image('turboStanding2', `${base}standing/standing2.png`);
    scene.load.image('turboStanding3', `${base}standing/standing3.png`);
    scene.load.image('turboStanding4', `${base}standing/standing4.png`);

    // === Walking ===
    scene.load.image('turboWalk1', `${base}walking/walking1.png`);
    scene.load.image('turboWalk2', `${base}walking/walking2.png`);
    scene.load.image('turboWalk3', `${base}walking/walking3.png`);
    scene.load.image('turboWalk4', `${base}walking/walking4.png`);

    // === Jumping ===
    scene.load.image('turboJump1', `${base}jumping/jump1.png`);
    scene.load.image('turboJump2', `${base}jumping/jump2.png`);
    scene.load.image('turboJump3', `${base}jumping/jump3.png`);

    // === Ground Attack ===
    scene.load.image('turboGroundAttack_windup', `${base}attack/groundattack/groundAttack_windup.png`);
    scene.load.image('turboGroundAttack_impact', `${base}attack/groundattack/groundAttack_impact.png`);
    scene.load.image('turboGroundAttack_recoil', `${base}attack/groundattack/groundAttack_recoil.png`);

    // === Jump Attack ===
    scene.load.image('turboJumpAttack_windup', `${base}attack/jumpattack/jumpattack_windup.png`);
    scene.load.image('turboJumpAttack_impact', `${base}attack/jumpattack/jumpattack_impact.png`);
    scene.load.image('turboJumpAttack_recoil', `${base}attack/jumpattack/jumpattack_recoil.png`);

    // === Hit Reaction ===
    scene.load.image('turboHit1', `${base}hitreaction/Frame1.png`);
    scene.load.image('turboHit2', `${base}hitreaction/Frame2.png`);

    // === Projectile ===
    scene.load.image('CD', 'assets/Characters/projectiles/cd/CD.png');
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (key, frames, frameRate, repeat = -1) => {
      if (!a.exists(key)) {
        a.create({
          key,
          frames: frames.map(k => ({ key: k })),
          frameRate,
          repeat
        });
      }
    };

    make('turboStanding', ['turboStanding1', 'turboStanding2', 'turboStanding3', 'turboStanding4'], 5);
    make('turboWalk', ['turboWalk1', 'turboWalk2', 'turboWalk3', 'turboWalk4'], 7);
    make('turboJump', ['turboJump1', 'turboJump2', 'turboJump3'], 5);
    make('turboGroundAttack', [
      'turboGroundAttack_windup',
      'turboGroundAttack_impact',
      'turboGroundAttack_recoil'
    ], 14, 0);
    make('turboJumpAttack', [
      'turboJumpAttack_windup',
      'turboJumpAttack_impact',
      'turboJumpAttack_recoil'
    ], 14, 0);
    make('turboHitReaction', ['turboHit1', 'turboHit2'], 10, 0);
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'turboStanding1');
    this.setOrigin(0.5, 1);

    this.speed = 220;
    this.jumpPower = 480;
    this.crossfadeDuration = 120;
    this.projectileConfig = { speed: 600, damage: 1, lifespan: 1800, scale: 1 };

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    TurboNegro.registerAnimations(scene);
    this.playSafe('turboStanding', true);
  }

  update() {
    super.update();
    const { left, right, up } = this.cursors;
    const onGround = this.body?.blocked.down;

    if (left.isDown) this.moveLeft();
    else if (right.isDown) this.moveRight();
    else this.stopMoving();

    if (up.isDown && onGround) this.jump();
    else if (!onGround) this.playSafe('turboJump', true);

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) this.fireProjectile();
  }

  fireProjectile() {
    if (!this.canShoot) return;
    this.canShoot = false;
    this.isAttacking = true;

    const dir = this.flipX ? -1 : 1;
    const offsetX = dir * 40;
    const offsetY = 40;
    const onGround = this.body?.blocked.down;

    const animKey = onGround ? 'turboGroundAttack' : 'turboJumpAttack';
    this.playSafe(animKey, false);

    this.scene.time.delayedCall(100, () => {
      const p = new CD(this.scene, this.x + offsetX, this.getTopCenter().y + offsetY, dir, this.projectileConfig);
      this.projectiles.add(p);
      p.setVelocityX(dir * this.projectileConfig.speed);
      p.body.allowGravity = false;
      p.setDepth(5);
      this.scene.playerProjectileFireSFX?.play?.();
    });

    // Recovery phase
    this.scene.time.delayedCall(350, () => {
      this.isAttacking = false;
      const moving = this.cursors.left.isDown || this.cursors.right.isDown;
      if (this.body?.blocked.down) {
        this.playSafe(moving ? 'turboWalk' : 'turboStanding', true);
      } else {
        this.playSafe('turboJump', true);
      }
    });

    // Reset cooldown
    this.scene.time.delayedCall(400, () => (this.canShoot = true));
  }

  playHitReaction() {
    if (!this.scene.anims.exists('turboHitReaction')) return;
    const dir = this.flipX ? -1 : 1;
    this.visual.play('turboHitReaction');
    this.scene.cameras.main.shake(100, 0.01);
    this.setVelocityX(-dir * 160);

    this.scene.time.delayedCall(250, () => {
      this.setVelocityX(0);
      this.playSafe('turboStanding');
    });
  }
}
