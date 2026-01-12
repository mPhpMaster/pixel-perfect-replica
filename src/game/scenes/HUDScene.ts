import Phaser from 'phaser';
import {GameScene} from './GameScene';
import {GAME_HEIGHT, GAME_WIDTH} from "@/game/config.ts";

export class HUDScene extends Phaser.Scene {
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthText!: Phaser.GameObjects.Text;
    private xpBar!: Phaser.GameObjects.Graphics;
    private levelText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;
    private waveTimerBar!: Phaser.GameObjects.Graphics;
    private scoreText!: Phaser.GameObjects.Text;
    private bossHealthBar!: Phaser.GameObjects.Graphics;
    private bossNameText!: Phaser.GameObjects.Text;
    private statsText!: Phaser.GameObjects.Text;
    private pauseButton!: Phaser.GameObjects.Container;
    private mobileHint?: Phaser.GameObjects.Text;
    private gameScene!: GameScene;
    private isMobile = false;

    constructor() {
        super({key: 'HUDScene'});
    }

    init(data: { gameScene: GameScene }): void {
        this.gameScene = data.gameScene;
        this.isMobile = this.sys.game.device.input.touch;
    }

    create(): void {
        const {width, height} = this.cameras.main;

        // Health bar (top-left)
        this.healthBar = this.add.graphics();
        this.healthText = this.add.text(20, 20, 'HP: 100/100', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ff6666',
        });

        // Stats display (below health bar)
        this.statsText = this.add.text(20, 50 + 20, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '8px',
            color: '#cccccc',
            lineSpacing: 4,
        });

        // XP bar (bottom of screen)
        this.xpBar = this.add.graphics();
        this.levelText = this.add.text(20, height - 40, 'LVL 1', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#aa44ff',
        });

        // Wave info (top-right)
        this.waveText = this.add.text(width - 35, 20, 'WAVE 1', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#00d4aa',
        }).setOrigin(1.6, 0);

        this.waveTimerBar = this.add.graphics();

        // Score (top-center)
        this.scoreText = this.add.text(width / 2, 20, 'SCORE: 0', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#ffaa00',
        }).setOrigin(0.5, 0);

        // Pause button
        this.pauseButton = this.createButton(width - 45, 35, '||', () => {
            this.gameScene.pauseGame();
        }, this.getResponsiveButtonSize());

        // Boss Health Bar (Bottom Left)
        this.bossHealthBar = this.add.graphics();
        this.bossNameText = this.add.text(20, height - 60, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3,
        });
        this.bossNameText.setVisible(false);

        // Mobile controls hint
        if (this.isMobile) {
            // 120, GAME_HEIGHT - 140
            // JOYSTICK RADIOS = 120
            this.mobileHint = this.add.text(GAME_WIDTH - (GAME_WIDTH - 136) + 140, height - 190, '← JOYSTICK | DOUBLE TAP TO DASH', {
                fontFamily: '"Press Start 2P"',
                fontSize: '14px',
                color: '#00d4aa',
            });
            this.mobileHint.setAlpha(0.5);
            this.tweens.add({
                targets: this.mobileHint,
                alpha: 0,
                delay: 3000,
                duration: 1000,
            });
        }

        // Handle resize
        this.scale.on('resize', this.handleResize, this);

        // Listen for updates
        this.gameScene.events.on('updateHUD', this.updateHUD, this);
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.main.setViewport(0, 0, width, height);

        if (this.waveText) this.waveText.setPosition(width - 20, 20);
        if (this.scoreText) this.scoreText.setPosition(width / 2, 20);
        if (this.pauseButton) this.pauseButton.setPosition(width - 45, 35);
        if (this.levelText) this.levelText.setPosition(20, height - 40);
        if (this.mobileHint) this.mobileHint.setPosition(20, height - 50);
        if (this.bossNameText) this.bossNameText.setPosition(20, height - 60);
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
        kills?: number;
        bossActive?: boolean;
        bossHealth?: number;
        bossMaxHealth?: number;
        bossName?: string;
        bossColor?: number;
        damage?: number;
        speed?: number;
        projectiles?: number;
        attackSpeed?: number;
    }): void {
        const {width, height} = this.cameras.main;

        // Health bar
        this.healthBar.clear();
        this.healthBar.fillStyle(0x331111, 1);
        this.healthBar.fillRoundedRect(20, 40, 200, 20, 4);

        // Health color based on percentage
        const healthPercent = data.health / data.maxHealth;
        let healthColor = 0xff4444;
        if (healthPercent < 0.3) healthColor = 0xff2222;
        else if (healthPercent > 0.7) healthColor = 0x44ff44;

        this.healthBar.fillStyle(healthColor, 1);
        const healthWidth = healthPercent * 196;
        this.healthBar.fillRoundedRect(22, 42, Math.max(0, healthWidth), 16, 3);
        this.healthText.setText(`HP: ${Math.floor(data.health)}/${data.maxHealth}`);

        // Update stats text
        if (data.damage !== undefined) {
            const attackSpeedText = data.attackSpeed ? `${(1000 / data.attackSpeed).toFixed(1)}/s` : '-';
            this.statsText.setText(
                `DMG: ${data.damage}\n` +
                `SPD: ${data.speed}\n` +
                `PROJ: ${data.projectiles}\n` +
                `ATK SPD: ${attackSpeedText}`
            );
        }

        // XP bar
        this.xpBar.clear();
        this.xpBar.fillStyle(0x1a1a3e, 1);
        this.xpBar.fillRect(0, height - 20, width, 20);
        this.xpBar.fillStyle(0x9933ff, 1);
        const xpWidth = (data.xp / data.xpToLevel) * width;
        this.xpBar.fillRect(0, height - 20, xpWidth, 20);
        this.levelText.setText(`LVL ${data.level}`);

        // Wave info
        this.waveText.setText(`WAVE ${data.wave}`);
        this.waveTimerBar.clear();
        this.waveTimerBar.fillStyle(0x1a1a3e, 1);
        this.waveTimerBar.fillRoundedRect(width - 228 - this.getResponsiveButtonSize(), 45, 200, 10, 3);
        this.waveTimerBar.fillStyle(0x00d4aa, 1);
        this.waveTimerBar.fillRoundedRect(width - 228 - this.getResponsiveButtonSize(), 47, 196 * data.waveProgress, 6, 2);

        // Score with kills
        const killsDisplay = data.kills !== undefined ? ` | KILLS: ${data.kills}` : '';
        this.scoreText.setText(`SCORE: ${data.score}${killsDisplay}`);

        // Boss Health Bar
        this.bossHealthBar.clear();
        if (data.bossActive && data.bossHealth !== undefined && data.bossMaxHealth !== undefined) {
            const barWidth = 300;
            const barHeight = 20;
            const x = 20;
            const y = height - 40;

            // Background
            this.bossHealthBar.fillStyle(0x330000, 0.8);
            this.bossHealthBar.fillRoundedRect(x, y, barWidth, barHeight, 4);

            // Border
            this.bossHealthBar.lineStyle(2, 0xff4444, 1);
            this.bossHealthBar.strokeRoundedRect(x, y, barWidth, barHeight, 4);

            // Health fill
            const bossHealthPercent = Math.max(0, data.bossHealth / data.bossMaxHealth);
            this.bossHealthBar.fillStyle(data.bossColor || 0xff0000, 1);
            this.bossHealthBar.fillRoundedRect(x + 2, y + 2, (barWidth - 4) * bossHealthPercent, barHeight - 4, 3);

            this.bossNameText.setText(data.bossName || 'BOSS');
            this.bossNameText.setPosition(x, y - 15);
            this.bossNameText.setVisible(true);
        } else {
            this.bossNameText.setVisible(false);
        }
    }

    shutdown(): void {
        this.gameScene.events.off('updateHUD', this.updateHUD, this);
        this.scale.off('resize', this.handleResize, this);
    }

    private createButton(x: number, y: number, text: string, callback: () => void, size: number = HUDScene.getWebButtonSize()): Phaser.GameObjects.Container {
        const width = size;
        const height = size * 0.7;
        const radius = 11;

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x1a1a3e, 1);
        buttonBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        buttonBg.lineStyle(2, 0x00d4aa, 1);
        buttonBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

        const buttonText = this.add.text(0, 0, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#00d4aa',
            padding: {x: 10, y: 10},
        });
        buttonText.setOrigin(0.5);

        const container = this.add.container(x, y, [buttonBg, buttonText]);
        container.setSize(width, height);
        container.setInteractive();

        container.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x00d4aa, 0.2);
            buttonBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
            buttonBg.lineStyle(3, 0x00ffcc, 1);
            buttonBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
            buttonText.setColor('#00ffcc');
        });

        container.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x1a1a3e, 1);
            buttonBg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
            buttonBg.lineStyle(2, 0x00d4aa, 1);
            buttonBg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
            buttonText.setColor('#00d4aa');
        });

        container.on('pointerdown', callback);

        return container;
    }

    // smaller for web
    static getWebButtonSize(): number {
        return 60;
    }

    // larger for mobile
    static getMobileButtonSize(): number {
        return 80;
    }

    // Button - larger for mobile
    private getResponsiveButtonSize(): number {
        return this.isMobile ? HUDScene.getMobileButtonSize() : HUDScene.getWebButtonSize();
    }
}
