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
    // Player sprite (Improved Tater)
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Shadow/Outline (Darker Teal)
    playerGraphics.fillStyle(0x008866, 1);
    playerGraphics.fillEllipse(24, 26, 42, 50);

    // Main Body (Cyan)
    playerGraphics.fillStyle(0x00d4aa, 1);
    playerGraphics.fillEllipse(24, 24, 40, 48);

    // Highlight (Top Left)
    playerGraphics.fillStyle(0x44ffcc, 0.6);
    playerGraphics.fillEllipse(16, 12, 16, 10);

    // Eyes (White background)
    playerGraphics.fillStyle(0xffffff, 1);
    playerGraphics.fillCircle(15, 20, 8);
    playerGraphics.fillCircle(33, 20, 8);

    // Pupils (Dark)
    playerGraphics.fillStyle(0x0d0d14, 1);
    playerGraphics.fillCircle(15, 20, 3);
    playerGraphics.fillCircle(33, 20, 3);

    // Eyebrows (Determination)
    playerGraphics.lineStyle(3, 0x004433, 1);
    playerGraphics.beginPath();
    playerGraphics.moveTo(8, 14);
    playerGraphics.lineTo(20, 18); // Left brow
    playerGraphics.moveTo(40, 14);
    playerGraphics.lineTo(28, 18); // Right brow
    playerGraphics.strokePath();

    playerGraphics.generateTexture('player', 48, 48);
    playerGraphics.destroy();

    // Basic Enemy (Angry Red Blob)
    const enemyGraphics = this.make.graphics({ x: 0, y: 0 });
    // Body
    enemyGraphics.fillStyle(0xff4444, 1);
    enemyGraphics.fillCircle(16, 16, 14);
    enemyGraphics.lineStyle(2, 0xcc0000, 1);
    enemyGraphics.strokeCircle(16, 16, 14);
    
    // Eyes
    enemyGraphics.fillStyle(0xffcc00, 1); // Yellow
    enemyGraphics.fillCircle(11, 13, 4);
    enemyGraphics.fillCircle(21, 13, 4);
    
    // Pupils
    enemyGraphics.fillStyle(0x000000, 1);
    enemyGraphics.fillCircle(11, 13, 1.5);
    enemyGraphics.fillCircle(21, 13, 1.5);
    
    // Mouth (frown)
    enemyGraphics.lineStyle(2, 0x660000, 1);
    enemyGraphics.beginPath();
    enemyGraphics.arc(16, 24, 6, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    enemyGraphics.strokePath();
    
    enemyGraphics.generateTexture('enemy_basic', 32, 32);
    enemyGraphics.destroy();

    // Fast enemy (flaming)
    const fastEnemyGraphics = this.make.graphics({ x: 0, y: 0 });
    // Outer flame (Red-Orange)
    fastEnemyGraphics.fillStyle(0xff4400, 1);
    fastEnemyGraphics.fillTriangle(24, 0, 40, 32, 8, 32);
    // Side flicks
    fastEnemyGraphics.fillTriangle(16, 10, 8, 20, 20, 24);
    fastEnemyGraphics.fillTriangle(32, 10, 40, 20, 28, 24);
    // Inner flame (Yellow)
    fastEnemyGraphics.fillStyle(0xffcc00, 1);
    fastEnemyGraphics.fillTriangle(24, 8, 32, 28, 16, 28);
    fastEnemyGraphics.generateTexture('enemy_fast', 48, 32);
    fastEnemyGraphics.destroy();

    // Tank Enemy (Heavy Golem)
    const tankEnemyGraphics = this.make.graphics({ x: 0, y: 0 });
    
    // Main Body (Dark Orange)
    tankEnemyGraphics.fillStyle(0xcc6600, 1);
    tankEnemyGraphics.fillRoundedRect(4, 4, 40, 40, 8);
    
    // Inner Armor (Lighter Orange)
    tankEnemyGraphics.fillStyle(0xff8800, 1);
    tankEnemyGraphics.fillRoundedRect(8, 8, 32, 32, 6);
    
    // Rivets/Bolts
    tankEnemyGraphics.fillStyle(0x663300, 1);
    tankEnemyGraphics.fillCircle(10, 10, 2);
    tankEnemyGraphics.fillCircle(38, 10, 2);
    tankEnemyGraphics.fillCircle(10, 38, 2);
    tankEnemyGraphics.fillCircle(38, 38, 2);
    
    // Visor (Cyan glowing strip)
    tankEnemyGraphics.fillStyle(0x000000, 1);
    tankEnemyGraphics.fillRect(12, 18, 24, 8);
    tankEnemyGraphics.fillStyle(0x00ffff, 1);
    tankEnemyGraphics.fillRect(14, 20, 20, 4);
    
    tankEnemyGraphics.generateTexture('enemy_tank', 48, 48);
    tankEnemyGraphics.destroy();

    // Elite Enemy (Knight/Armored)
    const eliteGraphics = this.make.graphics({ x: 0, y: 0 });
    eliteGraphics.fillStyle(0x440088, 1); // Dark Purple
    eliteGraphics.fillCircle(20, 20, 18);
    eliteGraphics.lineStyle(3, 0xffd700, 1); // Gold trim
    eliteGraphics.strokeCircle(20, 20, 18);
    // Spikes
    eliteGraphics.fillStyle(0xffd700, 1);
    eliteGraphics.fillTriangle(20, 0, 26, 10, 14, 10); // Top spike
    eliteGraphics.fillTriangle(40, 20, 30, 14, 30, 26); // Right spike
    eliteGraphics.fillTriangle(0, 20, 10, 14, 10, 26); // Left spike
    eliteGraphics.generateTexture('enemy_elite', 40, 40);
    eliteGraphics.destroy();

    // Boss Enemy (Demon)
    const bossGraphics = this.make.graphics({ x: 0, y: 0 });
    bossGraphics.fillStyle(0x220000, 1); // Dark Red/Black
    bossGraphics.fillCircle(40, 40, 36);
    // Horns
    bossGraphics.fillStyle(0xdddddd, 1);
    bossGraphics.fillTriangle(20, 20, 10, 0, 30, 10); // Left horn
    bossGraphics.fillTriangle(60, 20, 70, 0, 50, 10); // Right horn
    // Eyes
    bossGraphics.fillStyle(0xff0000, 1);
    bossGraphics.fillCircle(25, 35, 8);
    bossGraphics.fillCircle(55, 35, 8);
    bossGraphics.generateTexture('enemy_boss', 80, 80);
    bossGraphics.destroy();

    // Ranged Enemy (Eye/Drone)
    const rangedGraphics = this.make.graphics({ x: 0, y: 0 });
    rangedGraphics.fillStyle(0x006600, 1); // Dark Green
    rangedGraphics.fillCircle(16, 16, 14);
    // Eye
    rangedGraphics.fillStyle(0xccffcc, 1);
    rangedGraphics.fillCircle(16, 16, 8);
    rangedGraphics.fillStyle(0x000000, 1);
    rangedGraphics.fillCircle(16, 16, 3);
    rangedGraphics.generateTexture('enemy_ranged', 32, 32);
    rangedGraphics.destroy();

    // Bullet (cyan projectile)
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xbc0808, 1);
    bulletGraphics.fillCircle(6, 6, 6);
    bulletGraphics.generateTexture('bullet', 12, 12);
    bulletGraphics.destroy();

    // Flare (white soft circle for particles)
    const flareGraphics = this.make.graphics({ x: 0, y: 0 });
    flareGraphics.fillStyle(0xffffff, 1);
    flareGraphics.fillCircle(4, 4, 4);
    flareGraphics.generateTexture('flare', 8, 8);
    flareGraphics.destroy();

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
