import { addFullscreenButton } from '/utils/fullScreenUtils.js';

export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    preload() {
        this.load.image('victoryScreen', 'assets/Levels/BackGrounds/CrawfishVictorySceneFamily.webp');
        this.load.audio('victoryMusic', 'assets/Audio/LevelMusic/mp3/TurboNegroShortVersion.mp3');
        this.load.image('confetti', 'assets/Effects/confetti.png'); // Ensure you have a confetti sprite
    }    

    create() {
        const { width, height } = this.scale;

        // Add background
        this.add.image(width / 2, height / 2, 'victoryScreen').setDisplaySize(width, height);

        // Play victory music
        this.victoryMusic = this.sound.add('victoryMusic', { loop: true, volume: 0.5 });
        this.victoryMusic.play();

        // Add background behind credits for readability
        const creditsBg = this.add.graphics();
        creditsBg.fillStyle(0x000000, 0.6);
        creditsBg.fillRect(width / 4, height * 0.7, width / 2, height / 6);

        // Display Victory Text with more contrast
        const victoryText = this.add.text(width / 2, height / 3.5, 'Congratulations!\nYOU WIN!!!', {
            fontSize: '72px',
            fontFamily: 'Nosifer',
            color: '#FFD700',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 10,
            shadow: { offsetX: 6, offsetY: 6, color: 'black', blur: 12, stroke: false, fill: true }
        }).setOrigin(0.5);

        // Credit Roll with better readability, moving to circled area
        const creditsText = this.add.text(width / 2, height, 
            'Turbo Negro! Saves The French Quarter!!!\n' +
            'Created by Bhillion Dollar Productions\n' +
            'Developed with Phaser.js\n' +
            'visit www.bhilliondollar.com for more!', {
            fontSize: '25px',
            fontFamily: 'Metal Mania',
            color: '#FFD700',
            align: 'center',
            stroke: '#000000', // Black Outline for readability
            strokeThickness: 6, // Thicker outline for clarity
            backgroundColor: 'gray',
            shadow: {
                offsetX: 3,
                offsetY: 3.2,
                color: 'black',
                blur: 6,
                stroke: false,
                fill: true
            }
        }).setOrigin(0.5);

        // Credit Roll Animation - Moves to the circled area
        this.tweens.add({
            targets: creditsText,
            y: height * 0.62,
            duration: 8000,
            ease: 'Linear'
        });

        // Add button background for 3D effect
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x8B0000, 1);
        buttonBg.fillRoundedRect(width / 2 - 200, height * 0.85 - 40, 400, 80, 15);
        buttonBg.fillStyle(0xFF4500, 1);
        buttonBg.fillRoundedRect(width / 2 - 190, height * 0.85 - 30, 380, 60, 15);

        // Return to Start Menu Button with 3D effect
        const mainMenuButton = this.add.text(width / 2, height * 0.85, 'Return to Main Menu', {
            fontSize: '42px',
            fontFamily: 'Metal Mania',
            fill: '#FFD700',
            backgroundColor: 'transparent',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
            align: 'center',
            stroke: '#8B0000',
            strokeThickness: 5,
        }).setOrigin(0.5).setInteractive();

        mainMenuButton.on('pointerover', () => {
            mainMenuButton.setStyle({ fill: '#ffffff' });
        });
        
        mainMenuButton.on('pointerout', () => {
            mainMenuButton.setStyle({ fill: '#FFD700' });
        });
        
        mainMenuButton.on('pointerdown', () => {
            this.victoryMusic.stop();
            this.scene.start('StartMenu');
        });

        // Add Fullscreen Button
        addFullscreenButton(this);

        // Add confetti effect with controlled opacity and positioning
        const particles = this.add.particles('confetti');
        const emitter = particles.createEmitter({
            x: { min: 0, max: width },
            y: 0,
            lifespan: 3000,
            speedY: { min: 100, max: 300 },
            scale: { start: 0.5, end: 0 },
            quantity: 2, // Reduce number of particles spawned
            alpha: { start: 1, end: 0.3 }, // Fade out gently
            blendMode: 'NORMAL', // Prevent extreme brightness
            frequency: 500 // Space out confetti appearance
        });

        // ✅ Ensure confetti appears on top of the background but behind the text/buttons
        particles.setDepth(2);
        victoryText.setDepth(3);
        creditsText.setDepth(3);
        mainMenuButton.setDepth(3);
    }
}
