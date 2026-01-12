import Phaser from 'phaser';
import { loadMeta } from '../systems/MetaProgression';

export class MainMenuScene extends Phaser.Scene {
  private audioUnlocked = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Gradient background simulation with rectangles
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d14, 0x0d0d14, 0x1a1a3e, 0x1a1a3e, 1);
    bg.fillRect(0, 0, width, height);

    // Animated stars/particles in background
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0x00d4aa,
        Phaser.Math.FloatBetween(0.1, 0.5)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title
    const title = this.add.text(width / 2, height * 0.25, 'PROJECT TATER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#00d4aa',
      stroke: '#004433',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Title glow effect
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.35, 'SURVIVAL ROGUELIKE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#9933ff',
    });
    subtitle.setOrigin(0.5);

    // Click to Start overlay (for audio context)
    if (!this.audioUnlocked) {
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
      const clickText = this.add.text(width / 2, height / 2, 'CLICK TO START', {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        color: '#ffffff',
      });
      clickText.setOrigin(0.5);

      // Pulsing animation
      this.tweens.add({
        targets: clickText,
        alpha: { from: 1, to: 0.5 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      overlay.setInteractive();
      overlay.once('pointerdown', () => {
        this.audioUnlocked = true;
        overlay.destroy();
        clickText.destroy();
        this.showMenu();
      });
    } else {
      this.showMenu();
    }
  }

  private showMenu(): void {
    const { width, height } = this.cameras.main;
    const meta = loadMeta();

    // Play button
    this.createButton(width / 2, height * 0.50, 'PLAY', () => {
      this.scene.start('GameScene');
    });

    // Shop button
    this.createButton(width / 2, height * 0.62, 'UPGRADE SHOP', () => {
      this.scene.start('ShopScene');
    });

    // Fullscreen button
    this.createButton(width / 2, height * 0.74, 'FULLSCREEN', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Coin display
    const coinText = this.add.text(width / 2, height * 0.84, `💰 ${meta.coins} COINS`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffdd00',
    });
    coinText.setOrigin(0.5);

    // High score display
    const highScore = localStorage.getItem('tater_highscore') || '0';
    const highScoreText = this.add.text(width / 2, height * 0.89, `HIGH SCORE: ${highScore}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffaa00',
    });
    highScoreText.setOrigin(0.5);

    // Controls hint
    const controlsText = this.add.text(width / 2, height * 0.95, 'WASD or ARROWS to move', {
      fontFamily: 'Inter',
      fontSize: '12px',
      color: '#666688',
    });
    controlsText.setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x1a1a3e, 1);
    buttonBg.fillRoundedRect(-120, -25, 240, 50, 12);
    buttonBg.lineStyle(2, 0x00d4aa, 1);
    buttonBg.strokeRoundedRect(-120, -25, 240, 50, 12);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00d4aa',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(x, y, [buttonBg, buttonText]);
    container.setSize(240, 50);
    container.setInteractive();

    container.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00d4aa, 0.2);
      buttonBg.fillRoundedRect(-120, -25, 240, 50, 12);
      buttonBg.lineStyle(3, 0x00ffcc, 1);
      buttonBg.strokeRoundedRect(-120, -25, 240, 50, 12);
      buttonText.setColor('#00ffcc');
    });

    container.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x1a1a3e, 1);
      buttonBg.fillRoundedRect(-120, -25, 240, 50, 12);
      buttonBg.lineStyle(2, 0x00d4aa, 1);
      buttonBg.strokeRoundedRect(-120, -25, 240, 50, 12);
      buttonText.setColor('#00d4aa');
    });

    container.on('pointerdown', callback);

    return container;
  }
}
