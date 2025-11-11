// fighters/ReReMarie.js
import BaseFighter from '../fighters/BaseFighter.js';
import CD from '../../projectiles/cd/CD.js';

export default class ReReMarie extends BaseFighter {
  static preload(scene) {
    // === Idle ===
    scene.load.image('rereIdle1', 'assets/Characters/fighters/reremarie/idle/Idle1.png');
    scene.load.image('rereIdle2', 'assets/Characters/fighters/reremarie/idle/Idle2.png');
    scene.load.image('rereIdle3', 'assets/Characters/fighters/reremarie/idle/Idle3.png');

    // === Walking ===
    scene.load.image('rereWalk1', 'assets/Characters/fighters/reremarie/walking/walking1.png');
    scene.load.image('rereWalk2', 'assets/Characters/fighters/reremarie/walking/walking2.png');
    scene.load.image('rereWalk3', 'assets/Characters/fighters/reremarie/walking/walking3.png');
    scene.load.image('rereWalk4', 'assets/Characters/fighters/reremarie/walking/walking4.png');

    // === Jumping ===
    scene.load.image('rereJump1', 'assets/Characters/fighters/reremarie/jumping/jumping1.png');
    scene.load.image('rereJump2', 'assets/Characters/fighters/reremarie/jumping/jumping2.png');
    scene.load.image('rereJump3', 'assets/Characters/fighters/reremarie/jumping/jumping3.png');
    scene.load.image('rereJump4', 'assets/Characters/fighters/reremarie/jumping/jumping4.png');

    // === Hit Reaction ===
    scene.load.image('rereHit1', 'assets/Characters/fighters/reremarie/hitreaction/Frame1.png');
    scene.load.image('rereHit2', 'assets/Characters/fighters/reremarie/hitreaction/Frame2.png');

    // === Ground Attack ===
    scene.load.image('rereGroundAttack_windup', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_windup.png');
    scene.load.image('rereGroundAttack_impact', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_impact.png');
    scene.load.image('rereGroundAttack_recoil', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_recoil.png');

    // === Jump Attack ===
    scene.load.image('rereJumpAttack_windup', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_windup.png');
    scene.load.image('rereJumpAttack_impact', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_impact.png');
    scene.load.image('rereJumpAttack_recoil', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_recoil.png');

    // === Projectile ===
    scene.load.image('CD', 'assets/Characters/projectiles/cd/CD.png');
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (key, frames, frameRate, repeat = -1) => {
      if (!a.exists(key)) {
        a.create({
          key,
          frames: frames.map((k) => ({ key: k })),
          frameRate,
          repeat,
        });
      }
    };

    make('rereIdle', ['rereIdle1', 'rereIdle2', 'rereIdle3'], 6);
    make('rereWalk', ['rereWalk1', 'rereWalk2', 'rereWalk3', 'rereWalk4'], 8);
    make('rereJump', ['rereJump1', 'rereJump2', 'rereJump3', 'rereJump4'], 6);

    // Ground + Jump attacks using EXACT keys you load
    make(
      'rereGroundAttack',
      ['rereGroundAttack_windup', 'rereGroundAttack_impact', 'rereGroundAttack_recoil'],
      17,
      0
    );
    make(
      'rereJumpAttack',
      ['rereJumpAttack_windup', 'rereJumpAttack_impact', 'rereJumpAttack_recoil'],
      17,
      0
    );

    make('rereHitReaction', ['rereHit1', 'rereHit2'], 10, 0);
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'rereIdle1');
    this.speed = 264;
    this.crossfadeDuration = 100;
    this.projectileConfig = { speed: 600, damage: 1, lifespan: 1800, scale: 1 };

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    ReReMarie.registerAnimations(scene);
    this.playSafe('rereIdle', true);
  }

  update() {
    super.update();
    const { left, right, up } = this.cursors;
    const onGround = this.body?.blocked.down;

    if (left.isDown) this.moveLeft();
    else if (right.isDown) this.moveRight();
    else this.stopMoving();

    if (up.isDown && onGround) this.jump();
    else if (!onGround) this.playSafe('rereJump', true);

    // Fire
    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) this.fireProjectile();
  }

  fireProjectile() {
    if (!this.canShoot) return;
    this.canShoot = false;

    const dir = this.flipX ? -1 : 1;
    const offsetX = dir * 40;
    const offsetY = 40;
    const onGround = this.body?.blocked.down;

    // Choose correct attack animation based on grounded/airborne
    this.playSafe(onGround ? 'rereGroundAttack' : 'rereJumpAttack', false);

    this.scene.time.delayedCall(100, () => {
      const p = new CD(this.scene, this.x + offsetX, this.getTopCenter().y + offsetY, dir, this.projectileConfig);
      this.projectiles.add(p);
      p.setVelocityX(dir * this.projectileConfig.speed);
      p.body.allowGravity = false;
      p.setDepth(5);
      this.scene.playerProjectileFireSFX?.play?.();
    });

    // Recovery → back to movement/idle state
    this.scene.time.delayedCall(350, () => {
      const moving = this.cursors.left.isDown || this.cursors.right.isDown;
      if (this.body?.blocked.down) {
        this.playSafe(moving ? 'rereWalk' : 'rereIdle', true);
      } else {
        this.playSafe('rereJump', true);
      }
    });

    // Cooldown
    this.scene.time.delayedCall(320, () => (this.canShoot = true));
  }

  playHitReaction() {
    if (!this.scene.anims.exists('rereHitReaction')) return;
    const dir = this.flipX ? -1 : 1;

    this.playSafe('rereHitReaction', false);
    this.scene.cameras.main.shake(100, 0.01);
    this.setVelocityX(-dir * 80);

    this.scene.time.delayedCall(220, () => {
      this.setVelocityX(0);
      const moving = this.cursors.left.isDown || this.cursors.right.isDown;
      if (this.body?.blocked.down) {
        this.playSafe(moving ? 'rereWalk' : 'rereIdle', true);
      } else {
        this.playSafe('rereJump', true);
      }
    });
  }
}
