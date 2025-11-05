import { addFullscreenButton } from '/utils/fullScreenUtils.js';
import { setupMobileControls } from '/utils/mobileControls.js';

export default class Level4 extends Phaser.Scene {
    constructor() {
        super({ key: 'Level4' });
    }

    updateHealthUI() {
        const healthPercentage = (this.playerHealth / this.maxHealth) * 100;
        document.getElementById('health-bar-inner').style.width = `${healthPercentage}%`;
    }

    updateEnemyCountUI() {
        document.getElementById('enemy-count').innerText = `Enemies Left: ${45 - this.totalEnemiesDefeated}`;
    }

    preload() {
        console.log("Preloading assets for Level 4...");
        this.load.image('level4Background', 'assets/Levels/BackGrounds/Level4.webp');
        this.load.image('platform', 'assets/Levels/Platforms/platform.png');
        this.load.image('mardiGrasZombie', 'assets/Characters/Enemies/MardiGrasZombie.png');
        this.load.image('trumpetSkeleton', 'assets/Characters/Enemies/TrumpetSkeleton.png');
        this.load.image('beignetMinion', 'assets/Characters/Enemies/Beignet_Minion.png');
        this.load.image('beignetProjectile', 'assets/Characters/Projectiles/Beignet/Beignet2.png');
        this.load.image('turboNegroStanding1', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding1.png');
        this.load.image('turboNegroStanding2', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding2.png');
        this.load.image('turboNegroStanding3', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding3.png');
        this.load.image('turboNegroStanding4', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding4.png');
        this.load.image('turboNegroWalking', 'assets/Characters/Character1/TurboNegroWalking/TurboNegroWalking.png');
        this.load.image('turboNegroJump', 'assets/Characters/Character1/TurboNegroJump.png');
        this.load.image('playerProjectile', 'assets/Characters/Projectiles/CD/CDresize.png');
        this.load.image('healthPack', 'assets/Items/HealthPack.png');
        this.load.audio('level4Music', 'assets/Audio/LevelMusic/mp3/Danza.mp3');

        // Load sound effects like Level 1
        this.load.audio('playerHit', 'assets/Audio/SoundFX/mp3/playerHit.mp3');
        this.load.audio('playerProjectileFire', 'assets/Audio/SoundFX/mp3/playerprojectilefire.mp3');
        this.load.audio('mardiGrasZombieHit', 'assets/Audio/SoundFX/mp3/MardiGrasZombieHit.mp3');
        this.load.audio('trumpetSkeletonSound', 'assets/Audio/SoundFX/mp3/trumpetSkeletonHit.mp3');
        this.load.audio('beignetMinionHit', 'assets/Audio/SoundFX/mp3/beignetminionHit.mp3');
        this.load.audio('beignetProjectileFire', 'assets/Audio/SoundFX/mp3/beignetprojectilefire.mp3');

    }

    create() {
        const { width, height } = this.scale;
    
        // Background and Music
        this.add.image(width / 2, height / 2, 'level4Background').setDisplaySize(width, height);
        this.levelMusic = this.sound.add('level4Music', { loop: true, volume: 0.5 });
        this.levelMusic.play();
    
        // Sound Effects
        this.playerHitSFX = this.sound.add('playerHit', { volume: 0.6 });
        this.playerProjectileFireSFX = this.sound.add('playerProjectileFire', { volume: 0.6 });
        this.mardiGrasZombieHitSFX = this.sound.add('mardiGrasZombieHit', { volume: 0.6 });
        this.trumpetSkeletonSFX = this.sound.add('trumpetSkeletonSound', { volume: 0.4 });
        this.beignetMinionHitSFX = this.sound.add('beignetMinionHit', { volume: 0.8 });
        this.beignetProjectileFireSFX = this.sound.add('beignetProjectileFire', { volume: 0.6 });
    
        // Player Setup
        this.player = this.physics.add.sprite(100, height - 150, 'turboNegroStanding1');
        this.player.setCollideWorldBounds(true);
    
        // Player Animations
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
    
        // Input Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
        // Platforms Setup
        this.platforms = this.physics.add.staticGroup();
        this.ground = this.platforms.create(width / 2, height - 10, null).setDisplaySize(width, 20).setVisible(false).refreshBody();
        this.platforms.create(width / 2, height / 2 - 50, 'platform').setDisplaySize(150, 20).setVisible(true).refreshBody();
        this.platforms.create(50, height / 2, 'platform').setDisplaySize(150, 20).setVisible(true).refreshBody();
        this.platforms.create(width - 50, height / 2, 'platform').setDisplaySize(150, 20).setVisible(true).refreshBody();
    
        this.physics.add.collider(this.player, this.platforms);
    
        // Groups
        this.projectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.trumpetEnemies = this.physics.add.group();
        this.beignetProjectiles = this.physics.add.group();
        this.healthPacks = this.physics.add.group();
    
        // Collisions
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.trumpetEnemies, this.platforms);
        this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileHit, null, this);
        this.physics.add.collider(this.projectiles, this.trumpetEnemies, this.handleProjectileHit, null, this);
        this.physics.add.collider(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.collider(this.player, this.trumpetEnemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.beignetProjectiles, this.handleBeignetHit, null, this);
        this.physics.add.collider(this.projectiles, this.beignetProjectiles, this.handleProjectileCollision, null, this);
        this.physics.add.overlap(this.player, this.healthPacks, this.collectHealthPack, null, this);
    
        // Player Health
        this.playerHealth = 10;
        this.maxHealth = 10;
        this.totalEnemiesDefeated = 0;
        this.updateHealthUI();
        this.updateEnemyCountUI();
    
        // Enemy Spawns
        this.enemySpawnTimer = this.time.addEvent({ delay: 2000, callback: this.spawnMardiGrasZombie, callbackScope: this, loop: true });
        this.trumpetSpawnTimer = this.time.addEvent({ delay: 3000, callback: this.spawnTrumpetSkeleton, callbackScope: this, loop: true });
        this.beignetMinionSpawnTimer = this.time.addEvent({ delay: 4000, callback: this.spawnBeignetMinion, callbackScope: this, loop: true });
    
        // ✅ Fix: Properly separate mobile and desktop controls
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
        if (isMobile) {
            console.log("📱 Mobile detected. Using mobileControls.js for controls.");
            setupMobileControls(this, this.player);
        } else {
            console.log("💻 Desktop detected. Using keyboard controls.");
            
            // ✅ Ensure spacebar is only triggered once
            this.input.keyboard.on('keydown-SPACE', () => {
                this.fireProjectile();
            });
        }
    
        addFullscreenButton(this);
    
        console.log("Level 4 setup complete.");
    }
        
    update() {
        if (!this.player || !this.cursors) return;
    
        // Reset player movement
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
    
        // ✅ Removed duplicate JustDown check to prevent double firing
    }
      
    spawnHealthPack() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50); // Random X position
        const healthPack = this.healthPacks.create(x, 0, 'healthPack'); // Spawn at the top of the screen
        healthPack.setCollideWorldBounds(true); // Enable collision with world bounds
        healthPack.setBounce(0.5); // Add bounce for realism
        healthPack.body.setAllowGravity(true); // Enable gravity
    }
    
    collectHealthPack(player, healthPack) {
        healthPack.destroy();
        this.playerHealth = Math.min(this.playerHealth + 5, this.maxHealth); // Restore 5 health points
        this.updateHealthUI();
        console.log("Health Pack Collected! Health:", this.playerHealth);
    }

    zombieAI(zombie) {
        if (!zombie || !zombie.body || !this.player || !this.player.body) return;

        const playerX = this.player.x;

        if (zombie.x < playerX - 10) {
            zombie.setVelocityX(100);
            zombie.setFlipX(false);
        } else if (zombie.x > playerX + 10) {
            zombie.setVelocityX(-100);
            zombie.setFlipX(true);
        } else {
            zombie.setVelocityX(0);
        }

        if (
            Phaser.Math.Between(0, 100) < 20 &&
            zombie.body.touching.down &&
            Math.abs(zombie.x - playerX) < 200
        ) {
            zombie.setVelocityY(-300);
        }
    }

    spawnMardiGrasZombie() {
        const zombie = this.enemies.create(Phaser.Math.Between(50, 750), 0, 'mardiGrasZombie');
        zombie.setCollideWorldBounds(true).setBounce(0.2);

        this.time.addEvent({
            delay: 500,
            callback: () => {
                if (zombie && zombie.active) {
                    this.zombieAI(zombie);
                }
            },
            loop: true,
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
    }

    spawnBeignetMinion() {
        // Check the number of active Beignet Minions in the enemies group
        const activeBeignetMinions = this.enemies.getChildren().filter(enemy => enemy.texture.key === 'beignetMinion' && enemy.active);
    
        if (activeBeignetMinions.length >= 2) return; // Limit to 2 active minions
    
        const { width, height } = this.scale;
        const side = Math.random() < 0.5 ? 0 : width; // Randomly spawn on the left or right side
        const minion = this.enemies.create(side, this.ground.y - 10, 'beignetMinion'); // Spawn at ground level
    
        minion.setCollideWorldBounds(true); // Enable collision with world bounds
        minion.body.setAllowGravity(false); // Disable gravity for the minion
        minion.setVelocityX(side === 0 ? 100 : -100); // Move left or right based on spawn side
    
        this.physics.add.collider(minion, this.platforms); // Ensure collision with the ground
    
        // Dynamic movement AI
        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                if (minion && minion.active) {
                    this.zombieAI(minion); // Reuse zombieAI logic for movement
                }
            },
        });
    
        // Set a timer to make the minion shoot projectiles
        this.time.addEvent({
            delay: 2000, // Fire projectiles every 2 seconds
            loop: true,
            callback: () => {
                if (minion.active) this.shootBeignet(minion);
            },
        });
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
        console.log("🎯 Player fired a projectile at:", this.player.x, this.player.y);

    }

    shootBeignet(minion) {
        const projectile = this.beignetProjectiles.create(minion.x, minion.y, 'beignetProjectile');
        if (projectile) {
            projectile.body.setAllowGravity(false);
            const angle = Phaser.Math.Angle.Between(minion.x, minion.y, this.player.x, this.player.y);
            projectile.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            
            // Play sound effect when firing
            if (this.beignetProjectileFireSFX) {
                this.beignetProjectileFireSFX.play();
            }
        }
    }    

    handleBeignetHit(player, projectile) {
        projectile.destroy();
        this.playerHealth -= 1;
        this.updateHealthUI();
        this.playerHitSFX.play();
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    handleProjectileCollision(playerProjectile, beignetProjectile) {
        playerProjectile.destroy();
        beignetProjectile.destroy();
        console.log("Player projectile and Beignet Minion projectile destroyed!");
    }

    handleProjectileHit(projectile, enemy) {
        projectile.destroy();
        enemy.destroy();
        this.totalEnemiesDefeated++;
        this.updateEnemyCountUI();
    
        if (enemy.texture.key === 'beignetMinion' && this.beignetMinionHitSFX) {
            this.beignetMinionHitSFX.play();
        } else if (enemy.texture.key === 'mardiGrasZombie' && this.mardiGrasZombieHitSFX) {
            this.mardiGrasZombieHitSFX.play();
        } else if (enemy.texture.key === 'trumpetSkeleton' && this.trumpetSkeletonSFX) {
            this.trumpetSkeletonSFX.play();
        } else {
            console.warn("Sound effect not found for enemy:", enemy.texture.key);
        }

        if (this.totalEnemiesDefeated % 12 === 0) {
            console.log("Spawning health pack!");
            this.spawnHealthPack();
        }
    
        // Check if all enemies are defeated
        if (this.totalEnemiesDefeated >= 45) {
            console.log("All enemies defeated. Level complete!");
            this.levelComplete();
        }
    }    
    
    handleEnemyCollision(player, enemy) {
        enemy.destroy();
        this.playerHealth -= 1;
        this.updateHealthUI();
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    levelComplete() {
        console.log("Level Complete!");
    
        // 🔥 Meta Pixel custom event for Level 4 completion
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'LevelComplete', { level: '4' });
        }
    
        this.cleanUpLevel(); // Stop all enemy spawns
    
        // Show level complete UI
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'levelComplete').setOrigin(0.5);
    
        // Transition to Level 5
        this.handleLevelTransition(() => this.scene.start('Level5'));
    }
    

    gameOver() {
        console.log("Game Over!");
        this.cleanUpLevel(); // Stop all timers and clear enemies
    
        // Show game over UI
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'gameOver').setOrigin(0.5);
    
        // Restart Level 4
        this.handleLevelTransition(() => this.scene.restart());
    }
    
    cleanUpLevel() {
        console.log("Cleaning up Level 4...");
    
        // Stop music
        if (this.levelMusic) {
            this.levelMusic.stop();
            this.levelMusic.destroy();
        }
    
        // Stop all enemy and projectile spawn timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.remove();
            this.enemySpawnTimer = null;
        }
        if (this.trumpetSpawnTimer) {
            this.trumpetSpawnTimer.remove();
            this.trumpetSpawnTimer = null;
        }
        if (this.beignetMinionSpawnTimer) {
            this.beignetMinionSpawnTimer.remove();
            this.beignetMinionSpawnTimer = null;
        }
    
        // Remove all game objects
        this.enemies.clear(true, true);
        this.trumpetEnemies.clear(true, true);
        this.beignetProjectiles.clear(true, true);
        this.projectiles.clear(true, true);
    
        console.log("Level cleaned up successfully.");
    }
       

    handleLevelTransition(callback) {
        this.input.keyboard.once('keydown-SPACE', callback);
        this.input.once('pointerdown', callback);
    }
    
}
