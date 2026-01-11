import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { XPGem } from '../entities/XPGem';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies!: Phaser.GameObjects.Group;
  bullets!: Phaser.GameObjects.Group;
  xpGems!: Phaser.GameObjects.Group;

  // Game state
  wave = 1;
  waveTimer = 0;
  waveDuration = 30000; // 30 seconds per wave
  enemiesSpawned = 0;
  enemiesPerWave = 10;
  spawnTimer = 0;
  spawnInterval = 2000;
  score = 0;
  isPaused = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Reset game state
    this.wave = 1;
    this.waveTimer = 0;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.score = 0;
    this.isPaused = false;

    // Create game world bounds (larger than camera)
    const worldWidth = GAME_WIDTH * 2;
    const worldHeight = GAME_HEIGHT * 2;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Grid background
    this.createBackground(worldWidth, worldHeight);

    // Initialize groups
    this.enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
    this.bullets = this.add.group({ classType: Bullet, runChildUpdate: true });
    this.xpGems = this.add.group({ classType: XPGem, runChildUpdate: true });

    // Create player at center
    this.player = new Player(this, worldWidth / 2, worldHeight / 2);

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Input setup
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // ESC for pause
    this.input.keyboard!.on('keydown-ESC', () => {
      this.pauseGame();
    });

    // Focus loss pause
    this.game.events.on('blur', () => {
      this.pauseGame();
    });

    // Collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, undefined, this);
    this.physics.add.overlap(this.player, this.xpGems, this.collectXP, undefined, this);

    // Launch HUD
    this.scene.launch('HUDScene', { gameScene: this });
  }

  private createBackground(worldWidth: number, worldHeight: number): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0d0d14, 1);
    graphics.fillRect(0, 0, worldWidth, worldHeight);

    // Grid lines
    graphics.lineStyle(1, 0x1a1a3e, 0.5);
    const gridSize = 64;
    for (let x = 0; x <= worldWidth; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, worldHeight);
    }
    for (let y = 0; y <= worldHeight; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(worldWidth, y);
    }
    graphics.strokePath();
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    // Handle player movement
    const moveX = (this.cursors.right.isDown || this.wasdKeys.D.isDown ? 1 : 0) - 
                  (this.cursors.left.isDown || this.wasdKeys.A.isDown ? 1 : 0);
    const moveY = (this.cursors.down.isDown || this.wasdKeys.S.isDown ? 1 : 0) - 
                  (this.cursors.up.isDown || this.wasdKeys.W.isDown ? 1 : 0);
    
    this.player.move(moveX, moveY);
    this.player.update(time, delta);

    // Auto-attack nearest enemy
    this.player.autoAttack(this.enemies, this.bullets, time);

    // Wave timer
    this.waveTimer += delta;
    if (this.waveTimer >= this.waveDuration) {
      this.nextWave();
    }

    // Spawn enemies
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval && this.enemiesSpawned < this.enemiesPerWave * this.wave) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // Update HUD
    this.events.emit('updateHUD', {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      xp: this.player.xp,
      xpToLevel: this.player.xpToNextLevel,
      level: this.player.level,
      wave: this.wave,
      waveProgress: this.waveTimer / this.waveDuration,
      score: this.score,
    });
  }

  private spawnEnemy(): void {
    const spawnDistance = 600;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = this.player.x + Math.cos(angle) * spawnDistance;
    const y = this.player.y + Math.sin(angle) * spawnDistance;

    // Enemy type based on wave
    let enemyType: 'normal' | 'fast' | 'tank' = 'normal';
    if (this.wave >= 3 && Math.random() < 0.3) {
      enemyType = Math.random() < 0.5 ? 'fast' : 'tank';
    }

    const enemy = new Enemy(this, x, y, enemyType, this.wave);
    this.enemies.add(enemy);
    this.enemiesSpawned++;
  }

  private nextWave(): void {
    this.wave++;
    this.waveTimer = 0;
    this.enemiesSpawned = 0;
    this.spawnInterval = Math.max(500, this.spawnInterval - 100);

    // Flash effect
    this.cameras.main.flash(500, 0, 212, 170, false);
  }

  private bulletHitEnemy(bullet: any, enemy: any): void {
    bullet.destroy();
    const killed = enemy.takeDamage(this.player.damage);
    if (killed) {
      this.score += enemy.scoreValue;
      // Spawn XP gem
      const gem = new XPGem(this, enemy.x, enemy.y, enemy.xpValue);
      this.xpGems.add(gem);
    }
  }

  private playerHitEnemy(_player: any, enemy: any): void {
    if (this.player.takeDamage(enemy.damage)) {
      this.gameOver();
    }
    enemy.destroy();
  }

  private collectXP(_player: any, gem: any): void {
    this.player.gainXP(gem.value);
    gem.destroy();
  }

  private pauseGame(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.physics.pause();
    this.scene.launch('PauseScene', { gameScene: this });
  }

  resumeGame(): void {
    this.isPaused = false;
    this.physics.resume();
    this.scene.stop('PauseScene');
  }

  private gameOver(): void {
    // Save high score
    const highScore = parseInt(localStorage.getItem('tater_highscore') || '0', 10);
    if (this.score > highScore) {
      localStorage.setItem('tater_highscore', this.score.toString());
    }

    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', { score: this.score, wave: this.wave });
  }
}
