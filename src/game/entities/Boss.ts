import Phaser from 'phaser';

type BossType = 'demon' | 'golem' | 'specter';

const BOSS_CONFIGS = {
    demon: {
        name: 'INFERNAL DEMON',
        health: 3000,
        speed: 50,
        damage: 40,
        scoreValue: 1000,
        xpValue: 500,
        scale: 1.8,
        color: 0xff2200,
        attackPattern: 'charge',
        attackCooldown: 3000,
    },
    golem: {
        name: 'STONE GOLEM',
        health: 5000,
        speed: 25,
        damage: 60,
        scoreValue: 1500,
        xpValue: 750,
        scale: 2,
        color: 0x886644,
        attackPattern: 'slam',
        attackCooldown: 3000,
    },
    specter: {
        name: 'SHADOW SPECTER',
        health: 10000,
        speed: 50,
        damage: 50,
        scoreValue: 2000,
        xpValue: 1000,
        scale: 2.5,
        color: 0x6622aa,
        attackPattern: 'teleport',
        attackCooldown: 7000,
    },
};

export class Boss extends Phaser.Physics.Arcade.Sprite {
    health: number;
    maxHealth: number;
    speed: number;
    damage: number;
    scoreValue: number;
    xpValue: number;
    bossColor: number;
    bossName: string;
    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private bossType: BossType;
    private attackPattern: string;
    private specialAttackTimer = 0;
    private specialAttackCooldown = 3000;
    private isAttacking = false;
    private healthBar!: Phaser.GameObjects.Graphics;
    private nameText!: Phaser.GameObjects.Text;
    private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, type: BossType = 'demon', wave: number = 5) {
        const config = BOSS_CONFIGS[type];
        super(scene, x, y, 'enemy_boss');

        this.bossType = type;
        this.bossName = config.name;
        this.attackPattern = config.attackPattern;
        this.specialAttackCooldown += config.attackCooldown;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Scale stats with wave
        const waveMultiplier = 1 + (wave - 5) * 0.15;
        this.health = Math.floor(config.health * waveMultiplier);
        this.maxHealth = this.health;
        this.speed = config.speed;
        this.damage = Math.floor(config.damage * waveMultiplier);
        this.scoreValue = Math.floor(config.scoreValue * waveMultiplier);
        this.xpValue = Math.floor(config.xpValue * waveMultiplier);
        this.bossColor = config.color;

        this.setScale(config.scale);
        this.setDepth(8);
        this.setTint(config.color);

        // Larger hitbox
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(30 * config.scale, 10, 10);

        // Spawn animation
        this.alpha = 0;
        this.setScale(0.5);
        scene.tweens.add({
            targets: this,
            alpha: 1,
            scale: config.scale,
            duration: 1000,
            ease: 'Back.easeOut',
        });

        // Create boss health bar
        this.createHealthBar();

        // Create particles
        this.particles = scene.add.particles(0, 0, 'flare', {
            speed: {min: 30, max: 80},
            scale: {start: 0.6, end: 0},
            alpha: {start: 0.8, end: 0},
            lifespan: 600,
            blendMode: 'ADD',
            tint: config.color,
            frequency: 100,
            follow: this,
        });

        // Screen shake on spawn
        scene.cameras.main.shake(500, 0.02);
    }

    private createHealthBar(): void {
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(100);

        this.nameText = this.scene.add.text(0, 0, this.bossName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3,
        });
        this.nameText.setOrigin(0.5);
        this.nameText.setDepth(100);
    }

    update(time: number, delta: number): void {
        if (!this.player) {
            const gameScene = this.scene as any;
            if (gameScene.player) {
                this.player = gameScene.player;
            }
        }

        if (this.player && this.active && !this.isAttacking) {
            // Move towards player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
            const body = this.body as Phaser.Physics.Arcade.Body;

            body.setVelocity(
                Math.cos(angle) * this.speed,
                Math.sin(angle) * this.speed
            );

            // Face direction of movement
            this.setFlipX(this.player.x < this.x);

            // Special attack
            this.specialAttackTimer += delta;
            if (this.specialAttackTimer >= this.specialAttackCooldown) {
                this.performSpecialAttack();
                this.specialAttackTimer = 0;
            }
        }

        // Update health bar position
        this.updateHealthBar();
    }

    private updateHealthBar(): void {
        const {width} = this.scene.cameras.main;
        const barWidth = 300;
        const barHeight = 20;
        const x = (width - barWidth) / 2;
        const y = 80;

        this.healthBar.clear();

        // Background
        this.healthBar.fillStyle(0x330000, 0.8);
        this.healthBar.fillRoundedRect(x, y, barWidth, barHeight, 4);

        // Border
        this.healthBar.lineStyle(2, 0xff4444, 1);
        this.healthBar.strokeRoundedRect(x, y, barWidth, barHeight, 4);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.fillStyle(this.bossColor, 1);
        this.healthBar.fillRoundedRect(x + 2, y + 2, (barWidth - 4) * healthPercent, barHeight - 4, 3);

        // Name text
        this.nameText.setPosition(width / 2, y - 15);
        this.nameText.setScrollFactor(0);
        this.healthBar.setScrollFactor(0);
    }

    private performSpecialAttack(): void {
        if (!this.player) return;

        this.isAttacking = true;

        switch (this.attackPattern) {
            case 'charge':
                this.chargeAttack();
                break;
            case 'slam':
                this.slamAttack();
                break;
            case 'teleport':
                this.teleportAttack();
                break;
        }
    }

    private chargeAttack(): void {
        if (!this.player) return;

        // Flash warning
        this.setTint(0xffffff);

        this.scene.time.delayedCall(500, () => {
            if (!this.active || !this.player) return;

            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
            const body = this.body as Phaser.Physics.Arcade.Body;

            body.setVelocity(
                Math.cos(angle) * this.speed * 8,
                Math.sin(angle) * this.speed * 8
            );

            this.setTint(this.bossColor);

            this.scene.time.delayedCall(600, () => {
                this.isAttacking = false;
            });
        });
    }

    private slamAttack(): void {
        // Jump up
        this.scene.tweens.add({
            targets: this,
            y: this.y - 100,
            scaleX: 2.8,
            scaleY: 2.2,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                if (!this.player) return;

                // Slam down at player position
                this.scene.tweens.add({
                    targets: this,
                    x: this.player.x,
                    y: this.player.y,
                    scaleX: 2.5,
                    scaleY: 2.5,
                    duration: 300,
                    ease: 'Power4.easeIn',
                    onComplete: () => {
                        // Shockwave effect
                        this.scene.cameras.main.shake(300, 0.03);

                        // Create shockwave particles
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2;
                            this.scene.tweens.add({
                                targets: {x: this.x, y: this.y},
                                x: this.x + Math.cos(angle) * 200,
                                y: this.y + Math.sin(angle) * 200,
                                duration: 300,
                            });
                        }

                        this.isAttacking = false;
                    },
                });
            },
        });
    }

    private teleportAttack(): void {
        if (!this.player) return;

        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (!this.player) return;

                // Teleport behind player
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y);
                this.x = this.player.x + Math.cos(angle) * 100;
                this.y = this.player.y + Math.sin(angle) * 100;

                // Fade in
                this.scene.tweens.add({
                    targets: this,
                    alpha: 1,
                    duration: 200,
                    onComplete: () => {
                        this.isAttacking = false;
                    },
                });
            },
        });
    }

    takeDamage(amount: number): boolean {
        this.health -= amount;

        // Hit flash
        if (this.active) {
            this.setTint(0xffffff);
            this.scene.time.delayedCall(50, () => {
                if (this.active) this.setTint(this.bossColor);
            });
        }

        // Minor knockback
        if (this.player && this.active) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y);
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Math.cos(angle) * 50,
                Math.sin(angle) * 50
            );
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    private die(): void {
        if (this.particles) {
            this.particles.stop();
            this.scene.time.delayedCall(1000, () => {
                if (this.particles) this.particles.destroy();
            });
        }

        // Epic death animation
        this.scene.cameras.main.flash(500, 255, 100, 0);
        this.scene.cameras.main.shake(500, 0.03);

        // Cleanup UI
        this.healthBar.destroy();
        this.nameText.destroy();

        // Death animation
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 3,
            duration: 500,
            onComplete: () => {
                this.destroy();
            },
        });
    }
}
