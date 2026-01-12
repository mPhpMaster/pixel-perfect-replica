import Phaser from 'phaser';

export class ExplosiveAura {
  private scene: Phaser.Scene;
  private player: Phaser.Physics.Arcade.Sprite;
  private damage = 20;
  private radius = 120;
  private cooldown = 3000;
  private lastTriggerTime = 0;
  private isActive = false;
  private auraGraphics: Phaser.GameObjects.Graphics;
  private pulseCircle: Phaser.GameObjects.Arc | null = null;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.player = player;
    
    // Create aura visual
    this.auraGraphics = scene.add.graphics();
    this.auraGraphics.setDepth(4);
  }

  activate(): void {
    this.isActive = true;
  }

  setDamage(damage: number): void {
    this.damage = damage;
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  setCooldown(cooldown: number): void {
    this.cooldown = cooldown;
  }

  update(time: number, enemies: Phaser.GameObjects.Group): number {
    if (!this.isActive) return 0;

    // Draw passive aura
    this.auraGraphics.clear();
    this.auraGraphics.lineStyle(2, 0xff4400, 0.3);
    this.auraGraphics.strokeCircle(this.player.x, this.player.y, this.radius);
    
    // Pulsing inner circle
    const pulseSize = Math.sin(time * 0.005) * 10 + this.radius - 20;
    this.auraGraphics.lineStyle(1, 0xff6600, 0.2);
    this.auraGraphics.strokeCircle(this.player.x, this.player.y, pulseSize);

    // Check cooldown
    if (time - this.lastTriggerTime < this.cooldown) return 0;

    // Count enemies in range
    let enemiesInRange = 0;
    enemies.getChildren().forEach((enemy: any) => {
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      if (distance <= this.radius) {
        enemiesInRange++;
      }
    });

    // Trigger explosion if enemies nearby
    if (enemiesInRange >= 3) {
      return this.explode(time, enemies);
    }

    return 0;
  }

  private explode(time: number, enemies: Phaser.GameObjects.Group): number {
    this.lastTriggerTime = time;
    let killCount = 0;

    // Visual explosion
    const explosion = this.scene.add.circle(this.player.x, this.player.y, 10, 0xff4400, 0.8);
    explosion.setDepth(15);
    
    this.scene.tweens.add({
      targets: explosion,
      radius: this.radius,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => explosion.destroy(),
    });

    // Screen shake
    this.scene.cameras.main.shake(200, 0.015);

    // Damage enemies
    enemies.getChildren().forEach((enemy: any) => {
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );
      if (distance <= this.radius) {
        const killed = enemy.takeDamage(this.damage);
        if (killed) killCount++;
      }
    });

    // Ring particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.player.x + Math.cos(angle) * 30,
        this.player.y + Math.sin(angle) * 30,
        5, 0xff6600, 1
      );
      particle.setDepth(16);
      
      this.scene.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * this.radius,
        y: this.player.y + Math.sin(angle) * this.radius,
        alpha: 0,
        scale: 0.2,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }

    return killCount;
  }

  destroy(): void {
    this.auraGraphics.destroy();
    if (this.pulseCircle) this.pulseCircle.destroy();
  }
}
