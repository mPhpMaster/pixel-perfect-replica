import Phaser from 'phaser';
import {Player} from '../entities/Player';
import {Enemy} from '../entities/Enemy';
import {Boss} from '../entities/Boss';
import {Bullet} from '../entities/Bullet';
import {XPGem} from '../entities/XPGem';
import {HealthPickup} from '../entities/HealthPickup';
import {OrbitShield} from '../entities/OrbitShield';
import {LightningStrike} from '../entities/LightningStrike';
import {ExplosiveAura} from '../entities/ExplosiveAura';
import {createDeathParticles, createDamageNumber, createXPPopup} from '../entities/Particle';
import {VirtualJoystick} from '../ui/VirtualJoystick';
import {GAME_WIDTH, GAME_HEIGHT} from '../config';
import {loadMeta, applyMetaBonuses, getXPMultiplier, PlayerMeta} from '../systems/MetaProgression';

export class GameScene extends Phaser.Scene {
    player!: Player;
    enemies!: Phaser.GameObjects.Group;
    bosses!: Phaser.GameObjects.Group;
    bullets!: Phaser.GameObjects.Group;
    xpGems!: Phaser.GameObjects.Group;
    healthPickups!: Phaser.GameObjects.Group;

    // Weapons
    private orbitShield: OrbitShield | null = null;
    private lightning: LightningStrike | null = null;
    private explosiveAura: ExplosiveAura | null = null;
    private lightningTimer = 0;
    private lightningCooldown = 2000;

    // Meta progression
    private meta!: PlayerMeta;
    private xpMultiplier = 1;
    private coinsEarned = 0;

    // Game state
    wave = 1;
    waveTimer = 0;
    waveDuration = 30000; // 30 seconds per wave
    enemiesSpawned = 0;
    enemiesPerWave = 30;
    spawnTimer = 0;
    spawnInterval = 2000;
    score = 0;
    isPaused = false;
    killCount = 0;
    bossActive = false;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key
    };
    private targetPosition: Phaser.Math.Vector2 | null = null;
    private virtualJoystick: VirtualJoystick | null = null;
    private isMobile = false;

    constructor() {
        super({key: 'GameScene'});
    }

    create(): void {
        // Load meta progression
        this.meta = loadMeta();
        this.xpMultiplier = getXPMultiplier(this.meta);
        this.coinsEarned = 0;

        // Reset game state
        this.wave = 1;
        this.waveTimer = 0;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.score = 0;
        this.isPaused = false;
        this.killCount = 0;
        this.bossActive = false;
        this.targetPosition = null;
        this.lightningTimer = 0;

        // Reset weapons
        this.orbitShield = null;
        this.lightning = null;
        this.explosiveAura = null;

        // Detect mobile
        this.isMobile = this.sys.game.device.input.touch;

        // Create game world bounds (larger than camera)
        const worldWidth = GAME_WIDTH * 2;
        const worldHeight = GAME_HEIGHT * 2;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Grid background
        this.createBackground(worldWidth, worldHeight);

        // Initialize groups
        this.enemies = this.add.group({classType: Enemy, runChildUpdate: true});
        this.bosses = this.add.group({classType: Boss, runChildUpdate: true});
        this.bullets = this.add.group({classType: Bullet, runChildUpdate: true});
        this.xpGems = this.add.group({classType: XPGem, runChildUpdate: true});
        this.healthPickups = this.add.group({classType: HealthPickup, runChildUpdate: true});

        // Create player at center
        this.player = new Player(this, worldWidth / 2, worldHeight / 2);
        
        // Apply meta bonuses to player
        applyMetaBonuses(this.player, this.meta);

        // Initialize unlocked weapons
        this.initializeWeapons();

        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
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

        // Virtual joystick for mobile
        if (this.isMobile) {
            this.virtualJoystick = new VirtualJoystick(this, 120, GAME_HEIGHT - 140);
        }

        // ESC for pause
        this.input.keyboard!.on('keydown-ESC', () => {
            this.pauseGame();
        });
        // Focus loss pause
        this.game.events.on('blur', () => {
            this.pauseGame();
        });

        this.input.keyboard!.on('keydown-NUMPAD_SUBTRACT', () => {
            this.previousWave();
        });
        this.input.keyboard!.on('keydown-NUMPAD_ADD', (event) => {
            if (!event.shiftKey) {
                this.nextWave();
                return;
            }
            this.player.pendingLevelUp = true;
        });

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, undefined, this);
        this.physics.add.overlap(this.bullets, this.bosses, this.bulletHitBoss, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, undefined, this);
        this.physics.add.overlap(this.player, this.bosses, this.playerHitBoss, undefined, this);
        this.physics.add.overlap(this.player, this.xpGems, this.collectXP, undefined, this);
        this.physics.add.overlap(this.player, this.healthPickups, this.collectHealth, undefined, this);

        // Launch HUD
        this.scene.launch('HUDScene', {gameScene: this});
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

        // Corner markers
        graphics.lineStyle(5, 0x00d4aa, 0.3);
        graphics.strokeRect(50, 50, worldWidth - 100, worldHeight - 100);
    }

    update(time: number, delta: number): void {
        if (this.isPaused) return;

        // Check for pending level up
        if (this.player.pendingLevelUp) {
            this.player.pendingLevelUp = false;
            this.showUpgradeSelection();
            return;
        }

        // Handle player movement
        let moveX = (this.cursors.right.isDown || this.wasdKeys.D.isDown ? 1 : 0) -
            (this.cursors.left.isDown || this.wasdKeys.A.isDown ? 1 : 0);
        let moveY = (this.cursors.down.isDown || this.wasdKeys.S.isDown ? 1 : 0) -
            (this.cursors.up.isDown || this.wasdKeys.W.isDown ? 1 : 0);

        // Virtual joystick input (mobile)
        if (this.virtualJoystick && (this.virtualJoystick.forceX !== 0 || this.virtualJoystick.forceY !== 0)) {
            moveX = this.virtualJoystick.forceX;
            moveY = this.virtualJoystick.forceY;
            this.targetPosition = null;
        } else if (moveX !== 0 || moveY !== 0) {
            // Keyboard input overrides mouse target
            this.targetPosition = null;
        } else if (!this.isMobile) {
            // Mouse input (desktop only)
            const pointer = this.input.activePointer;
            if (pointer.isDown) {
                this.targetPosition = new Phaser.Math.Vector2(
                    pointer.worldX,
                    pointer.worldY
                );
            }

            if (this.targetPosition) {
                const dx = this.targetPosition.x - this.player.x;
                const dy = this.targetPosition.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 10) {
                    moveX = dx;
                    moveY = dy;
                } else {
                    this.targetPosition = null;
                    moveX = 0;
                    moveY = 0;
                }
            }
        }

        this.player.move(moveX, moveY);
        this.player.update(time, delta);

        // Update weapons
        this.updateWeapons(time, delta);

        // Update bosses
        this.bosses.getChildren().forEach((bossObj) => {
            const boss = bossObj as Boss;
            boss.update(time, delta);
        });

        // Check if boss wave is complete
        if (this.bossActive && this.bosses.getLength() === 0) {
            this.bossActive = false;
        }

        // Auto-attack nearest enemy
        this.player.autoAttack(this.enemies, this.bullets, time);

        // Update XP gems with player magnet range
        this.xpGems.getChildren().forEach((gemObj) => {
            const gem = gemObj as XPGem;
            gem.magnetDistance = this.player.magnetRange;
        });

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
            kills: this.killCount,
        });
    }

    private spawnEnemy(): void {
        const spawnDistance = 600;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const x = this.player.x + Math.cos(angle) * spawnDistance;
        const y = this.player.y + Math.sin(angle) * spawnDistance;

        // Enemy type based on wave
        let enemyType: 'basic' | 'fast' | 'tank' | 'elite' | 'boss' | 'ranged' = 'basic';

        // Wave progression logic
        if (this.wave >= 10 && this.wave % 10 === 0 && Math.random() < 0.05) {
            enemyType = 'boss';
        } else if (this.wave >= 5 && Math.random() < 0.1) {
            enemyType = 'elite';
        } else if (this.wave >= 3) {
            const rand = Math.random();
            if (rand < 0.2) enemyType = 'fast';
            else if (rand < 0.35) enemyType = 'tank';
            else if (rand < 0.5) enemyType = 'ranged';
        } else if (this.wave >= 2 && Math.random() < 0.3) {
            enemyType = 'fast';
        }

        const enemy = new Enemy(this, x, y, enemyType, this.wave);
        this.enemies.add(enemy);
        this.enemiesSpawned++;
    }

    private previousWave(): void {
        if (this.wave <= 1) return;
        this.wave--;
        this.wave--;
        if (this.wave < 0) this.wave = 0;

        this.nextWave();
    }

    private nextWave(): void {
        this.wave++;
        this.waveTimer = 0;
        this.enemiesSpawned = 0;
        this.spawnInterval = Math.max(500, this.spawnInterval - 100);

        // Flash effect
        this.cameras.main.flash(500, 0, 212, 170, false);

        // Spawn health pickup on wave transition
        if (this.wave % 2 === 0) {
            const pickup = new HealthPickup(this, this.player.x + Phaser.Math.Between(-100, 100), this.player.y + Phaser.Math.Between(-100, 100));
            this.healthPickups.add(pickup);
        }

        // Boss wave every 5 waves
        if (this.wave % 5 === 0) {
            this.spawnBoss();
        }
    }

    private spawnBoss(): void {
        const bossTypes: Array<'demon' | 'golem' | 'specter'> = ['demon', 'golem', 'specter'];
        const bossType = bossTypes[Math.floor((this.wave / 5 - 1) % 3)];
        
        const spawnDistance = 500;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const x = this.player.x + Math.cos(angle) * spawnDistance;
        const y = this.player.y + Math.sin(angle) * spawnDistance;
        
        const boss = new Boss(this, x, y, bossType, this.wave);
        this.bosses.add(boss);
        this.bossActive = true;

        // Warning text
        const warningText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, `⚠️ ${boss.bossName} APPROACHES! ⚠️`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4,
        });
        warningText.setOrigin(0.5);
        warningText.setScrollFactor(0);
        warningText.setDepth(200);

        this.tweens.add({
            targets: warningText,
            alpha: 0,
            y: GAME_HEIGHT / 2 - 150,
            duration: 2000,
            onComplete: () => warningText.destroy(),
        });
    }

    private bulletHitBoss(bullet: any, boss: any): void {
        bullet.destroy();
        createDamageNumber(this, boss.x, boss.y - 40, this.player.damage);

        const killed = boss.takeDamage(this.player.damage);
        if (killed) {
            this.score += boss.scoreValue;
            this.killCount++;

            // Death particles
            createDeathParticles(this, boss.x, boss.y, boss.bossColor, 20);

            // Spawn multiple XP gems
            for (let i = 0; i < 5; i++) {
                const offsetX = Phaser.Math.Between(-50, 50);
                const offsetY = Phaser.Math.Between(-50, 50);
                const gem = new XPGem(this, boss.x + offsetX, boss.y + offsetY, Math.floor(boss.xpValue / 5));
                this.xpGems.add(gem);
            }

            // Guaranteed health pickup
            const pickup = new HealthPickup(this, boss.x, boss.y);
            this.healthPickups.add(pickup);
        }
    }

    private playerHitBoss(_player: any, boss: any): void {
        if (this.player.takeDamage(boss.damage)) {
            this.gameOver();
        }
    }

    private bulletHitEnemy(bullet: any, enemy: any): void {
        bullet.destroy();

        createDamageNumber(this, enemy.x, enemy.y - 20, this.player.damage);

        const killed = enemy.takeDamage(this.player.damage);
        if (killed) {
            this.score += enemy.scoreValue;
            this.killCount++;

            // Death particles
            createDeathParticles(this, enemy.x, enemy.y, enemy.enemyColor, 10);

            // Spawn XP gem
            const gem = new XPGem(this, enemy.x, enemy.y, enemy.xpValue);
            this.xpGems.add(gem);

            // Chance to spawn health pickup (5%)
            if (Math.random() < 0.05) {
                const pickup = new HealthPickup(this, enemy.x, enemy.y);
                this.healthPickups.add(pickup);
            }
        }
    }

    private playerHitEnemy(_player: any, enemy: any): void {
        if (this.player.takeDamage(enemy.damage)) {
            this.gameOver();
        }
        createDeathParticles(this, enemy.x, enemy.y, enemy.enemyColor, 6);
        // enemy.destroy();
    }

    private collectXP(_player: any, gem: any): void {
        createXPPopup(this, gem.x, gem.y, gem.value);
        this.player.gainXP(gem.value);
        gem.destroy();
    }

    private collectHealth(_player: any, pickup: any): void {
        const healAmount = Math.floor(this.player.maxHealth * 0.25);
        this.player.health = Math.min(this.player.maxHealth, this.player.health + healAmount);

        // Heal popup
        const text = this.add.text(pickup.x, pickup.y, `+${healAmount} HP`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#44ff44',
            stroke: '#000000',
            strokeThickness: 2,
        });
        text.setOrigin(0.5);
        text.setDepth(20);
        this.tweens.add({
            targets: text,
            y: pickup.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy(),
        });

        pickup.destroy();
    }

    private showUpgradeSelection(): void {
        this.isPaused = true;
        this.physics.pause();
        this.scene.launch('UpgradeScene', {gameScene: this});
    }

    resumeFromUpgrade(): void {
        this.isPaused = false;
        this.physics.resume();
    }

    pauseGame(): void {
        if (this.isPaused) return;
        this.isPaused = true;
        this.physics.pause();
        this.scene.launch('PauseScene', {gameScene: this});
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

        // Cleanup weapons
        if (this.orbitShield) this.orbitShield.destroy();
        if (this.explosiveAura) this.explosiveAura.destroy();

        this.scene.stop('HUDScene');
        this.scene.start('GameOverScene', {
            score: this.score, 
            wave: this.wave, 
            kills: this.killCount,
            coinsEarned: this.coinsEarned
        });
    }

    private initializeWeapons(): void {
        // Initialize unlocked weapons from meta progression
        if (this.meta.unlockedWeapons.includes('orbit_shield')) {
            this.orbitShield = new OrbitShield(this, this.player);
            this.orbitShield.addShield();
        }
        
        if (this.meta.unlockedWeapons.includes('lightning')) {
            this.lightning = new LightningStrike(this, 30, 3, 150);
        }
        
        if (this.meta.unlockedWeapons.includes('explosive_aura')) {
            this.explosiveAura = new ExplosiveAura(this, this.player);
            this.explosiveAura.activate();
        }
    }

    private updateWeapons(time: number, delta: number): void {
        // Update orbit shield
        if (this.orbitShield) {
            this.orbitShield.update(time, delta);
            
            // Check collisions with enemies
            const shieldPositions = this.orbitShield.getShieldPositions();
            shieldPositions.forEach(pos => {
                this.enemies.getChildren().forEach((enemyObj: any) => {
                    if (!enemyObj.active) return;
                    const distance = Phaser.Math.Distance.Between(pos.x, pos.y, enemyObj.x, enemyObj.y);
                    if (distance < 30) {
                        createDamageNumber(this, enemyObj.x, enemyObj.y - 20, this.orbitShield!.getDamage());
                        const killed = enemyObj.takeDamage(this.orbitShield!.getDamage());
                        if (killed) {
                            this.handleEnemyKill(enemyObj);
                        }
                    }
                });
            });
        }

        // Update lightning
        if (this.lightning) {
            this.lightningTimer += delta;
            if (this.lightningTimer >= this.lightningCooldown && this.enemies.getLength() > 0) {
                this.lightningTimer = 0;
                this.lightning.strike(this.player.x, this.player.y, this.enemies);
            }
        }

        // Update explosive aura
        if (this.explosiveAura) {
            const auraKills = this.explosiveAura.update(time, this.enemies);
            this.killCount += auraKills;
        }
    }

    private handleEnemyKill(enemy: any): void {
        this.score += enemy.scoreValue;
        this.killCount++;
        this.coinsEarned += Math.floor(enemy.scoreValue / 10);

        // Death particles
        createDeathParticles(this, enemy.x, enemy.y, enemy.enemyColor, 10);

        // Spawn XP gem with multiplier
        const xpValue = Math.floor(enemy.xpValue * this.xpMultiplier);
        const gem = new XPGem(this, enemy.x, enemy.y, xpValue);
        this.xpGems.add(gem);
    }
}
