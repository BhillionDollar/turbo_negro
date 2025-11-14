// ===============================
// ReReMarie.js
// Advanced Agile Variant of TurboNegro’s Fighter Architecture
// ===============================
//
// ⚙️ DESIGN NOTES:
// • 20% faster movement speed (264 vs 220)
// • Same jump power (480)
// • 20% faster attack/recoil recovery
// • 20% shorter projectile cooldown (320 ms)
// • Smooth animation blending, lockFacing, recoil, camera shake
// • Uses folder structure under /assets/Characters/fighters/reremarie/
// ===============================

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

    // === Attacks ===
    scene.load.image('rereGroundAttack_windup', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_windup.png');
    scene.load.image('rereGroundAttack_impact', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_impact.png');
    scene.load.image('rereGroundAttack_recoil', 'assets/Characters/fighters/reremarie/attack/groundattack/groundattack_recoil.png');

    scene.load.image('rereJumpAttack_windup', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_windup.png');
    scene.load.image('rereJumpAttack_impact', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_impact.png');
    scene.load.image('rereJumpAttack_recoil', 'assets/Characters/fighters/reremarie/attack/jumpattack/jumpattack_recoil.png');

    // === Projectile ===
    scene.load.image('CD', 'assets/Characters/projectiles/cd/CD.png');
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (key, cfg) => { if (!a.exists(key)) a.create(cfg); };

    make('rereIdle', {
      key: 'rereIdle',
      frames: [{ key: 'rereIdle1' }, { key: 'rereIdle2' }, { key: 'rereIdle3' }],
      frameRate: 6,
      repeat: -1,
    });

    make('rereWalk', {
      key: 'rereWalk',
      frames: [{ key: 'rereWalk1' }, { key: 'rereWalk2' }, { key: 'rereWalk3' }, { key: 'rereWalk4' }],
      frameRate: 8,
      repeat: -1,
    });

    make('rereJump', {
      key: 'rereJump',
      frames: [{ key: 'rereJump1' }, { key: 'rereJump2' }, { key: 'rereJump3' }, { key: 'rereJump4' }],
      frameRate: 6,
      repeat: -1,
    });

    make('rereGroundAttack', {
      key: 'rereGroundAttack',
      frames: [
        { key: 'rereGroundAttack_windup' },
        { key: 'rereGroundAttack_impact' },
        { key: 'rereGroundAttack_recoil' },
      ],
      frameRate: 17,
      repeat: 0,
    });

    make('rereJumpAttack', {
      key: 'rereJumpAttack',
      frames: [
        { key: 'rereJumpAttack_windup' },
        { key: 'rereJumpAttack_impact' },
        { key: 'rereJumpAttack_recoil' },
      ],
      frameRate: 17,
      repeat: 0,
    });

    make('rereHitReaction', {
      key: 'rereHitReaction',
      frames: [{ key: 'rereHit1' }, { key: 'rereHit2' }],
      frameRate: 10,
      repeat: 0,
    });
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'rereIdle1');
    this.setOrigin(0.5, 1);

    this.speed = 264;
    this.jumpPower = 480;
    this.targetHeight = 150;
    this.crossfadeDuration = 100;
    this.lockFacing = false;

    this.projectileConfig = { speed: 600, damage: 1, lifespan: 1800, scale: 1 };
    this.projectiles = scene.physics.add.group({ allowGravity: false });

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    ReReMarie.registerAnimations(scene);
    this.playSmoothTransition('rereIdle', true);

    // === 🧩 Cross-Version Frame Warmup (Phaser 3.55+ Safe) ===
    const animMap = scene.anims.anims;
    if (animMap && typeof animMap.each === 'function') {
      animMap.each((anim) => {
        if (anim && anim.frames) {
          anim.frames.forEach((f) => {
            const frame = scene.textures.getFrame(f.key);
            if (frame && !frame.cutHeight) {
              const _ = frame.canvasData?.height || frame.height;
            }
          });
        }
      });
    } else if (animMap && typeof animMap.getAll === 'function') {
      animMap.getAll().forEach((anim) => {
        anim.frames.forEach((f) => {
          const frame = scene.textures.getFrame(f.key);
          if (frame && !frame.cutHeight) {
            const _ = frame.canvasData?.height || frame.height;
          }
        });
      });
    }

    if (this.visual) {
      this.visual.on('animationupdate', this._rescaleVisual, this);
      this._rescaleVisual();
    }
  }

  _setFacing(dir) {
    this.lastDirection = dir;
    this.setFlipX(dir < 0);
    if (this.visual) this.visual.setFlipX(dir < 0);
  }

  _getFacing() {
    return this.lastDirection || 1;
  }

  _rescaleVisual() {
    if (!this.visual || !this.visual.frame) return;
    const fh = this.visual.frame.realHeight || this.visual.frame.height || this.visual.height || 1;
    const k = this.targetHeight / fh;
    this.visual.setScale(k);
  }

  playSmoothTransition(animKey, ignoreIfPlaying = true) {
    if (!this.scene.anims.exists(animKey) || !this.visual) return;

    if (this.currentAnim && this.currentAnim !== animKey) {
      this.scene.tweens.add({
        targets: this.visual,
        alpha: { from: 0.85, to: 1 },
        duration: this.crossfadeDuration,
        ease: 'Sine.easeInOut',
      });
    }

    if (this.currentAnim !== animKey) {
      this.visual.play(animKey, ignoreIfPlaying);
      this.currentAnim = animKey;
    }
  }

  playHitReaction() {
    if (!this.scene.anims.exists('rereHitReaction') || !this.visual) return;

    const dir = this._getFacing();
    this.lockFacing = true;
    this._setFacing(dir);

    this.visual.play('rereHitReaction');
    this.scene.cameras.main.shake(100, 0.01);

    const recoilForce = dir > 0 ? -60 : 60;
    this.setVelocityX(recoilForce);

    this.scene.time.delayedCall(220, () => {
      this.setVelocityX(0);
      this.lockFacing = false;
      this._setFacing(dir);
      this.playSmoothTransition('rereIdle');
    });
  }

  update() {
    super.update();
    if (this.scene.sys.game.device.input.touch) return;
    if (this.lockFacing) return;

    const { left, right, up } = this.cursors;
    const onGround = this.body?.blocked.down;
    const moving = left.isDown || right.isDown;

    if (left.isDown) {
      this.setVelocityX(-this.speed);
      this._setFacing(-1);
    } else if (right.isDown) {
      this.setVelocityX(this.speed);
      this._setFacing(1);
    } else {
      this.setVelocityX(0);
    }

    if (up.isDown && onGround) {
      this.jump();
      this.playSmoothTransition('rereJump');
    } else if (!onGround) {
      this.playSmoothTransition('rereJump');
    } else if (moving) {
      this.playSmoothTransition('rereWalk');
    } else {
      this.playSmoothTransition('rereIdle');
    }

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) this.fireProjectile();
  }

  fireProjectile() {
    if (!this.canShoot) return;
    this.canShoot = false;
    this.isAttacking = true;

    const dir = this._getFacing();
    this.lockFacing = true;
    this._setFacing(dir);

    const offsetX = dir * 40;
    const offsetY = 40;
    const onGround = this.body?.blocked.down;
    const animKey = onGround ? 'rereGroundAttack' : 'rereJumpAttack';

    this.playSmoothTransition(animKey, false);

    this.scene.time.delayedCall(90, () => {
      const p = new CD(this.scene, this.x + offsetX, this.getTopCenter().y + offsetY, dir, this.projectileConfig);
      this.projectiles.add(p);
      p.setVelocityX(dir * this.projectileConfig.speed);
      p.body.allowGravity = false;
      p.setDepth(5);
      this.scene.playerProjectileFireSFX?.play();
    });

    this.scene.time.delayedCall(350, () => {
      this.isAttacking = false;
      this.lockFacing = false;
      if (this.body?.blocked.down) {
        if (this.cursors.left.isDown || this.cursors.right.isDown)
          this.playSmoothTransition('rereWalk');
        else this.playSmoothTransition('rereIdle');
      } else {
        this.playSmoothTransition('rereJump');
      }
    });

    this.scene.time.delayedCall(320, () => (this.canShoot = true));
  }

  handlePlayerEnemyCollision(p, e) {
    e.destroy();
    this.takeDamage(1);
  }

  handlePlayerHealthPackCollision(p, h) {
    h.destroy();
    this.heal?.(5);
  }
}
