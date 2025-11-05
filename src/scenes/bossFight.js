import { addFullscreenButton } from '/utils/fullScreenUtils.js';
import { setupMobileControls } from '/utils/mobileControls.js';

export default class BossFight extends Phaser.Scene {
    constructor() {
        super({ key: 'BossFight' });
    }

    preload() {
        console.log("Preloading assets for Boss Fight...");
    
        // Background & Platforms
        this.load.image('finalFightBackground', 'assets/Levels/BackGrounds/finalFight.webp');
        this.load.image('platform', 'assets/Levels/Platforms/platform.png');
    
        // Player Animations
        this.load.image('turboNegroStanding1', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding1.png');
        this.load.image('turboNegroStanding2', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding2.png');
        this.load.image('turboNegroStanding3', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding3.png');
        this.load.image('turboNegroStanding4', 'assets/Characters/Character1/TurboNegroStanding/TurboNegroStanding4.png');
        this.load.image('turboNegroWalking', 'assets/Characters/Character1/TurboNegroWalking/TurboNegroWalking.png');
        this.load.image('turboNegroJump', 'assets/Characters/Character1/TurboNegroJump.png');
    
        // Enemies & Projectiles
        this.load.image('beignetBoss', 'assets/Characters/Enemies/Beignet_Boss.png');
        this.load.image('mardiGrasZombie', 'assets/Characters/Enemies/MardiGrasZombie.png');
        this.load.image('beignetMinion', 'assets/Characters/Enemies/Beignet_Minion.png');
        this.load.image('beignetMonster', 'assets/Characters/Enemies/Beignet_Monster.png');
        this.load.image('beignetProjectile', 'assets/Characters/Projectiles/Beignet/Beignet2.png');
        this.load.image('projectileCD', 'assets/Characters/Projectiles/CD/CDresize.png');
    
        // Items
        this.load.image('healthPack', 'assets/Items/HealthPack.png');
        this.load.image('fallingHazard', 'assets/Levels/Platforms/fallingHazard.png');
    
        // Effects
        this.load.image('forceField', 'assets/Effects/forceField.png');
    
        // UI
        this.load.image('gameOver', 'assets/UI/gameOver.png');
    
        // Music & Sound Effects
        this.load.audio('bossMusic', 'assets/Audio/LevelMusic/mp3/SmoothDaggers.mp3');
        this.load.audio('playerHit', 'assets/Audio/SoundFX/mp3/playerHit.mp3');
        this.load.audio('playerProjectileFire', 'assets/Audio/SoundFX/mp3/playerprojectilefire.mp3');
        this.load.audio('bossHit', 'assets/Audio/SoundFX/mp3/bossHit.mp3');
        this.load.audio('mardiGrasZombieHit', 'assets/Audio/SoundFX/mp3/MardiGrasZombieHit.mp3');
        this.load.audio('beignetMinionHit', 'assets/Audio/SoundFX/mp3/beignetminionHit.mp3');
        this.load.audio('beignetProjectileFire', 'assets/Audio/SoundFX/mp3/beignetprojectilefire.mp3');
        this.load.audio('beignetMonsterHit', 'assets/Audio/SoundFX/mp3/beignetmonsterHit.mp3');
    
        console.log("Boss Fight assets preloaded.");
    }    
    
    create() {
        const { width, height } = this.scale;
    
        // **Background Setup**
        this.background = this.add.image(1536, height / 2, 'finalFightBackground')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(3072, height);
    
        // **World & Camera Bounds**
        this.physics.world.setBounds(0, 0, 3072, height);
        this.cameras.main.setBounds(0, 0, 3072, height);
    
        // **Ground Setup**
        this.ground = this.physics.add.staticGroup();
        let groundSprite = this.ground.create(1536, height - 20, null)
            .setDisplaySize(3072, 10)
            .setVisible(false)
            .refreshBody();

        // **Player Animations**
        this.anims.create({
            key: 'idle',
            frames: [
                { key: 'turboNegroStanding1' },
                { key: 'turboNegroStanding2' },
                { key: 'turboNegroStanding3' },
                { key: 'turboNegroStanding4' }
            ],
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'walk',
            frames: [{ key: 'turboNegroWalking' }],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [{ key: 'turboNegroJump' }],
            frameRate: 1,
            repeat: -1
        });
    
        // **Moving Platforms Setup**
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    
        let platform1 = this.createMovingPlatform(800, height - 200, 200, 100, 200);  
        let platform2 = this.createMovingPlatform(1800, height - 300, 200, 150, 250);
        let platform3 = this.createMovingPlatform(2500, height - 250, 200, 120, 300);
    
        // **Player Setup**
        this.player = this.physics.add.sprite(100, height - 150, 'turboNegroStanding1');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(1);
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.movingPlatforms);
    
        this.playerHealth = 10;
        this.maxHealth = 10;
        this.updateHealthUI();
    
        // **Camera Follow**
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    
        // **Boss Fight Music**
        this.bossMusic = this.sound.add('bossMusic', { loop: true, volume: 0.5 });
        this.bossMusic.play();
    
        // **Object Groups**
        this.projectiles = this.physics.add.group({ defaultKey: 'projectileCD', runChildUpdate: true });
        this.bossProjectiles = this.physics.add.group();
        this.minions = this.physics.add.group();
        this.healthPacks = this.physics.add.group();
        this.hazards = this.physics.add.group(); 
    
        // **Boss Setup**
        this.boss = this.physics.add.sprite(2800, height - 150, 'beignetBoss');
        this.boss.setCollideWorldBounds(true);
        this.boss.body.setAllowGravity(false);
        this.boss.health = 30;
        document.getElementById('boss-health-bar-container').style.display = 'block';
        this.physics.add.collider(this.boss, this.ground);
        this.physics.add.collider(this.boss, this.movingPlatforms);
    
        // **Ensure collision between the player and boss projectiles**
        this.physics.add.overlap(this.player, this.bossProjectiles, this.handleBeignetProjectileCollision, null, this);
    
        // **Boss Walking Animation**
        this.tweens.add({
            targets: this.boss,
            x: this.boss.x - 300,
            duration: 3000,
            ease: 'Linear',
            yoyo: true,
            repeat: -1,
            onStart: () => {
                this.boss.setFlipX(true);
            },
            onUpdate: (tween, target, time, delta) => {
                const progress = tween.progress;
                this.boss.setFlipX(progress > 0.5 ? false : true);
            }
        });
    
        // **Ensure force field is correctly positioned from the start**
        this.forceField = this.add.image(this.boss.x, this.boss.y, 'forceField')
            .setVisible(false)
            .setScale(1.5)
            .setDepth(2)
            .setAlpha(0.5);
    
        // **Input Controls**
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
         // ✅ Fix: Declare isMobile before using it
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Setup mobile controls only if it's a mobile device
        if (isMobile) {
            console.log("📱 Mobile detected. Using mobileControls.js for shooting.");
            setupMobileControls(this, this.player);
        } else {
            console.log("💻 Desktop detected. Using spacebar for shooting.");
        }
    
        // **Fullscreen Button**
        addFullscreenButton(this);
    
        // **Hazard Spawner**
        this.time.addEvent({
            delay: 5000,
            callback: this.spawnHazard,
            callbackScope: this,
            loop: true
        });
    
        // **Boss Fires Beignet Projectiles**
        this.time.addEvent({
            delay: 2000,
            callback: this.shootProjectiles,
            callbackScope: this,
            loop: true
        });
    
        // **Boss Spawns a Beignet Monster**
        this.bossMinionCount = 0;
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                this.spawnBeignetMonster();
            },
            callbackScope: this,
            loop: true
        });
    
        // **Destroy Beignet Monster when Hit by Player's Projectile**
        this.physics.add.collider(this.projectiles, this.minions, (projectile, minion) => {
            projectile.destroy();
            minion.health -= 1;
            if (minion.health <= 0) {
                this.handleEnemyDeath(minion); // ✅ Centralized enemy death handling
            }
        });
    
        // **Destroy Minions when Hit by Player's Projectile**
        this.physics.add.collider(this.projectiles, this.minions, (projectile, minion) => {
            if (!projectile || !minion) return;

            console.log(`🎯 Projectile hit ${minion.texture.key}`);

            // ✅ Ensure Beignet Minion takes 1 damage and gets destroyed
            if (minion.texture.key === 'beignetMinion') {
                console.log("🍩 Beignet Minion hit! Taking 1 damage.");
                minion.health -= 1;
                projectile.destroy();

                if (minion.health <= 0) {
                    console.log("💥 Beignet Minion destroyed!");
                    this.handleEnemyDeath(minion); // ✅ Centralized enemy death handling
                }
                return;
            }

            // ✅ Normal minion handling
            minion.health -= 1;
            projectile.destroy();

            if (minion.health <= 0) {
                console.log(`💀 ${minion.texture.key} destroyed!`);
                this.handleEnemyDeath(minion);
            }
        });

        // **Ensure player's projectiles can destroy boss's beignet projectiles**
        this.physics.add.collider(this.projectiles, this.bossProjectiles, this.handleProjectileCollision, null, this);

        // **New: Collision Logic from Previous Levels**
        this.physics.add.collider(this.minions, this.minions);

        // ✅ **Prevent Player from Taking Damage on Beignet Minion Collision**
        this.physics.add.overlap(this.player, this.minions, (player, minion) => {
            if (minion.texture.key === 'beignetMinion') {
                console.log("✅ Player collided with Beignet Minion - No damage taken.");
                return; // Ensures no damage is taken
            }
        }, null, this);

        // **🔥 Player Takes Damage from Normal Minions & Beignet Monsters**
        this.physics.add.overlap(this.player, this.minions, (player, enemy) => {
            if (!player.active || !enemy.active) return;

            // ✅ Ignore Beignet Minions (Handled in separate overlap above)
            if (enemy.texture.key === 'beignetMinion') return;

            console.log(`🚨 Player hit by ${enemy.texture.key}`);

            let damage = enemy.texture.key === 'beignetMonster' ? 2 : 1;
            this.playerHealth -= damage;
            console.log(`🩸 Player health reduced to ${this.playerHealth}`);

            this.updateHealthUI();

            if (this.playerHealth <= 0) {
                console.log("💀 Player killed by enemy!");
                this.gameOver();
                return;
            }

            // **Destroy Beignet Monster Immediately**
            if (enemy.texture.key === 'beignetMonster') {
                console.log("🔥 Beignet Monster destroyed after collision!");
                enemy.destroy();
            }

            let knockback = enemy.x < player.x ? 200 : -200;
            player.setVelocityX(knockback);

            if (enemy.texture.key === 'mardiGrasZombie') {
                enemy.destroy();
            }
        }, null, this);

    
        // **Zombie AI - Move toward the player**
        this.minions.children.iterate((zombie) => {
            if (zombie.active) {
                const speed = 100;
                const direction = Math.sign(this.player.x - zombie.x);
                zombie.setVelocityX(direction * speed);
    
                // Random jump mechanic
                if (Phaser.Math.Between(1, 100) > 95 && zombie.body.touching.down) {
                    zombie.setVelocityY(-250);
                }
    
                // Ensure zombie flips direction
                zombie.setFlipX(direction < 0);
            }
        });

        // Beignet Minion Spawning Timer (Fix)
        this.time.addEvent({
            delay: 4000, // Spawns every 4 seconds
            callback: this.spawnBeignetMinion,
            callbackScope: this,
            loop: true // Ensures continuous spawning
        });

        this.playerHitSFX = this.sound.add('playerHit', { volume: 0.6 });
        this.playerProjectileFireSFX = this.sound.add('playerProjectileFire', { volume: 0.6 });
        this.bossHitSFX = this.sound.add('bossHit', { volume: 0.8 });
        this.mardiGrasZombieHitSFX = this.sound.add('mardiGrasZombieHit', { volume: 0.6 });
        this.beignetMinionHitSFX = this.sound.add('beignetMinionHit', { volume: 0.8 });
        this.beignetMonsterHitSFX = this.sound.add('beignetMonsterHit', { volume: 0.8 });
        this.beignetProjectileFireSFX = this.sound.add('beignetProjectileFire', { volume: 0.6 });

        console.log("🔊 Sound Check:", this.mardiGrasZombieHitSFX);

        // ✅ Initialize the enemy count correctly
        this.updateEnemyCountUI();
    }           
    
    createMovingPlatform(x, y, width, speed, distance) {
        let platform = this.movingPlatforms.create(x, y, 'platform'); // Use the loaded image
        platform.setDisplaySize(width, 20).setOrigin(0.5, 0.5).refreshBody(); // Adjust display size
    
        this.tweens.add({
            targets: platform,
            x: platform.x + distance,
            duration: speed * 10,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });
    
        return platform;
    }

    update() {
        if (!this.player || !this.player.body) return;
    
        this.player.setVelocityX(0);
    
        // Handle left and right movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160).setFlipX(true);
            if (this.player.body.touching.down && this.anims.exists('walk')) {
                this.player.play('walk', true);
            }
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160).setFlipX(false);
            if (this.player.body.touching.down && this.anims.exists('walk')) {
                this.player.play('walk', true);
            }
        } else if (this.player.body.touching.down) {
            if (this.anims.exists('idle')) {
                this.player.play('idle', true);
            }
        }
    
        // Handle jump logic
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-500);
            if (this.anims.exists('jump')) {
                this.player.play('jump', true);
            }
        } else if (!this.player.body.touching.down) {
            if (this.anims.exists('jump')) {
                this.player.play('jump', true);
            }
        }
    
        // ✅ Fix: Fire projectile only when the key is first pressed, not held down
        if (this.fireKey.isDown && !this.spaceKeyJustPressed) {
            this.spaceKeyJustPressed = true;
            this.fireProjectile();
        } else if (this.fireKey.isUp) {
            this.spaceKeyJustPressed = false;
        }
    
        // Ensure force field exists before updating position
        if (this.forceFieldActive && this.forceField) {
            this.forceField.setPosition(this.boss.x, this.boss.y);
        }
    
        // ✅ Fix: Prevent errors when updating minions
        if (this.minions) {
            this.minions.children.iterate((zombie) => {
                if (!zombie || !zombie.body) return; // Ensure zombie exists before applying physics
    
                if (zombie.active) {
                    const speed = 100;
                    const direction = this.player ? Math.sign(this.player.x - zombie.x) : 1;
                    zombie.setVelocityX(direction * speed);
    
                    if (Phaser.Math.Between(1, 100) > 95 && zombie.body.touching.down) {
                        zombie.setVelocityY(-250);
                    }
    
                    zombie.setFlipX(direction < 0);
                }
            });
        } else {
            console.warn("⚠️ Minions group is undefined! Possible spawning issue.");
        }
    
        // ✅ Fix: Ensure Parallax Background Scrolls Properly
        if (this.background) {
            this.background.tilePositionX = this.cameras.main.scrollX * 0.5;
        } else {
            console.warn("⚠️ Background not found! Ensure it is loaded properly.");
        }
    }            
        
    //Player functions
    fireProjectile() {
        if (!this.player || !this.projectiles) return;
    
        console.log("🔥 fireProjectile() called!");
    
        let projectile = this.projectiles.create(this.player.x, this.player.y, 'projectileCD');
        if (projectile) {
            console.log("🎯 Projectile spawned!");
    
            projectile.body.setAllowGravity(false);
            projectile.setVelocityX(this.player.flipX ? -500 : 500);
            this.playerProjectileFireSFX.play(); // ✅ Ensure sound plays when shooting
    
            this.physics.add.overlap(projectile, this.boss, () => {
                console.log("💥 Boss hit!");
                this.takeBossDamage(1);
                projectile.destroy();
            });
        }
    }    
    
    checkPlayerHealth() {
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    //Hazard functions
    spawnHazard() {
        let x = this.player.x; // Spawn directly above the player
        let y = 0; // Start from the top of the screen
    
        let hazard = this.hazards.create(x, y, 'fallingHazard');
    
        if (hazard) {
            hazard.setActive(true).setVisible(true);
            hazard.body.setAllowGravity(true);
            hazard.body.setImmovable(false); // Ensure it's affected by physics
    
            // Debugging: Check if hazard has a body
            console.log(`🛠️ Hazard spawned at (${hazard.x}, ${hazard.y})`);
    
            // Set falling speed
            hazard.setVelocityY(200);
    
            hazard.setScale(1); // Adjust size if needed
    
            // **Destroy hazard when it collides with the ground**
            this.physics.add.collider(hazard, this.ground, () => {
                console.log("💥 Hazard hit the ground and was destroyed.");
                hazard.destroy();
            });
    
            // **Destroy hazard when it collides with the player**
            this.physics.add.collider(this.player, hazard, (player, hazard) => {
                console.log("🔥 Hazard collided with player!"); // Debugging
                hazard.destroy();
                this.handleHazardCollision(player);
            });
    
            // **Destroy hazard when it collides with a platform**
            this.physics.add.collider(hazard, this.movingPlatforms, () => {
                console.log("🛑 Hazard hit a platform and was destroyed.");
                hazard.destroy();
            });
        }
    }    

    handleHazardCollision(player) {
        console.log("⚠️ Hazard hit player! Reducing health...");
        
        this.playerHealth -= 1; // Reduce player health
        this.updateHealthUI(); // Update the UI
    
        if (this.playerHealth <= 0) {
            console.log("❌ Player health depleted! Game over.");
            this.gameOver();
        }

        this.playerHitSFX.play();
    }

    handleProjectileCollision(playerProjectile, bossProjectile) {
        playerProjectile.destroy();
        bossProjectile.destroy();
    }

    handleBeignetProjectileCollision(player, projectile) {
        if (!player || !projectile) return;
    
        console.log("🔥 Player hit by Beignet Projectile!");
        projectile.destroy(); // Remove projectile
    
        this.playerHealth -= 1;
        this.updateHealthUI();
        
        this.playerHitSFX.play(); // ✅ Ensure sound plays on hit
    
        if (this.playerHealth <= 0) {
            console.log("💀 Player died from Beignet Projectile!");
            this.gameOver();
        }
    }    
    
    //Boss functions
    updateBossHealthUI() {
        const healthPercentage = (this.boss.health / 30) * 100;  // Assuming max health is 20
        const healthBar = document.getElementById('boss-health-bar-inner');
        
        if (healthBar) {
            healthBar.style.width = `${healthPercentage}%`;  // Set the width of the health bar
        }
    }

    takeBossDamage(amount) {
        if (!this.boss || this.boss.health <= 0) return;
    
        if (this.forceFieldActive) {
            this.forceFieldHealth -= amount;
            console.log(`🛡️ Force Field Hit! Remaining Durability: ${this.forceFieldHealth}`);
    
            if (this.forceFieldHealth <= 0) {
                console.log("💥 Force Field Destroyed!");
                this.forceField.setVisible(false);
                this.forceFieldActive = false;
                this.repositionBoss();
            }
            return;
        }
    
        // ✅ Play boss hit sound
        this.bossHitSFX.play();  
    
        this.boss.health -= amount;
        this.bossHitCount = (this.bossHitCount || 0) + 1; 
    
        console.log(`🔥 Boss hit! Health: ${this.boss.health}, Hit Count: ${this.bossHitCount}`);
    
        if (this.bossHitCount >= 5) {
            console.log("🧟‍♂️ Spawning Minions!");
            this.spawnMardiGrasZombies();
            this.activateForceField();
            this.bossHitCount = 0;
        }
    
        if (this.boss.health <= 0) {
            console.log("💀 Boss Defeated!");
            this.boss.health = 0;
            this.boss.setVisible(false);
            this.checkBossDefeat();
        }
    
        this.updateBossHealthUI();
    }    
    
    activateForceField() {
        this.forceFieldHealth = 5; // Set force field durability
        this.forceFieldActive = true; // Enable force field
    
        this.forceField.setPosition(this.boss.x, this.boss.y); // Align with boss
        this.forceField.setVisible(true);
        this.forceField.setAlpha(0.5); // Ensure opacity remains 50%
    
        console.log("🛡️ Force Field Activated! It will absorb 5 hits.");
    }    
    
    repositionBoss() {
        let currentX = this.boss.x;
        let minX = 500;
        let maxX = 2500;
        let minTeleportDistance = 1000;
        let maxTeleportDistance = 1800;
        let newX;
    
        if (this.bossTween) {
            this.bossTween.stop();
        }
    
        // Stop attacks and minion spawning during teleport
        this.boss.setAlpha(0);
        this.boss.setActive(false);
        this.boss.body.enable = false;
        this.time.removeAllEvents();
    
        // Ensure teleportation stays within bounds
        do {
            let offset = Phaser.Math.Between(minTeleportDistance, maxTeleportDistance);
            newX = (Math.random() > 0.5) ? currentX + offset : currentX - offset;
        } while (newX < minX || newX > maxX);
    
        let groundY = this.scale.height - 150;
    
        this.time.delayedCall(3000, () => { // 3 sec delay
            this.boss.setPosition(newX, groundY);
            this.boss.setAlpha(1);
            this.boss.setActive(true);
            this.boss.body.enable = true;
    
            console.log(`🔮 Boss teleported from ${currentX} to ${newX}`);
    
            // Restart movement tween after teleport
            this.bossTween = this.tweens.add({
                targets: this.boss,
                x: newX - 300,
                duration: 3000,
                ease: 'Linear',
                yoyo: true,
                repeat: -1,
                onStart: () => this.boss.setFlipX(true),
                onUpdate: (tween) => {
                    this.boss.setFlipX(tween.progress > 0.5 ? false : true);
                }
            });
    
            // 🔥 Restart attacks & minion spawning
            this.startBossActions();
        });
    }
    
    startBossActions() {
        // **Restart Boss Shooting**
        this.time.addEvent({
            delay: 3000, // Fire every 3 seconds
            callback: this.shootProjectiles,
            callbackScope: this,
            loop: true
        });
    
        // **Restart Beignet Monster Spawning**
        this.bossMinionCount = 0;
        this.time.addEvent({
            delay: 3000, // Spawn every 3 seconds
            callback: () => {
                this.spawnBeignetMonster();
                this.bossMinionCount++;
                if (this.bossMinionCount >= 5) {
                    this.repositionBoss();
                    this.bossMinionCount = 0; // Reset counter
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    shootProjectiles() {
        if (!this.player || !this.boss) return;
    
        let projectile = this.bossProjectiles.create(this.boss.x, this.boss.y, 'beignetProjectile');
        if (projectile) {
            projectile.setActive(true).setVisible(true);
            projectile.body.setAllowGravity(false);
    
            // Calculate the angle between the boss and the player
            const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
    
            // Set velocity to make the projectile move towards the player
            const speed = 300; // Adjust speed as needed
            projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
        this.beignetProjectileFireSFX.play();
    }    

    handleBeignetProjectileCollision(player, projectile) {
        projectile.destroy();
        this.playerHealth -= 1;
        this.updateHealthUI();
        this.sound.play('playerHit');
    
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }

    //EnemySpawns
    spawnMardiGrasZombies() {
        if (!this.minions) {
            console.warn("⚠️ Minions group is missing! Cannot spawn zombies.");
            return;
        }
    
        const { width, height } = this.scale;
        const numZombies = 5;
        const spawnSpacing = width / (numZombies + 1);
    
        for (let i = 0; i < numZombies; i++) {
            let spawnX = spawnSpacing * (i + 1);
            let spawnY = height - 150;
    
            let zombie = this.minions.create(spawnX, spawnY, 'mardiGrasZombie');
    
            if (!zombie) {
                console.error("🚨 Failed to create zombie at", spawnX, spawnY);
                continue;
            }
    
            zombie.setActive(true).setVisible(true);
            zombie.setCollideWorldBounds(true);
            zombie.body.setAllowGravity(true);
            zombie.setBounce(0.2);
            zombie.health = 1;
    
            if (isNaN(zombie.health)) {
                console.warn("⚠️ Zombie health is NaN! Resetting to 1.");
                zombie.health = 1;
            }
    
            let speed = 200;
            let direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    
            this.time.delayedCall(100, () => {
                if (zombie && zombie.body) {
                    zombie.setVelocityX(direction * speed);
                    zombie.setFlipX(direction < 0);
                }
            });
    
            this.minions.add(zombie);
            this.physics.add.collider(zombie, this.ground);
            if (this.movingPlatforms) {
                this.physics.add.collider(zombie, this.movingPlatforms);
            }
            this.physics.add.overlap(this.player, zombie, this.handleMinionCollision, null, this);
    
            this.physics.add.overlap(this.projectiles, zombie, (projectile, zombie) => {
                if (!zombie || !zombie.active || !projectile) return;
                projectile.destroy();
                zombie.health -= 1;
                console.log(`🩸 Zombie hit! Remaining health: ${zombie.health}`);
    
                if (zombie.health <= 0) {
                    if (this.mardiGrasZombieHitSFX) {
                        console.log("🔊 Playing zombie hit sound...");
                        this.mardiGrasZombieHitSFX.play();
                    } else {
                        console.warn("⚠️ Zombie hit sound not found.");
                    }
                    
                    this.time.delayedCall(200, () => {
                        if (zombie && zombie.active) {
                            zombie.destroy();
                        }
                    });
                }
            });
    
            console.log(`🧟‍♂️ Zombie spawned at (${spawnX}, ${spawnY})`);
        }
    
        this.updateEnemyCountUI();
    }

    spawnBeignetMonster() {
        if (!this.boss || !this.minions) return;
    
        let patrolPoints = [500, 1000, 1500, 2000, 2500];
        let x;
    
        do {
            x = Phaser.Math.RND.pick(patrolPoints);
        } while (Math.abs(x - this.player.x) < 150);
    
        let monster = this.minions.create(x, this.scale.height - 150, 'beignetMonster');
        if (monster) {
            monster.setActive(true).setVisible(true);
            monster.setCollideWorldBounds(true);
            monster.body.setAllowGravity(true);
            monster.setBounce(0.2);
            monster.health = 2;
    
            this.tweens.add({
                targets: monster,
                x: x + 300,
                duration: 3000,
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });
    
            this.physics.add.collider(monster, this.ground);
            this.physics.add.collider(monster, this.movingPlatforms);
            this.physics.add.overlap(this.player, monster, this.handleMinionCollision, null, this);
            this.physics.add.overlap(this.projectiles, monster, (projectile, monster) => {
                projectile.destroy();
                monster.health -= 1;
                if (this.beignetMonsterHitSFX) {
                    this.beignetMonsterHitSFX.play();
                } else {
                    console.warn("🚨 Sound effect 'beignetMonsterHitSFX' is not initialized!");
                }
                if (monster.health <= 0) {
                    monster.destroy();
                }
            });
        }
        this.updateEnemyCountUI();
    }

    spawnBeignetMinion() {
        if (!this.movingPlatforms || !this.minions) return;
    
        let platforms = this.movingPlatforms.getChildren();
        if (platforms.length === 0) return;
    
        let platform = Phaser.Math.RND.pick(platforms);
        let x = platform.x;
        let y = platform.y - 30;
    
        let minion = this.minions.create(x, y, 'beignetMinion');
        if (minion) {
            minion.setActive(true).setVisible(true);
            minion.setCollideWorldBounds(true);
            minion.body.setAllowGravity(false);
            minion.setImmovable(true);
            minion.health = 1;
    
            this.time.addEvent({
                delay: 16,
                loop: true,
                callback: () => {
                    if (minion.active && platform.active) {
                        minion.x = platform.x;
                    }
                },
            });
    
            this.time.addEvent({
                delay: 4000,
                loop: true,
                callback: () => {
                    if (minion.active) {
                        this.shootBeignet(minion);
                        if (this.beignetProjectileFireSFX) {
                            this.beignetProjectileFireSFX.play();
                        }
                    }
                },
            });
    
            this.physics.add.overlap(this.projectiles, minion, (projectile, minion) => {
                projectile.destroy();
                minion.health -= 1;
                if (this.beignetMinionHitSFX) {
                    this.beignetMinionHitSFX.play();
                }
                if (minion.health <= 0) {
                    minion.destroy();
                }
            });
    
            console.log(`🍩 Beignet Minion spawned on moving platform at (${x}, ${y})`);
        }
    }  
    
    shootBeignet(minion) {
        if (!minion || !this.bossProjectiles) return;
    
        let projectile = this.bossProjectiles.create(minion.x, minion.y, 'beignetProjectile');
        if (projectile) {
            projectile.setActive(true).setVisible(true);
            projectile.body.setAllowGravity(false);
    
            // Calculate angle between minion and player
            const angle = Phaser.Math.Angle.Between(minion.x, minion.y, this.player.x, this.player.y);
    
            // Set velocity towards the player
            const speed = 250;
            projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
    }

    //UI
    updateHealthUI() {
        document.getElementById('health-bar-inner').style.width = `${(this.playerHealth / 10) * 100}%`;
    }

    updateEnemyCountUI() {
        document.getElementById('enemy-count').innerText = `Enemies Left: ${this.minions.countActive(true)}`;
    }
    
    handleEnemyDeath(enemy) {
        if (!enemy || !enemy.active) return;
    
        console.log(`💀 Enemy defeated: ${enemy.texture.key}`);
    
        if (enemy.texture.key === 'beignetMinion') {
            this.beignetMinionHitSFX.play(); // ✅ Play Minion Hit SFX
        } else if (enemy.texture.key === 'beignetMonster') {
            this.beignetMonsterHitSFX.play(); // ✅ Play Monster Hit SFX
        }
    
        enemy.destroy();
    }    

    gameOver() {
        console.log("💀 Game Over! Restarting Boss Fight...");
    
        // ✅ Stop everything
        this.cleanUpLevel();
    
        // ✅ Display Game Over UI
        this.add.image(this.scale.width / 2, this.scale.height / 2, 'gameOver').setOrigin(0.5);
    
        // ✅ Restart level after delay or on player input
        this.time.delayedCall(3000, () => {
            console.log("🔄 Restarting Boss Fight...");
            this.scene.restart();
        });
    
        this.input.keyboard.once('keydown-SPACE', () => {
            console.log("🔄 Restarting Boss Fight via SPACE key...");
            this.scene.restart();
        });
    
        this.input.once('pointerdown', () => {
            console.log("🔄 Restarting Boss Fight via Click/Tap...");
            this.scene.restart();
        });

        if (typeof gdApi !== "undefined" && gdApi.showAd) {
            gdApi.showAd();
        }
        
    }
    
    levelComplete() {
        console.log("Final Boss Defeated! Game Complete!");
    
        // ✅ Fire Meta Pixel GameCompleted event
        if (typeof fbq === 'function') {
            fbq('trackCustom', 'GameCompleted');
            console.log("📈 Meta Pixel: GameCompleted event fired!");
        } else {
            console.warn("⚠️ Meta Pixel fbq function not found.");
        }
    
        // Delay cleanup to ensure transition happens smoothly
        this.time.delayedCall(1000, () => {
            this.cleanUpLevel();
    
            this.time.delayedCall(2000, () => {
                this.scene.start('VictoryScene');
            });
        });
    }
    
    
    cleanUpLevel() {
        console.log("🧹 Cleaning up level...");
        
        if (this.isCleaningUp) return;
        this.isCleaningUp = true;
    
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.physics.world.colliders.destroy();
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
    
        // Stop Music
        if (this.bossMusic) {
            console.log("🎵 Stopping boss music...");
            this.bossMusic.stop();
            this.bossMusic.destroy();
            this.bossMusic = null;
        }
    
        // Clear Physics Objects
        const objectGroups = [this.minions, this.projectiles, this.bossProjectiles, this.hazards, this.healthPacks];
    
        objectGroups.forEach(group => {
            if (group && group.children) {
                group.children.iterate(child => child && child.destroy());
                group.clear(true, true);
            }
        });
    
        // **Ensure Boss and Force Field Exist Before Destroying**
        if (this.boss) {
            console.log("💀 Destroying boss...");
            this.boss.destroy();
            this.boss = null;
        }
    
        if (this.forceField) {
            console.log("🛡️ Removing force field...");
            this.forceField.destroy();
            this.forceField = null;
        }
    
        console.log("✅ Cleanup Complete!");
    }
    
    handleLevelTransition(callback) {
        this.input.keyboard.once('keydown-SPACE', callback);
        this.input.once('pointerdown', callback);
    }

    checkBossDefeat() {
        if (this.boss.health <= 0) {
            this.levelComplete();
        }
    }
}