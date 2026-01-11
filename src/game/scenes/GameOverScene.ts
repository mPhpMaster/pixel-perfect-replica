import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private wave = 1;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; wave: number }): void {
    this.score = data.score;
    this.wave = data.wave;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0d14, 0x0d0d14, 0x1a0a0a, 0x1a0a0a, 1);
    bg.fillRect(0, 0, width, height);

    // Game Over text
    const gameOverText = this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#ff4444',
      stroke: '#440000',
      strokeThickness: 6,
    });
    gameOverText.setOrigin(0.5);

    // Score display
    const scoreText = this.add.text(width / 2, height * 0.4, `SCORE: ${this.score}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ffaa00',
    });
    scoreText.setOrigin(0.5);

    // Wave reached
    const waveText = this.add.text(width / 2, height * 0.5, `WAVE REACHED: ${this.wave}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00d4aa',
    });
    waveText.setOrigin(0.5);

    // High score check
    const highScore = parseInt(localStorage.getItem('tater_highscore') || '0', 10);
    if (this.score >= highScore && this.score > 0) {
      const newHighText = this.add.text(width / 2, height * 0.58, 'NEW HIGH SCORE!', {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: '#44ff44',
      });
      newHighText.setOrigin(0.5);
      this.tweens.add({
        targets: newHighText,
        scale: { from: 1, to: 1.1 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // Retry button
    this.createButton(width / 2, height * 0.72, 'PLAY AGAIN', () => {
      this.scene.start('GameScene');
    });

    // Main menu button
    this.createButton(width / 2, height * 0.85, 'MAIN MENU', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x1a1a3e, 1);
    buttonBg.fillRoundedRect(-120, -25, 240, 50, 12);
    buttonBg.lineStyle(2, 0x00d4aa, 1);
    buttonBg.strokeRoundedRect(-120, -25, 240, 50, 12);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
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
