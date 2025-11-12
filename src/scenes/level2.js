import { addFullscreenButton } from '/utils/fullScreenUtils.js';
import { setupMobileControls } from '/utils/mobileControls.js';

export default class Level2 extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2' });
    }

    updateHealthUI() {
        const healthPercentage = (this.playerHealth / this.maxHealth) * 100;
        document.getElementById('health-bar-inner').style.width = `${healthPercentage}%`;
    }

    updateEnemyCountUI() {
        document.getElementById('enemy-count').innerText = `Enemies Left: ${30 - this.totalEnemiesDefeated}`;
    }

    preload() {
        console.log("Preloading assets for Level 2...");
        this.load.image('level2Background', 'assets/Levels/BackGrounds/Level2.webp');
        this.load.image('turboNegroWalking', 'assets/Characters/Character1/TurboNegroWalking/TurboNegroWalking.png');
        this.load.image('turboNegroJump', 'assets/Characters/Character1/TurboNegroJump.png');
        this.load.image('projectileCD', 'assets/Characters/Projectiles/CD/CDresize.png');
        this.load.image('turboNegroStanding1', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding1.png');
        this.load.image('turboNegroStanding2', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding2.png');
        this.load.image('turboNegroStanding3', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding3.png');
        this.load.image('turboNegroStanding4', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding4.png');
        this.load.image('ledgeLeft', 'assets/Levels/Platforms/LedgeLeft.png');
        this.load.image('ledgeRight', 'assets/Levels/Platforms/LedgeRight.png');
        this.load.image('skeleton', 'assets/Characters/Enemies/MardiGrasZombie.png');
        this.load.image('trumpetSkeleton', 'assets/Characters/Enemies/TrumpetSkeleton.png');
        this.load.image('gameOver', 'assets/UI/gameOver.png');
        this.load.image('levelComplete', 'assets/UI/levelComplete.png');
        this.load.image('healthPack', 'assets/Characters/Pickups/HealthPack.png');
        this.load.audio('level2Music', 'assets/Audio/LevelMusic/mp3/SeptemberHue.mp3');
        console.log("Assets for Level 2 preloaded successfully.");

        // Load sound effects like Level 1
        this.load.audio('playerHit', 'assets/Audio/SoundFX/mp3/playerHit.mp3');
        this.load.audio('playerProjectileFire', 'assets/Audio/SoundFX/mp3/playerprojectilefire.mp3');
        this.load.audio('mardiGrasZombieHit', 'assets/Audio/SoundFX/mp3/MardiGrasZombieHit.mp3');
        this.load.audio('trumpetSkeletonSound', 'assets/Audio/SoundFX/mp3/trumpetSkeletonHit.mp3');
    }

    create() {
        const { width, height } = this.scale;
        
        // Play background music
        this.levelMusic = this.sound.add('level2Music', { loop: true, volume: 0.5 });
        this.levelMusic.play();
    
        // Sound Effects
        this.playerHitSFX = this.sound.add('playerHit', { volume: 0.6 });
        this.playerProjectileFireSFX = this.sound.add('playerProjectileFire', { volume: 0.6 });
        this.mardiGrasZombieHitSFX = this.sound.add('mardiGrasZombieHit', { volume: 0.6 });
        this.trumpetSkeletonSFX = this.sound.add('trumpetSkeletonSound', { volume: 0.4 });
    
        // Initialize health, enemy count, and projectiles group
        this.playerHealth = 10;
        this.maxHealth = 10;
        this.totalEnemiesDefeated = 0;
        this.projectiles = this.physics.add.group({ defaultKey: 'projectileCD' });
    
        // Set background
        this.add.image(width / 2, height / 2, 'level2Background')
            .setDisplaySize(width, height)
            .setDepth(0);
    
        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(width / 2, height - 20, null)
            .setDisplaySize(width, 20)
            .setVisible(false)
            .refreshBody();
    
        const leftLedge = this.add.image(150, height - 400, 'ledgeLeft').setDepth(2);
        const rightLedge = this.add.image(width - 150, height - 400, 'ledgeRight').setDepth(2);
    
        this.platforms.create(150, height - 325, null)
            .setDisplaySize(300, 10)
            .setVisible(false)
            .refreshBody();
        this.platforms.create(width - 150, height - 325, null)
            .setDisplaySize(300, 10)
            .setVisible(false)
            .refreshBody();
    
        // Create player
        this.player = this.physics.add.sprite(100, height - 100, 'turboNegroStanding1');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
    
        // Set player depth
        this.player.setDepth(1);
    
        // Initialize isJumping
        this.isJumping = false;
    
        // Create animations
        this.anims.create({
            key: 'idle',
            frames: [
                { key: 'turboNegroStanding1' },
                { key: 'turboNegroStanding2' },
                { key: 'turboNegroStanding3' },
                { key: 'turboNegroStanding4' },
            ],
            frameRate: 4,
            repeat: -1,
        });
        this.anims.create({ key: 'walk', frames: [{ key: 'turboNegroWalking' }], frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'jump', frames: [{ key: 'turboNegroJump' }], frameRate: 1 });
    
        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // Setup health packs
        this.healthPacks = this.physics.add.group();
        this.physics.add.collider(this.healthPacks, this.platforms);
        this.physics.add.overlap(this.player, this.healthPacks, this.handlePlayerHealthPackCollision, null, this);
    
        // Setup enemies and projectiles
        this.enemies = this.physics.add.group();
        this.trumpetEnemies = this.physics.add.group();
    
        // Spawn timers
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnMardiGrasZombie,
            callbackScope: this,
            loop: true,
        });
    
        this.trumpetSpawnTimer = this.time.addEvent({
            delay: 3000,
            callback: this.spawnTrumpetSkeleton,
            callbackScope: this,
            loop: true,
        });
    
        // Update UI
        this.updateHealthUI();
        this.updateEnemyCountUI();
    
        // Setup collisions
        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.collider(this.player, this.trumpetEnemies, this.handleTrumpetSkeletonCollision, null, this);
        this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
        this.physics.add.collider(this.projectiles, this.trumpetEnemies, this.handleProjectileEnemyCollision, null, this);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.trumpetEnemies, this.platforms);
    
        // Hook up the attack button
        const attackButton = document.getElementById('attack-button');
        if (attackButton) {
            attackButton.addEventListener('click', () => {
                this.fireProjectile();
            });
        }
    
        // Setup mobile controls
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            console.log("Mobile device detected. Initializing controls...");
            setupMobileControls(this, this.player);
        } else {
            console.log("Desktop detected. Skipping mobile controls.");
        }
    
        // Tap anywhere to attack
        this.input.on('pointerdown', (pointer) => {
            if (!pointer.wasTouch) return;
            this.fireProjectile();
        });
    
        // Swipe up to jump
        let startY = null;
        this.input.on('pointerdown', (pointer) => {
            startY = pointer.y;
        });
    
        this.input.on('pointerup', (pointer) => {
            if (startY !== null && pointer.y < startY - 50 && this.player.body.touching.down) {
                this.player.setVelocityY(-500);
                this.player.play('jump', true);
            }
            startY = null;
        });

        // Add Fullscreen Button
        addFullscreenButton(this);
    }
    
    update() {
        if (!this.player || !this.cursors) return;

        this.player.setVelocityX(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-165);
            this.player.setFlipX(true);
            if (!this.isJumping) this.player.play('walk', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(165);
            this.player.setFlipX(false);
            if (!this.isJumping) this.player.play('walk', true);
        } else if (this.player.body.touching.down && !this.isJumping) {
            this.player.play('idle', true);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down && !this.isJumping) {
            this.isJumping = true;
            this.player.setVelocityY(-500);
            this.player.play('jump', true);
        }

        if (this.player.body.touching.down && this.isJumping) {
            this.isJumping = false;
            this.player.play('idle', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fireProjectile();
        }
    }  

    fireProjectile() {
        // Check if the user is on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
        if (isMobile) {
            console.warn(`🚫 Prevented level fireProjectile() - Mobile users should use mobileControls.js instead.`);
            return; // Ensure mobile users fire only via mobileControls.js
        }
    
        // Proceed with firing for desktop users only
        const projectile = this.projectiles.create(this.player.x, this.player.y, 'projectileCD');
        if (projectile) {
            projectile.setActive(true);
            projectile.setVisible(true);
            projectile.body.setAllowGravity(false);
            projectile.setVelocityX(this.player.flipX ? -500 : 500);
            this.playerProjectileFireSFX.play();
        }
    }
     

    enemyAI(enemy) {
        if (!enemy || !enemy.body || !this.player || !this.player.body) return;
        
        const playerX = this.player.x;
        
        if (enemy.x < playerX - 10) {
            enemy.setVelocityX(100);
            enemy.setFlipX(false);
        } else if (enemy.x > playerX + 10) {
            enemy.setVelocityX(-100);
            enemy.setFlipX(true);
        } else {
            enemy.setVelocityX(0);
        }
        
        if (Phaser.Math.Between(0, 100) < 20 && enemy.body.touching.down && Math.abs(enemy.x - playerX) < 200) {
            enemy.setVelocityY(-300);
        }
    } 

    handlePlayerEnemyCollision(player, enemy) {
        enemy.destroy();
        this.playerHealth--;
        this.updateHealthUI();
        this.playerHitSFX.play();
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        projectile.destroy();
        enemy.destroy();
        this.totalEnemiesDefeated++;
        this.updateEnemyCountUI();
        
        console.log(`Total Enemies Defeated: ${this.totalEnemiesDefeated}`);
        if (this.totalEnemiesDefeated % 12 === 0) {
            console.log("Spawning health pack!");
            this.spawnHealthPack();
        }
        if (this.totalEnemiesDefeated >= 30) {
            console.log("Level should complete now!");
            this.levelComplete();
        }

        if (enemy.texture && enemy.texture.key) {
            if (enemy.texture.key === 'skeleton') {
                this.mardiGrasZombieHitSFX.play();
            } else if (enemy.texture.key === 'trumpetSkeleton') {
                this.trumpetSkeletonSFX.play();
            }
        }
    }

    handlePlayerHealthPackCollision(player, healthPack) {
        healthPack.destroy();
        this.playerHealth = Math.min(this.playerHealth + 5, this.maxHealth);
        this.updateHealthUI();
        console.log("Health pack collected! Health:", this.playerHealth);
    }

    handleTrumpetSkeletonCollision(player, trumpetSkeleton) {
        console.log('Player hit by Trumpet Skeleton!');
        trumpetSkeleton.destroy();
        this.playerHealth--;
        this.updateHealthUI();
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    spawnHealthPack() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        const healthPack = this.healthPacks.create(x, 50, 'healthPack');
        healthPack.setBounce(0.5);
        this.physics.add.collider(healthPack, this.platforms);
        console.log("Health pack spawned at:", x);
    }

    spawnMardiGrasZombie() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        const y = 0;
        
        const enemy = this.enemies.create(x, y, 'skeleton');
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(0.2);
        
        enemy.aiTimer = this.time.addEvent({
            delay: 500,
            callback: () => {
                if (enemy.active) this.enemyAI(enemy);
            },
            loop: true,
        });
        
        enemy.on('destroy', () => {
            if (enemy.aiTimer) enemy.aiTimer.remove();
        });
    }

    spawnTrumpetSkeleton() {
        const { width, height } = this.scale;
        const x = Math.random() < 0.5 ? 0 : width;
        const y = height - 150;
        
        const trumpetSkeleton = this.trumpetEnemies.create(x, y, 'trumpetSkeleton');
        trumpetSkeleton.setCollideWorldBounds(true);
        trumpetSkeleton.body.allowGravity = true;
        
        trumpetSkeleton.isLanded = true;
        
        this.time.addEvent({
            delay: 1500,
            loop: true,
            callback: () => {
                if (trumpetSkeleton.active && trumpetSkeleton.body && trumpetSkeleton.isLanded) {
                    trumpetSkeleton.setVelocityY(-300);
                    const direction = this.player.x > trumpetSkeleton.x ? 150 : -150;
                    trumpetSkeleton.setVelocityX(direction);
                    trumpetSkeleton.isLanded = false;
                }
            },
        });
        
        this.physics.add.collider(trumpetSkeleton, this.platforms, () => {
            trumpetSkeleton.setVelocityX(0);
            trumpetSkeleton.isLanded = true;
        });
        
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (
                    trumpetSkeleton.active &&
                    trumpetSkeleton.body &&
                    trumpetSkeleton.isLanded &&
                    Phaser.Math.Distance.Between(this.player.x, this.player.y, trumpetSkeleton.x, trumpetSkeleton.y) < 150
                ) {
                    this.trumpetSkeletonAttack(trumpetSkeleton);
                }
            },
        });
    }
    
    gameOver() {
        console.log("Game Over!");
    
        // Stop all sounds & timers
        this.cleanUpLevel();
    
        // Display Game Over screen
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'gameOver').setOrigin(0.5);
    
        // Restart the level on SPACE (desktop) or tap (mobile)
        const restartLevel = () => {
            this.scene.restart();
        };
    
        this.handleLevelTransition(restartLevel);
    }
    
    levelComplete() {
        console.log("Level Complete Triggered!");
    
        // 🔥 Meta Pixel custom event for Level 2 completion
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'LevelComplete', { level: '2' });
        }
    
        if (this.levelMusic) this.levelMusic.stop();
        this.cleanUpLevel();
    
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'levelComplete').setOrigin(0.5);
        this.handleLevelTransition(() => this.scene.start('Level3'));
    }
    

    cleanUpLevel() {
        // Stop music if it's playing
        if (this.levelMusic) {
            this.levelMusic.stop();
            this.levelMusic.destroy();
        }
    
        // Remove all enemy and projectile spawn timers
        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
        if (this.trumpetSpawnTimer) this.trumpetSpawnTimer.remove();
    
        // Clear all game objects to free up memory
        this.enemies.clear(true, true);
        this.trumpetEnemies.clear(true, true);
        this.projectiles.clear(true, true);
    
        console.log("Level cleaned up successfully.");
    }

    handleLevelTransition(callback) {
        // Desktop: Listen for SPACE key
        this.input.keyboard.once('keydown-SPACE', callback);
    
        // Mobile: Listen for tap anywhere
        this.input.once('pointerdown', callback);
    }
    
}
