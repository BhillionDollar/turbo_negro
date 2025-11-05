import { addFullscreenButton } from '/utils/fullScreenUtils.js';
import { setupMobileControls } from '/utils/mobileControls.js';

export default class Level3 extends Phaser.Scene {
    constructor() {
        super({ key: 'Level3' });
    }

    updateHealthUI() {
        const healthPercentage = (this.playerHealth / this.maxHealth) * 100;
        document.getElementById('health-bar-inner').style.width = `${healthPercentage}%`;
    }

    updateEnemyCountUI() {
        document.getElementById('enemy-count').innerText = `Enemies Left: ${40 - this.totalEnemiesDefeated}`;
    }

    updateHealthBar() {
        if (!this.healthBar) return;

        this.healthBar.clear();

        const barWidth = 200;
        const barHeight = 20;
        const healthPercentage = Phaser.Math.Clamp(this.playerHealth / this.maxHealth, 0, 1);

        const barColor = healthPercentage > 0.5 ? 0x00ff00 : healthPercentage > 0.25 ? 0xffff00 : 0xff0000;

        this.healthBar.fillStyle(0x808080);
        this.healthBar.fillRect(20, 20, barWidth, barHeight);

        this.healthBar.fillStyle(barColor);
        this.healthBar.fillRect(20, 20, barWidth * healthPercentage, barHeight);
    }
    
    preload() {
        console.log("Preloading assets for Level 3...");
        this.load.image('level3Background', 'assets/Levels/BackGrounds/Level3.png');
        this.load.image('ledgeLeft', 'assets/Levels/Platforms/LedgeLeft.png');
        this.load.image('ledgeRight', 'assets/Levels/Platforms/LedgeRight.png');
        this.load.image('platform', 'assets/Levels/Platforms/platform.png');
        this.load.image('turboNegroWalking', 'assets/Characters/Character1/TurboNegroWalking.png');
        this.load.image('turboNegroStanding1', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding1.png');
        this.load.image('turboNegroStanding2', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding2.png');
        this.load.image('turboNegroStanding3', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding3.png');
        this.load.image('turboNegroStanding4', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding4.png');
        this.load.image('projectileCD', 'assets/Characters/Projectiles/CD/CDresize.png');
        this.load.image('MardiGrasBlimp', 'assets/Characters/Enemies/MardiGrasBlimp.png');
        this.load.image('Beads', 'assets/Characters/Projectiles/Beads/Beads.png');
        this.load.image('skeleton', 'assets/Characters/Enemies/MardiGrasZombie.png');
        this.load.image('trumpetSkeleton', 'assets/Characters/Enemies/TrumpetSkeleton.png');
        this.load.audio('level3Music', 'assets/Audio/LevelMusic/mp3/BhillionDollarAutoBots.mp3');

        // Load sound effects like Level 1
        this.load.audio('playerHit', 'assets/Audio/SoundFX/mp3/playerHit.mp3');
        this.load.audio('playerProjectileFire', 'assets/Audio/SoundFX/mp3/playerprojectilefire.mp3');
        this.load.audio('mardiGrasZombieHit', 'assets/Audio/SoundFX/mp3/MardiGrasZombieHit.mp3');
        this.load.audio('trumpetSkeletonSound', 'assets/Audio/SoundFX/mp3/trumpetSkeletonHit.mp3');
    }

    create() {
        const { width, height } = this.scale;
        console.log("Creating Level 3...");
    
        // Background setup (adjusted origin and positioning for full coverage)
        this.add.image(0, 0, 'level3Background')
            .setOrigin(0, 0)
            .setDisplaySize(1600, height);
    
        // Music setup
        this.levelMusic = this.sound.add('level3Music', { loop: true, volume: 0.2 });
        this.levelMusic.play();

        // Sound Effects
        this.playerHitSFX = this.sound.add('playerHit', { volume: 0.6 });
        this.playerProjectileFireSFX = this.sound.add('playerProjectileFire', { volume: 0.6 });
        this.mardiGrasZombieHitSFX = this.sound.add('mardiGrasZombieHit', { volume: 0.6 });
        this.trumpetSkeletonSFX = this.sound.add('trumpetSkeletonSound', { volume: 0.4 });
    
        // Camera and world bounds
        this.cameras.main.setBounds(0, 0, 1600, height);
        this.physics.world.setBounds(0, 0, 1600, height);
    
        // Platforms setup
        this.platforms = this.physics.add.staticGroup();
    
        // Ground platform
        this.platforms.create(800, height - 12, null)
            .setDisplaySize(1600, 20)
            .setVisible(false)
            .refreshBody();
    
        // Left ledge
        this.platforms.create(100, height - 230, null)
            .setDisplaySize(200, 10)
            .setVisible(false)
            .refreshBody();
        this.add.image(100, height - 180, 'ledgeLeft').setOrigin(0.5, 1).setScale(0.8).setDepth(2);
    
        // Right ledge
        this.platforms.create(1500, height - 230, null)
            .setDisplaySize(200, 10)
            .setVisible(false)
            .refreshBody();
        this.add.image(1500, height - 180, 'ledgeRight').setOrigin(0.5, 1).setScale(0.8).setDepth(2);
    
        // Middle platform
        this.platforms.create(800, height - 165, null)
            .setDisplaySize(300, 10)
            .setVisible(false)
            .refreshBody();
        this.add.image(800, height - 148, 'platform').setOrigin(0.5, 1).setDepth(2);
    
        // Player setup
        this.player = this.physics.add.sprite(200, height - 100, 'turboNegroStanding1');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.player.setDepth(1);
    
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
    
        // Object groups
        this.projectiles = this.physics.add.group({ defaultKey: 'projectileCD', collideWorldBounds: false, runChildUpdate: true });
        this.enemyProjectiles = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.trumpetEnemies = this.physics.add.group();
        this.healthPacks = this.physics.add.group();
    
        // UI and stats setup
        this.playerHealth = 10;
        this.maxHealth = 10;
        this.updateHealthUI();
    
        this.totalEnemiesDefeated = 0;
        this.updateEnemyCountUI();
    
        // Camera follows player
        this.cameras.main.startFollow(this.player);
    
        // Create and manage Blimp
        this.createBlimpPath();
    
        // Physics and collision
        this.physics.add.overlap(this.projectiles, this.mardiGrasBlimp, this.destroyBlimp, null, this);
        this.physics.add.overlap(this.enemyProjectiles, this.player, this.handleBeadCollision, null, this);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.trumpetEnemies, this.platforms);
        this.physics.add.collider(this.player, this.trumpetEnemies, this.handleTrumpetSkeletonCollision, null, this);
        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, null, this);
        this.physics.add.collider(this.projectiles, this.trumpetEnemies, this.handleProjectileEnemyCollision, null, this);
        this.physics.add.collider(this.healthPacks, this.platforms);
        this.physics.add.overlap(this.player, this.healthPacks, this.handlePlayerHealthPackCollision, null, this);
    
        // Enemy spawn timers
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
    
        // Setup mobile controls
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            console.log("Mobile device detected. Initializing controls...");
            setupMobileControls(this, this.player);
        } else {
            console.log("Desktop detected. Skipping mobile controls.");
        }        
    
        // Tap anywhere to attack (Mobile or Desktop)
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
    
        // Bind attack button to fireProjectile
        const attackButton = document.getElementById('attack-button');
        if (attackButton) {
            attackButton.addEventListener('click', () => {
                this.fireProjectile();
            });
        } else {
            console.warn("Attack button not found!");
        }

        addFullscreenButton(this);

    
        console.log("Level 3 setup complete.");
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
     

    fireBeads() {
        if (this.mardiGrasBlimp.active) {
            const bead = this.enemyProjectiles.create(this.mardiGrasBlimp.x, this.mardiGrasBlimp.y, 'Beads');
            bead.body.setAllowGravity(false);

            const angle = Phaser.Math.Angle.Between(
                this.mardiGrasBlimp.x,
                this.mardiGrasBlimp.y,
                this.player.x,
                this.player.y
            );
            bead.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        }
    }
    
    spawnHealthPack() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        const healthPack = this.healthPacks.create(x, 50, 'healthPack');
        healthPack.setBounce(0.5);
        healthPack.setCollideWorldBounds(true);
        console.log("Health pack spawned at:", x);
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
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);

        const zombie = this.enemies.create(x, 0, 'skeleton');
        zombie.setCollideWorldBounds(true);
        zombie.setBounce(0.2);
        zombie.setVelocityX(Phaser.Math.Between(-100, 100));

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
        const x = Math.random() < 0.5 ? 0 : width; // Spawn on the left or right edge
        const y = height - 150; // Near the ground level
    
        const trumpetSkeleton = this.trumpetEnemies.create(x, y, 'trumpetSkeleton');
        trumpetSkeleton.setCollideWorldBounds(true);
        trumpetSkeleton.body.allowGravity = true;
    
        // Add jumping behavior
        trumpetSkeleton.isLanded = true;
    
        this.time.addEvent({
            delay: 1500, // Jump every 1.5 seconds if landed
            loop: true,
            callback: () => {
                if (trumpetSkeleton.active && trumpetSkeleton.body && trumpetSkeleton.isLanded) {
                    trumpetSkeleton.setVelocityY(-300); // Jump height
                    const direction = this.player.x > trumpetSkeleton.x ? 150 : -150; // Move toward player
                    trumpetSkeleton.setVelocityX(direction); // Adjust velocity
                    trumpetSkeleton.isLanded = false; // Mark as jumping
                }
            },
        });
    
        // Detect landing on platforms
        this.physics.add.collider(trumpetSkeleton, this.platforms, () => {
            trumpetSkeleton.setVelocityX(0);
            trumpetSkeleton.isLanded = true;
        });
    
        // Attack player when near
        this.time.addEvent({
            delay: 1000, // Attack every 1 second
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

    trumpetSkeletonAttack(trumpetSkeleton) {
        console.log('Trumpet Skeleton attacks!');
        this.playerHealth -= 2; // Inflict 2 points of damage
        this.updateHealthBar();
    
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    createBlimpPath() {
        const path = [
            { x: 100, y: 50 },
            { x: 1400, y: 100 },
            { x: 1200, y: 500 },
            { x: 200, y: 400 },
        ];
    
        let currentPoint = 0;
    
        const moveBlimp = () => {
            if (!this.mardiGrasBlimp || !this.mardiGrasBlimp.active) {
                return; // Exit if the blimp no longer exists
            }
    
            const nextPoint = path[currentPoint];
            this.tweens.add({
                targets: this.mardiGrasBlimp,
                x: nextPoint.x,
                y: nextPoint.y,
                duration: 3000,
                ease: 'Linear',
                onComplete: () => {
                    currentPoint = (currentPoint + 1) % path.length;
                    moveBlimp(); // Continue moving the blimp
                },
            });
        };
    
        if (this.mardiGrasBlimp) {
            this.mardiGrasBlimp.destroy();
        }
    
        this.mardiGrasBlimp = this.physics.add.sprite(path[0].x, path[0].y, 'MardiGrasBlimp');
        this.mardiGrasBlimp.setDepth(3);
        this.mardiGrasBlimp.body.setAllowGravity(false);
        this.mardiGrasBlimp.body.setImmovable(true);
    
        moveBlimp();
    
        this.physics.add.overlap(
            this.projectiles,
            this.mardiGrasBlimp,
            this.destroyBlimp,
            null,
            this
        );
    
        if (this.fireBeadsTimer) {
            this.fireBeadsTimer.remove();
        }
    
        this.fireBeadsTimer = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: this.fireBeads,
            callbackScope: this,
        });
    }

    destroyBlimp(projectile, blimp) {
        if (projectile) {
            projectile.destroy();
            console.log("Projectile destroyed!");
        }

        if (blimp) {
            blimp.destroy();
            console.log("Blimp destroyed!");

            if (this.fireBeadsTimer) {
                this.fireBeadsTimer.remove();
                this.fireBeadsTimer = null;
            }

            this.time.delayedCall(5000, () => {
                this.createBlimpPath();
            });
        }
    }

    handleBeadCollision(player, bead) {
        if (bead) {
            bead.destroy();
            this.playerHealth -= 2;
    
            // Play player hit sound
            this.playerHitSFX.play();
    
            console.log("Player hit by bead! Health -2");
            this.updateHealthUI();
    
            if (this.playerHealth <= 0) {
                this.gameOver();
            }
        }
    }    

    handlePlayerEnemyCollision(player, enemy) {
        if (enemy && enemy.active) {
            enemy.destroy(); // Destroy enemy
            this.playerHealth -= 1; // Decrease player health
            console.log("Player hit by Mardi Gras Zombie! Health -1");
    
            this.updateHealthUI(); // Update health bar UI
            if (this.playerHealth <= 0) {
                this.gameOver(); // End the game if health reaches 0
            }
        }
    }

    handleProjectileEnemyCollision(projectile, enemy) {
        if (projectile && projectile.active) {
            projectile.destroy();
            console.log("Projectile destroyed!");
        }
    
        if (enemy && enemy.active) {
            console.log(`Enemy destroyed: ${enemy.texture.key}`);
            enemy.destroy();
    
            this.totalEnemiesDefeated++;
            console.log(`Total Enemies Defeated: ${this.totalEnemiesDefeated}`);
    
            this.updateEnemyCountUI();
    
            // Play sound based on enemy type
            if (enemy.texture.key === 'skeleton') {
                this.mardiGrasZombieHitSFX.play();
            } else if (enemy.texture.key === 'trumpetSkeleton') {
                this.trumpetSkeletonSFX.play();
            }
    
            if (this.totalEnemiesDefeated % 12 === 0) {
                this.spawnHealthPack();
                console.log("Health pack spawned!");
            }
    
            if (this.totalEnemiesDefeated >= 40) {
                console.log("Level Complete Triggered!");
                this.levelComplete();
            }
        }
    }    

    handlePlayerHealthPackCollision(player, healthPack) {
        healthPack.destroy();
        this.playerHealth = Math.min(this.playerHealth + 5, this.maxHealth);
        this.updateHealthUI();
        console.log("Health pack collected! Health +5");
    } 
    
    handleTrumpetSkeletonCollision(player, trumpetSkeleton) {
        if (trumpetSkeleton && trumpetSkeleton.active) {
            trumpetSkeleton.destroy(); // Destroy enemy
            this.playerHealth -= 1; // Trumpet Skeleton deals more damage
            console.log("Player hit by Trumpet Skeleton! Health -2");
    
            this.updateHealthUI(); // Update health bar UI
            if (this.playerHealth <= 0) {
                this.gameOver(); // End the game if health reaches 0
            }
        }
    
    }

    gameOver() {
        console.log("Game Over!");
    
        // Stop blimp movement and destruction
        if (this.mardiGrasBlimp) {
            this.tweens.killTweensOf(this.mardiGrasBlimp); // Stop movement
            this.mardiGrasBlimp.destroy(); // Destroy blimp
            this.mardiGrasBlimp = null; // Ensure reference is removed
        }
    
        if (this.fireBeadsTimer) {
            this.fireBeadsTimer.remove();
            this.fireBeadsTimer = null;
        }
    
        // Ensure blimp does not respawn after game over
        this.time.removeAllEvents();
    
        // Stop all sounds and timers
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
        console.log("Level Complete! Moving to Level 4");
    
        // 🔥 Meta Pixel custom event for Level 3 completion
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'LevelComplete', { level: '3' });
        }
    
        // Stop blimp movement and destruction
        if (this.mardiGrasBlimp) {
            this.tweens.killTweensOf(this.mardiGrasBlimp);
            this.mardiGrasBlimp.destroy();
            this.mardiGrasBlimp = null;
        }
    
        if (this.fireBeadsTimer) {
            this.fireBeadsTimer.remove();
            this.fireBeadsTimer = null;
        }
    
        // Ensure no enemies spawn after level completion
        this.time.removeAllEvents();
    
        // Stop all sounds and timers
        this.cleanUpLevel();
    
        // Display Level Complete screen
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'levelComplete').setOrigin(0.5);
    
        // Proceed to the next level
        const proceedToNextLevel = () => {
            this.scene.start('Level4'); // Transition to Level 4
        };
    
        this.handleLevelTransition(proceedToNextLevel);
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