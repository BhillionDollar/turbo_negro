import BaseFighter from '../fighters/BaseFighter.js';
import CD from '../../projectiles/cd/CD.js';

export default class TurboNegro extends BaseFighter {
  static preload(scene) {
    // Standing
    scene.load.image('turboStanding1','assets/Characters/fighters/turbonegro/standing/standing1.png');
    scene.load.image('turboStanding2','assets/Characters/fighters/turbonegro/standing/standing2.png');
    scene.load.image('turboStanding3','assets/Characters/fighters/turbonegro/standing/standing3.png');
    scene.load.image('turboStanding4','assets/Characters/fighters/turbonegro/standing/standing4.png');

    // Walking
    scene.load.image('turboWalk1','assets/Characters/fighters/turbonegro/walking/walking1.png');
    scene.load.image('turboWalk2','assets/Characters/fighters/turbonegro/walking/walking2.png');
    scene.load.image('turboWalk3','assets/Characters/fighters/turbonegro/walking/walking3.png');
    scene.load.image('turboWalk4','assets/Characters/fighters/turbonegro/walking/walking4.png');

    // Jumping
    scene.load.image('turboJump1','assets/Characters/fighters/turbonegro/jumping/jump1.png');
    scene.load.image('turboJump2','assets/Characters/fighters/turbonegro/jumping/jump2.png');
    scene.load.image('turboJump3','assets/Characters/fighters/turbonegro/jumping/jump3.png');

    // Ground Attack
    scene.load.image('turboGroundAttack_windup','assets/Characters/fighters/turbonegro/attack/groundattack/groundAttack_windup.png');
    scene.load.image('turboGroundAttack_impact','assets/Characters/fighters/turbonegro/attack/groundattack/groundAttack_impact.png');
    scene.load.image('turboGroundAttack_recoil','assets/Characters/fighters/turbonegro/attack/groundattack/groundAttack_recoil.png');

    // Jump Attack
    scene.load.image('turboJumpAttack_windup','assets/Characters/fighters/turbonegro/attack/jumpattack/jumpattack_windup.png');
    scene.load.image('turboJumpAttack_impact','assets/Characters/fighters/turbonegro/attack/jumpattack/jumpattack_impact.png');
    scene.load.image('turboJumpAttack_recoil','assets/Characters/fighters/turbonegro/attack/jumpattack/jumpattack_recoil.png');

    // 🩸 Hit Reaction
    scene.load.image('turboHit1','assets/Characters/fighters/turbonegro/hitreaction/Frame1.png');
    scene.load.image('turboHit2','assets/Characters/fighters/turbonegro/hitreaction/Frame2.png');

    // Projectile
    scene.load.image('CD','assets/Characters/projectiles/cd/CD.png');
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (key,cfg)=>{ if(!a.exists(key)) a.create(cfg); };

    make('turboStanding',{
      key:'turboStanding',
      frames:[{key:'turboStanding1'},{key:'turboStanding2'},{key:'turboStanding3'},{key:'turboStanding4'}],
      frameRate:5, repeat:-1
    });

    make('turboWalk',{
      key:'turboWalk',
      frames:[{key:'turboWalk1'},{key:'turboWalk2'},{key:'turboWalk3'},{key:'turboWalk4'}],
      frameRate:7, repeat:-1
    });

    make('turboJump',{
      key:'turboJump',
      frames:[{key:'turboJump1'},{key:'turboJump2'},{key:'turboJump3'}],
      frameRate:5, repeat:-1
    });

    make('turboGroundAttack',{
      key:'turboGroundAttack',
      frames:[
        {key:'turboGroundAttack_windup'},
        {key:'turboGroundAttack_impact'},
        {key:'turboGroundAttack_recoil'}
      ],
      frameRate:14, repeat:0
    });

    make('turboJumpAttack',{
      key:'turboJumpAttack',
      frames:[
        {key:'turboJumpAttack_windup'},
        {key:'turboJumpAttack_impact'},
        {key:'turboJumpAttack_recoil'}
      ],
      frameRate:14, repeat:0
    });

    make('turboHitReaction', {
      key: 'turboHitReaction',
      frames: [{ key: 'turboHit1' }, { key: 'turboHit2' }],
      frameRate: 10,
      repeat: 0
    });
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'turboStanding1');
    this.setOrigin(0.5, 1);

    this.speed = 220;
    this.jumpPower = 480;

    this.targetHeight = 150;
    this.fadeDuration = 80;
    this.crossfadeDuration = 120;
    this.lastDirection = 1;
    this.lockFacing = false;

    this.projectileConfig = { speed:600, damage:1, lifespan:1800, scale:1 };
    this.projectiles = scene.physics.add.group({ allowGravity:false });

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    TurboNegro.registerAnimations(scene);
    this.playSmoothTransition('turboStanding', true);

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

  // 2) Push firmly AWAY from the recorded hit side
  playHitReaction() {
    if (!this.scene.anims.exists('turboHitReaction') || !this.visual) return;

    const dir = this._getFacing();
    this.lockFacing = true;
    this._setFacing(dir);
    this.visual.play('turboHitReaction');
    this.scene.cameras.main.shake(100, 0.01);

    // Compute recoil strictly from last contact side; fallback to current touching flags; final fallback = opposite of facing
    const touching = this.body?.touching || {};
    let recoilVX = 0;

    if (this._lastHitFrom === 'left')       recoilVX = +160;   // push right
    else if (this._lastHitFrom === 'right') recoilVX = -160;   // push left
    else if (touching.left)                 recoilVX = +160;
    else if (touching.right)                recoilVX = -160;
    else                                    recoilVX = (dir > 0 ? -160 : +160);

    this.setVelocityX(recoilVX);

    this.scene.time.delayedCall(250, () => {
      this.setVelocityX(0);
      this.lockFacing = false;
      this._setFacing(dir);
      this.playSmoothTransition('turboStanding');
    });

    this._lastHitFrom = undefined;
  }

  _setFacing(dir){ 
    this.lastDirection = dir;
    this.setFlipX(dir < 0);
    if (this.visual) this.visual.setFlipX(dir < 0);
  }
  _getFacing(){ return this.lastDirection || 1; }

  _rescaleVisual(){
    if(!this.visual || !this.visual.frame) return;
    const fh = this.visual.frame.realHeight || this.visual.frame.height || this.visual.height || 1;
    const k = this.targetHeight / fh;
    this.visual.setScale(k);
  }

  update(){
    super.update();
    if (this.lockFacing) return;

    const { left, right, up } = this.cursors;
    const onGround = this.body?.blocked.down;
    const moving = left.isDown || right.isDown;

    if (left.isDown){
      this.setVelocityX(-this.speed);
      this._setFacing(-1);
    } else if (right.isDown){
      this.setVelocityX(this.speed);
      this._setFacing(1);
    } else {
      this.setVelocityX(0);
    }

    if (up.isDown && onGround){
      this.jump();
      this.playSmoothTransition('turboJump');
    } else if (!onGround){
      this.playSmoothTransition('turboJump');
    } else if (moving){
      this.playSmoothTransition('turboWalk');
    } else {
      this.playSmoothTransition('turboStanding');
    }

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) this.fireProjectile();
  }

  fireProjectile(){
    if (!this.canShoot) return;
    this.canShoot = false;
    this.isAttacking = true;

    const dir = this._getFacing();
    this.lockFacing = true;
    this._setFacing(dir);

    const offsetX = dir * 40;
    const offsetY = 40;
    const onGround = this.body?.blocked.down;
    const animKey = onGround ? 'turboGroundAttack' : 'turboJumpAttack';

    this.playSmoothTransition(animKey, false);

    this.scene.time.delayedCall(110, () => {
      const p = new CD(this.scene, this.x + offsetX, this.getTopCenter().y + offsetY, dir, this.projectileConfig);
      this.projectiles.add(p);
      p.setVelocityX(dir * this.projectileConfig.speed);
      p.body.allowGravity = false;
      p.setDepth(5);
      this.scene.playerProjectileFireSFX?.play();
    });

    this.scene.time.delayedCall(440, () => {
      this.isAttacking = false;
      this.lockFacing = false;
      if (this.body?.blocked.down) {
        if (this.cursors.left.isDown || this.cursors.right.isDown)
          this.playSmoothTransition('turboWalk');
        else this.playSmoothTransition('turboStanding');
      } else {
        this.playSmoothTransition('turboJump');
      }
    });

    this.scene.time.delayedCall(400, () => (this.canShoot = true));
  }

  playSmoothTransition(animKey, ignoreIfPlaying = true){
    if (!this.scene.anims.exists(animKey) || !this.visual) return;

    if (this.currentAnim && this.currentAnim !== animKey){
      this.scene.tweens.add({
        targets: this.visual,
        alpha: { from: 0.85, to: 1 },
        duration: this.crossfadeDuration,
        ease: 'Sine.easeInOut'
      });
    }

    if (this.currentAnim !== animKey){
      this.visual.play(animKey, ignoreIfPlaying);
      this.currentAnim = animKey;
    }
  }

  // 1) Use Arcade.Collider contact flags to record the hit side
  handlePlayerEnemyCollision(p, e) {
    // Prefer physics contact flags from *player's* body
    const touching = p.body?.touching || {};
    if (touching.left)      this._lastHitFrom = 'left';   // enemy on player's left
    else if (touching.right) this._lastHitFrom = 'right';  // enemy on player's right
    else {
      // Fallback to center-x if flags aren't set (e.g., rare overlap edge cases)
      const myCX = p.body?.center?.x ?? p.x;
      const enCX = e.body?.center?.x ?? e.x;
      this._lastHitFrom = (enCX < myCX) ? 'left' : 'right';
    }

    e.destroy();
    this.takeDamage(1);
  }

  handlePlayerHealthPackCollision(p,h){ 
    h.destroy(); 
    this.heal?.(5); 
  }
}
