import Phaser from 'phaser';

type EnemyType = 'normal' | 'fast' | 'tank';

const ENEMY_CONFIGS = {
  normal: {
    texture: 'enemy',
    health: 50,
    speed: 80,
    damage: 10,
    scoreValue: 10,
    xpValue: 10,
    scale: 1,
    color: 0xff4444,
  },
  fast: {
    texture: 'enemy_fast',
    health: 30,
    speed: 150,
    damage: 5,
    scoreValue: 15,
    xpValue: 15,
    scale: 0.8,
    color: 0x9933ff,
  },
  tank: {
    texture: 'enemy_tank',
    health: 150,
    speed: 50,
    damage: 25,
    scoreValue: 25,
    xpValue: 25,
    scale: 1.2,
    color: 0xff8800,
  },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  health: number;
  speed: number;
  damage: number;
  scoreValue: number;
  xpValue: number;
  enemyColor: number;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private isStunned = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType = 'normal', wave: number = 1) {
    const config = ENEMY_CONFIGS[type];
    super(scene, x, y, config.texture);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Scale stats with wave
    const waveMultiplier = 1 + (wave - 1) * 0.1;
    this.health = Math.floor(config.health * waveMultiplier);
    this.speed = config.speed;
    this.damage = Math.floor(config.damage * waveMultiplier);
    this.scoreValue = Math.floor(config.scoreValue * waveMultiplier);
    this.xpValue = Math.floor(config.xpValue * waveMultiplier);
    this.enemyColor = config.color;

    this.setScale(config.scale);
    this.setDepth(5);

    // Spawn animation
    this.alpha = 0;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      scale: config.scale,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Special effects for fast enemy (Fire)
    if (type === 'fast') {
        // Fire particles
        this.particles = scene.add.particles(0, 0, 'flare', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: [0xffff00, 0xff4400], // Yellow to Red
            frequency: 50,
            follow: this,
            followOffset: { x: 0, y: 10 } // Emit from bottom
        });

        // Flickering animation
        scene.tweens.add({
            targets: this,
            scaleX: { from: config.scale, to: config.scale * 1.1 },
            scaleY: { from: config.scale, to: config.scale * 0.95 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
  }

  update(): void {
    if (!this.player) {
      // Find player in scene
      const gameScene = this.scene as any;
      if (gameScene.player) {
        this.player = gameScene.player;
      }
    }

    if (this.player && this.active && !this.isStunned) {
      // Move towards player
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );

      // Face direction of movement
      this.setFlipX(this.player.x < this.x);
    }
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;

    // Hit flash
    if (this.active) {
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.active) this.clearTint();
        });
    }

    // Knockback
    if (this.player && this.active) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.x, this.y);
      const body = this.body as Phaser.Physics.Arcade.Body;
      
      this.isStunned = true;
      body.setVelocity(
        Math.cos(angle) * 250,
        Math.sin(angle) * 250
      );

      // Reset stun
      this.scene.time.delayedCall(200, () => {
          if (this.active) this.isStunned = false;
      });
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
        // Let existing particles fade out
        this.scene.time.delayedCall(500, () => {
            if (this.particles) this.particles.destroy();
        });
    }

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 150,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
