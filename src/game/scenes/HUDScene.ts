import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class HUDScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private waveTimerBar!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private gameScene!: GameScene;

  constructor() {
    super({ key: 'HUDScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    const { width } = this.cameras.main;

    // Health bar (top-left)
    this.healthBar = this.add.graphics();
    this.healthText = this.add.text(20, 20, 'HP: 100/100', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ff6666',
    });

    // XP bar (bottom of screen)
    this.xpBar = this.add.graphics();
    this.levelText = this.add.text(20, 680, 'LVL 1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#aa44ff',
    });

    // Wave info (top-right)
    this.waveText = this.add.text(width - 20, 20, 'WAVE 1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#00d4aa',
    }).setOrigin(1, 0);

    this.waveTimerBar = this.add.graphics();

    // Score (top-center)
    this.scoreText = this.add.text(width / 2, 20, 'SCORE: 0', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffaa00',
    }).setOrigin(0.5, 0);

    // Listen for updates
    this.gameScene.events.on('updateHUD', this.updateHUD, this);
  }

  private updateHUD(data: {
    health: number;
    maxHealth: number;
    xp: number;
    xpToLevel: number;
    level: number;
    wave: number;
    waveProgress: number;
    score: number;
  }): void {
    const { width } = this.cameras.main;

    // Health bar
    this.healthBar.clear();
    this.healthBar.fillStyle(0x331111, 1);
    this.healthBar.fillRoundedRect(20, 40, 200, 20, 4);
    this.healthBar.fillStyle(0xff4444, 1);
    const healthWidth = (data.health / data.maxHealth) * 196;
    this.healthBar.fillRoundedRect(22, 42, Math.max(0, healthWidth), 16, 3);
    this.healthText.setText(`HP: ${Math.floor(data.health)}/${data.maxHealth}`);

    // XP bar
    this.xpBar.clear();
    this.xpBar.fillStyle(0x1a1a3e, 1);
    this.xpBar.fillRect(0, 700, width, 20);
    this.xpBar.fillStyle(0x9933ff, 1);
    const xpWidth = (data.xp / data.xpToLevel) * width;
    this.xpBar.fillRect(0, 700, xpWidth, 20);
    this.levelText.setText(`LVL ${data.level}`);

    // Wave info
    this.waveText.setText(`WAVE ${data.wave}`);
    this.waveTimerBar.clear();
    this.waveTimerBar.fillStyle(0x1a1a3e, 1);
    this.waveTimerBar.fillRoundedRect(width - 220, 45, 200, 10, 3);
    this.waveTimerBar.fillStyle(0x00d4aa, 1);
    this.waveTimerBar.fillRoundedRect(width - 218, 47, 196 * data.waveProgress, 6, 2);

    // Score
    this.scoreText.setText(`SCORE: ${data.score}`);
  }

  shutdown(): void {
    this.gameScene.events.off('updateHUD', this.updateHUD, this);
  }
}
