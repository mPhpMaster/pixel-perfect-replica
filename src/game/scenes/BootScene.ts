import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x1a1a2e, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00d4aa',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00d4aa, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Generate placeholder graphics for game objects
    this.createPlaceholderAssets();
  }

  createPlaceholderAssets(): void {
    // Player sprite (cyan tater/potato shape)
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    playerGraphics.fillStyle(0x00d4aa, 1);
    playerGraphics.fillEllipse(24, 24, 40, 48);
    playerGraphics.fillStyle(0x00ffcc, 1);
    playerGraphics.fillCircle(16, 18, 5);
    playerGraphics.fillCircle(32, 18, 5);
    playerGraphics.fillStyle(0x0d0d14, 1);
    playerGraphics.fillCircle(16, 18, 2);
    playerGraphics.fillCircle(32, 18, 2);
    playerGraphics.generateTexture('player', 48, 48);
    playerGraphics.destroy();

    // Enemy sprite (red blob)
    const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
    enemyGraphics.fillStyle(0xff4444, 1);
    enemyGraphics.fillCircle(16, 16, 14);
    enemyGraphics.fillStyle(0xcc0000, 1);
    enemyGraphics.fillCircle(16, 16, 8);
    enemyGraphics.generateTexture('enemy', 32, 32);
    enemyGraphics.destroy();

    // Fast enemy (purple)
    const fastEnemyGraphics = this.make.graphics({ x: 0, y: 0 });
    fastEnemyGraphics.fillStyle(0x9933ff, 1);
    fastEnemyGraphics.fillTriangle(12, 24, 24, 0, 36, 24);
    fastEnemyGraphics.generateTexture('enemy_fast', 48, 32);
    fastEnemyGraphics.destroy();

    // Tank enemy (orange, larger)
    const tankEnemyGraphics = this.make.graphics({ x: 0, y: 0 });
    tankEnemyGraphics.fillStyle(0xff8800, 1);
    tankEnemyGraphics.fillRect(4, 4, 40, 40);
    tankEnemyGraphics.fillStyle(0xcc6600, 1);
    tankEnemyGraphics.fillRect(12, 12, 24, 24);
    tankEnemyGraphics.generateTexture('enemy_tank', 48, 48);
    tankEnemyGraphics.destroy();

    // Bullet (cyan projectile)
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0x00ffff, 1);
    bulletGraphics.fillCircle(6, 6, 6);
    bulletGraphics.generateTexture('bullet', 12, 12);
    bulletGraphics.destroy();

    // XP gem (purple diamond)
    const xpGraphics = this.make.graphics({ x: 0, y: 0 });
    xpGraphics.fillStyle(0xaa44ff, 1);
    xpGraphics.fillTriangle(8, 0, 16, 8, 8, 16);
    xpGraphics.fillTriangle(8, 0, 0, 8, 8, 16);
    xpGraphics.generateTexture('xp_gem', 16, 16);
    xpGraphics.destroy();

    // Health pickup (green cross)
    const healthGraphics = this.make.graphics({ x: 0, y: 0 });
    healthGraphics.fillStyle(0x44ff44, 1);
    healthGraphics.fillRect(6, 0, 8, 20);
    healthGraphics.fillRect(0, 6, 20, 8);
    healthGraphics.generateTexture('health_pickup', 20, 20);
    healthGraphics.destroy();
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
