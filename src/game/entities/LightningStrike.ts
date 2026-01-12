import Phaser from 'phaser';

export class LightningStrike {
  private scene: Phaser.Scene;
  private damage: number;
  private chainCount: number;
  private chainRange: number;

  constructor(scene: Phaser.Scene, damage: number = 30, chainCount: number = 3, chainRange: number = 150) {
    this.scene = scene;
    this.damage = damage;
    this.chainCount = chainCount;
    this.chainRange = chainRange;
  }

  strike(startX: number, startY: number, enemies: Phaser.GameObjects.Group): number {
    let hitCount = 0;
    const hitEnemies: Set<Phaser.GameObjects.GameObject> = new Set();
    let currentX = startX;
    let currentY = startY;

    for (let chain = 0; chain < this.chainCount; chain++) {
      // Find nearest unhit enemy
      let nearestEnemy: any = null;
      let nearestDistance = this.chainRange;

      enemies.getChildren().forEach((enemy: any) => {
        if (hitEnemies.has(enemy) || !enemy.active) return;
        
        const distance = Phaser.Math.Distance.Between(currentX, currentY, enemy.x, enemy.y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      // Draw lightning effect
      this.drawLightning(currentX, currentY, nearestEnemy.x, nearestEnemy.y);

      // Deal damage
      const killed = nearestEnemy.takeDamage(this.damage);
      hitEnemies.add(nearestEnemy);
      hitCount++;

      // Update position for next chain
      currentX = nearestEnemy.x;
      currentY = nearestEnemy.y;

      // Flash effect on hit
      this.scene.cameras.main.flash(50, 100, 150, 255);
    }

    return hitCount;
  }

  private drawLightning(x1: number, y1: number, x2: number, y2: number): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(15);

    // Main bolt
    graphics.lineStyle(4, 0x4488ff, 1);
    
    // Create jagged path
    const segments = 6;
    const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = x1 + (x2 - x1) * t;
      const baseY = y1 + (y2 - y1) * t;
      const offset = (Math.random() - 0.5) * 30;
      points.push({
        x: baseX + offset,
        y: baseY + offset,
      });
    }
    points.push({ x: x2, y: y2 });

    // Draw main bolt
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();

    // Glow effect
    graphics.lineStyle(8, 0x88ccff, 0.4);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();

    // Impact flash
    const flash = this.scene.add.circle(x2, y2, 20, 0x4488ff, 0.8);
    flash.setDepth(16);

    // Fade out
    this.scene.tweens.add({
      targets: [graphics, flash],
      alpha: 0,
      duration: 200,
      onComplete: () => {
        graphics.destroy();
        flash.destroy();
      },
    });
  }

  setDamage(damage: number): void {
    this.damage = damage;
  }

  setChainCount(count: number): void {
    this.chainCount = count;
  }
}
