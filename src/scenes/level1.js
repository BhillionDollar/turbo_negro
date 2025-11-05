// scenes/level1.js
import { addFullscreenButton } from '../../utils/fullScreenUtils.js';
import { setupMobileControls } from '../../utils/mobileControls.js';
import TurboNegro from '../characters/fighters/TurboNegro.js';
import ReReMarie from '../characters/fighters/ReReMarie.js';
import MardiGrasZombie from '../characters/enemies/MardiGrasZombie.js';

export default class Level1 extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1' });
  }

  init(data) {
    this.selectedCharacter = data.character || 'TurboNegro';
    this.currentScore = 0;
  }

  // === UI UPDATES ===
  updateHealthUI() {
    const hp = (this.player.health / this.player.maxHealth) * 100;
    document.getElementById('health-bar-inner').style.width = `${hp}%`;
  }

  updateEnemyCountUI() {
    document.getElementById('enemy-count').innerText = `Enemies Left: ${20 - this.totalEnemiesDefeated}`;
  }

  updateScoreUI() {
    const el = document.getElementById('score-display');
    if (el) el.innerText = `Score: ${this.currentScore}`;
  }

  addScore(points = 0) {
    this.currentScore += points;
    this.updateScoreUI();
  }

  // === PRELOAD ===
  preload() {
    // ✅ Fighters & enemies
    TurboNegro.preload(this);
    ReReMarie.preload(this);
    MardiGrasZombie.preload?.(this);

    // ✅ Level + UI assets
    this.load.image('level1Background', 'assets/levels/BackGrounds/Level1.png');
    this.load.image('balcony', 'assets/levels/Platforms/Balcony.png');
    this.load.image('gameOver', 'assets/UI/gameOver.png');
    this.load.image('levelComplete', 'assets/UI/levelComplete.png');
    this.load.image('healthPack', 'assets/characters/pickups/HealthPack.png');

    // ✅ Audio
    this.load.audio('level1Music', 'assets/Audio/LevelMusic/mp3/BlownMoneyAudubonPark.mp3');
    this.load.audio('playerHit', 'assets/Audio/SoundFX/mp3/playerHit.mp3');
    this.load.audio('playerProjectileFire', 'assets/Audio/SoundFX/mp3/playerprojectilefire.mp3');
    this.load.audio('mardiGrasZombieHit', 'assets/Audio/SoundFX/mp3/MardiGrasZombieHit.mp3');
  }

  // === CREATE ===
  create() {
    const { width, height } = this.scale;

    // ✅ Register fighter animations before creating the player
    TurboNegro.registerAnimations(this);
    ReReMarie.registerAnimations(this);

    // === BACKGROUND + AUDIO ===
    this.input.once('pointerdown', () => this.sound.context.resume());
    this.add.image(width / 2, height / 2, 'level1Background').setDisplaySize(width, height);
    this.levelMusic = this.sound.add('level1Music', { loop: true, volume: 0.5 });
    this.levelMusic.play();

    // === SFX ===
    this.playerHitSFX = this.sound.add('playerHit', { volume: 0.6 });
    this.playerProjectileFireSFX = this.sound.add('playerProjectileFire', { volume: 0.6 });
    this.mardiGrasZombieHitSFX = this.sound.add('mardiGrasZombieHit', { volume: 0.6 });

    // === PLATFORMS ===
    this.platforms = this.physics.add.staticGroup();
    const ground = this.platforms
      .create(width / 2, height - 10, null)
      .setDisplaySize(width, 20)
      .setVisible(false)
      .refreshBody();

    const balcony = this.platforms.create(width / 2, height - 350, 'balcony').refreshBody();
    balcony.body.setSize(280, 10).setOffset((balcony.displayWidth - 280) / 2, balcony.displayHeight - 75);

    // === PLAYER ===
    const spawnY = height - 100;
    this.player =
      this.selectedCharacter === 'ReReMarie'
        ? new ReReMarie(this, 150, spawnY)
        : new TurboNegro(this, 150, spawnY);

    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.4, this.player.height * 0.8);
    this.player.body.setOffset(this.player.width * 0.3, this.player.height * 0.2);
    this.physics.add.collider(this.player, this.platforms);

    // === GROUPS ===
    this.enemies = this.physics.add.group();
    this.healthPacks = this.physics.add.group();
    this.projectiles = this.player.projectiles;

    // === COLLISIONS ===
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.healthPacks, this.platforms);
    this.physics.add.overlap(this.player, this.enemies, (p, e) => p.handlePlayerEnemyCollision(p, e));
    this.physics.add.overlap(this.player, this.healthPacks, (p, h) => p.handlePlayerHealthPackCollision(p, h));
    this.physics.add.overlap(this.projectiles, this.enemies, (proj, e) => proj.onHit?.(e));

    // === CAMERA (Locked View) ===
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(width / 2, height / 2);

    // === UI INIT ===
    this.totalEnemiesDefeated = 0;
    this.updateHealthUI();
    this.updateEnemyCountUI();
    this.updateScoreUI();

    // === ENEMY GRAVITY + SPAWN TIMERS ===
    this.enemyGravity = 150;

    this.enemySpawnTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        if (this.enemySpawnTimer.delay > 400) this.enemySpawnTimer.delay -= 100;
        if (this.enemyGravity < 1000) this.enemyGravity += 100;

        this.enemies.children.iterate((z) => {
          if (z && z.body) z.body.setAcceleration(0, this.enemyGravity);
        });
      },
    });

    // === CONTROLS ===
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setupMobileControls(this, this.player);
    }

    addFullscreenButton(this);
  }

  update() {
    if (this.player?.update) this.player.update();
  }

  // === ENEMY SPAWNING ===
  spawnEnemy() {
    if (this.enemies.countActive(true) >= 3) return;

    const x = Phaser.Math.Between(100, this.scale.width - 100);
    const y = -Phaser.Math.Between(150, 300);
    const zombie = new MardiGrasZombie(this, x, y);

    this.enemies.add(zombie);
    zombie.body.setAllowGravity(false);
    zombie.body.setAcceleration(0, this.enemyGravity);
    zombie.body.setVelocityY(Phaser.Math.Between(50, 120));
    this.physics.add.collider(zombie, this.platforms);

    zombie.points = 100;
    zombie.on('destroy', () => {
      if (!zombie.alive) return;
      this.addScore(zombie.points);
    });
  }

  spawnHealthPack() {
    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const pack = this.healthPacks.create(x, 50, 'healthPack');
    pack.setBounce(0.5).setCollideWorldBounds(true);
    this.physics.add.collider(pack, this.platforms);
  }

  // === LEVEL COMPLETE ===
  levelComplete() {
    console.log("🎉 Level Complete!");
    if (this.levelMusic) { this.levelMusic.stop(); this.levelMusic.destroy(); }
    if (this.enemySpawnTimer) this.enemySpawnTimer.remove();

    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);

    const { width, height } = this.scale;
    const completeImg = this.add
      .image(width / 2, height / 2, 'levelComplete')
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.tweens.add({
      targets: completeImg,
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    const proceed = () => this.scene.start('VictoryScene');
    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown-SPACE', proceed);
      this.input.once('pointerdown', proceed);
    });
  }

  gameOver() {
    console.log("💀 Game Over!");
    if (this.levelMusic) { this.levelMusic.stop(); this.levelMusic.destroy(); }
    if (this.enemySpawnTimer) this.enemySpawnTimer.remove();

    this.enemies.clear(true, true);
    this.projectiles.clear(true, true);

    const { width, height } = this.scale;
    const gameOverImg = this.add
      .image(width / 2, height / 2, 'gameOver')
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.tweens.add({
      targets: gameOverImg,
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    const restart = () => this.scene.restart();
    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown-SPACE', restart);
      this.input.once('pointerdown', restart);
    });
  }
}
