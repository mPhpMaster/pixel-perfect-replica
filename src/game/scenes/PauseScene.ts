import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // Pause text
    const pauseText = this.add.text(width / 2, height * 0.3, 'PAUSED', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#00d4aa',
    });
    pauseText.setOrigin(0.5);

    // Resume button
    this.createButton(width / 2, height * 0.5, 'RESUME', () => {
      this.gameScene.resumeGame();
    });

    // Main menu button
    this.createButton(width / 2, height * 0.65, 'MAIN MENU', () => {
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.stop();
      this.scene.start('MainMenuScene');
    });

    // Fullscreen button
    // this.createButton(width / 2, height * 0.8, 'FULLSCREEN', () => {
    //     if (this.scale.isFullscreen) {
    //         this.scale.stopFullscreen();
    //     } else {
    //         this.scale.startFullscreen();
    //     }
    // });

    // ESC to resume
    this.input.keyboard!.on('keydown-ESC', () => {
      this.gameScene.resumeGame();
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
