import Phaser from 'phaser';
import { Bullet } from './Bullet';

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = 100;
  maxHealth = 100;
  speed = 200;
  damage = 25;
  attackSpeed = 500; // ms between attacks
  attackRange = 400;
  xp = 0;
  xpToNextLevel = 100;
  level = 1;
  
  private lastAttackTime = 0;
  private invulnerable = false;
  private invulnerabilityTime = 500;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setScale(1.2);
    this.setDepth(10);

    // Player body setup
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(20, 4, 4);
  }

  move(dirX: number, dirY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // Normalize diagonal movement
    let vx = dirX * this.speed;
    let vy = dirY * this.speed;
    
    if (dirX !== 0 && dirY !== 0) {
      const factor = 1 / Math.sqrt(2);
      vx *= factor;
      vy *= factor;
    }

    body.setVelocity(vx, vy);

    // Flip sprite based on direction
    if (dirX < 0) this.setFlipX(true);
    else if (dirX > 0) this.setFlipX(false);
  }

  autoAttack(enemies: Phaser.GameObjects.Group, bullets: Phaser.GameObjects.Group, time: number): void {
    if (time - this.lastAttackTime < this.attackSpeed) return;

    // Find nearest enemy
    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDistance = this.attackRange;

    enemies.getChildren().forEach((enemy: any) => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      this.lastAttackTime = time;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
      const bullet = new Bullet(this.scene, this.x, this.y, angle);
      bullets.add(bullet);

      // Muzzle flash effect
      this.scene.cameras.main.shake(30, 0.002);
    }
  }

  takeDamage(amount: number): boolean {
    if (this.invulnerable) return false;

    this.health -= amount;
    this.invulnerable = true;

    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);

    this.scene.time.delayedCall(this.invulnerabilityTime, () => {
      this.invulnerable = false;
    });

    return this.health <= 0;
  }

  gainXP(amount: number): void {
    this.xp += amount;
    
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.level++;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
    
    // Stat increases
    this.maxHealth += 10;
    this.health = Math.min(this.health + 20, this.maxHealth);
    this.damage += 5;
    this.attackSpeed = Math.max(200, this.attackSpeed - 20);

    // Level up flash
    this.scene.cameras.main.flash(300, 170, 51, 255, false);
  }

  update(time: number, delta: number): void {
    // Invulnerability blink effect
    if (this.invulnerable) {
      this.alpha = Math.sin(time * 0.02) > 0 ? 1 : 0.5;
    } else {
      this.alpha = 1;
    }
  }
}
