export default class BaseFighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, frame) {
    super(scene, x, y, textureKey, frame);

    this.scene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // === Physics setup ===
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setDepth(5);
    this.body.setAllowGravity(true);

    // === Origin + Scaling normalization ===
    this.setOrigin(0.5, 1);
    this.targetHeight = 150;
    this.scaleToHeight(this.targetHeight);
    this.standardizeBodySize();

    // === Hitbox positioning ===
    this.body.setSize(this.width * 0.4, this.height * 0.8);
    this.body.setOffset(this.width * 0.3, this.height * 0.2);

    // === Visual overlay sprite (animation container) ===
    this.setVisible(false);
    this.visual = scene.add.sprite(x, y, textureKey, frame).setOrigin(0.5, 1);
    this.visual.setScale(this.scaleX, this.scaleY);
    this.visual.setDepth(5);

    // 🧩 Normalize filter so all frames blend smoothly
    scene.textures.on(Phaser.Textures.Events.ADD, (key) => {
      const tex = scene.textures.get(key);
      if (tex) tex.setFilter(Phaser.Textures.LINEAR);
    });

    // === Stats ===
    this.speed = 200;
    this.acceleration = 1000;
    this.deceleration = 1200;
    this.jumpPower = 480;
    this.maxHealth = 10;
    this.health = this.maxHealth;
    this.canShoot = true;
    this.isInvulnerable = false;
    this.currentAnim = null;

    // === Input flags ===
    this.isMoving = false;
    this.isJumping = false;

    // === 🧠 Prewarm & cache all textures for consistent frame heights ===
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      Object.keys(scene.textures.list).forEach((key) => {
        const tex = scene.textures.get(key);
        if (tex && tex.getSourceImage && tex.getSourceImage()) {
          // Decode early (GPU upload)
          tex.getSourceImage().decode?.();

          // Force height/width computation for all frames
          Object.values(tex.frames || {}).forEach((frame) => {
            if (frame && !frame.cutHeight) {
              const dummy = frame.canvasData?.height || frame.height;
            }
          });
        }
      });
    });
  }

  // === Scale sprite to a consistent height ===
  scaleToHeight(targetHeight = 150) {
    const doScale = () => {
      const scaleFactor = targetHeight / this.height;
      this.setScale(scaleFactor);
      if (this.visual) this.visual.setScale(scaleFactor);
    };
    this.height > 0 ? doScale() : this.once(Phaser.Textures.Events.UPDATE, doScale);
  }

  // === Normalize hitbox to visual size ===
  standardizeBodySize() {
    const w = this.displayWidth || 50,
      h = this.displayHeight || 150;
    if (this.body?.setSize)
      this.body.setSize(w * 0.5, h * 0.85).setOffset(w * 0.25, h * 0.15);
  }

  // === Movement ===
  moveLeft() {
    this.setFlipX(true);
    this.isMoving = true;
    this.setAccelerationX(-this.acceleration);
    this.playSafe(`${this.texture.key}_walk`, true);
  }

  moveRight() {
    this.setFlipX(false);
    this.isMoving = true;
    this.setAccelerationX(this.acceleration);
    this.playSafe(`${this.texture.key}_walk`, true);
  }

  stopMoving() {
    this.isMoving = false;
    this.setAccelerationX(0);
    this.setDragX(this.deceleration);
    this.playSafe(`${this.texture.key}_idle`, true);
  }

  jump() {
    if (this.body.onFloor() && !this.isJumping) {
      this.setVelocityY(-this.jumpPower);
      this.isJumping = true;
      this.playSafe(`${this.texture.key}_jump`, true);
    }
  }

  land() {
    this.isJumping = false;
    this.playSafe(`${this.texture.key}_idle`, true);
  }

  // === Damage + UI feedback ===
  takeDamage(amount = 1) {
    if (this.isInvulnerable) return;

    this.health = Math.max(0, this.health - amount);
    this.scene.playerHitSFX?.play();
    this.flashRed();

    // 🩸 Auto-trigger subclass hit reaction if it exists
    if (typeof this.playHitReaction === "function") {
      this.playHitReaction();
    }

    // 🔥 Trigger UI update if available
    if (this.scene.updateHealthUI) {
      this.scene.updateHealthUI();

      // 🔴 Blink the health bar red briefly
      const bar = document.getElementById("health-bar-inner");
      if (bar) {
        bar.style.transition =
          "width 0.3s ease-in-out, background-color 0.2s ease";
        bar.style.backgroundColor = "#ff0000";
        setTimeout(() => (bar.style.backgroundColor = "#00aa00"), 300);
      }
    }

    // 💀 Optional: Death handler
    if (this.health <= 0) {
      this.handleDeath();
    }
  }

  // === Healing + UI feedback ===
  heal(amount = 1) {
    this.health = Math.min(this.health + amount, this.maxHealth);

    // 🔋 UI update
    if (this.scene.updateHealthUI) {
      this.scene.updateHealthUI();

      const bar = document.getElementById("health-bar-inner");
      if (bar) {
        bar.style.transition =
          "width 0.3s ease-in-out, background-color 0.2s ease";
        bar.style.backgroundColor = "#00ff00";
        setTimeout(() => (bar.style.backgroundColor = "#00aa00"), 300);
      }
    }

    // 💚 Feedback effect
    this.scene.cameras.main.flash(150, 0, 255, 0);
    console.log(`💚 Healed: ${this.health}/${this.maxHealth}`);
  }

  flashRed() {
    if (!this.visual) return;
    this.isInvulnerable = true;
    this.visual.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => this.visual.clearTint());
    this.scene.time.delayedCall(600, () => (this.isInvulnerable = false));
  }

  handleDeath() {
    this.setTint(0x555555);
    this.setVelocity(0, 0);
    this.scene.levelMusic?.stop();
    this.scene
      .add.image(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        "gameOver"
      )
      .setOrigin(0.5)
      .setDepth(999);
    this.scene.physics.pause();
  }

  setFlipX(flip) {
    super.setFlipX(flip);
    this.visual?.setFlipX(flip);
    return this;
  }

  playSafe(anim, ignoreIfPlaying = true) {
    if (!this.scene.anims.exists(anim)) return;
    if (this.visual) {
      if (this.currentAnim !== anim) {
        this.visual.play(anim, ignoreIfPlaying);
        this.currentAnim = anim;
        // 🔧 Force consistent scale every time animation starts
        this.visual.setScale(this.scaleX, this.scaleY);
      }
    } else if (this.anims && this.anims.currentAnim?.key !== anim) {
      super.play(anim, ignoreIfPlaying);
      this.currentAnim = anim;
    }
  }

  update() {
    // === Sync visual sprite with physics body ===
    if (this.visual) {
      this.visual.x = this.x;
      this.visual.y = this.y;

      // 🧩 Triple-enforced frame caching to prevent random height flickers
      const fh =
        this.visual.frame?.realHeight ||
        this.visual.frame?.height ||
        this.visual.height;

      if (fh && fh > 5) {
        const k = this.targetHeight / fh;

        // Cache & clamp to valid range
        if (!this._lastScale || Math.abs(k - this._lastScale) > 0.0001) {
          this._lastScale = k;
        }

        this.visual.setScale(this._lastScale);
      } else if (this._lastScale) {
        this.visual.setScale(this._lastScale);
      }
    }

    // === Detect landing ===
    if (this.isJumping && this.body.onFloor()) {
      this.land();
    }
  }
}
