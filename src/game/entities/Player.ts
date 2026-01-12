import Phaser from 'phaser';
import { Bullet } from './Bullet';
import { createLevelUpEffect } from './Particle';

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
  projectileCount = 1;
  magnetRange = 100;
  
  // Dash stats
  dashSpeedMultiplier = 10;
  dashDuration = 100;
  dashCooldown = 1000;
  lastDashTime = 0;
  isDashing = false;
  private dashDirection = new Phaser.Math.Vector2(0, 0);

  private lastAttackTime = 0;
  private invulnerable = false;
  private invulnerabilityTime = 500;
  pendingLevelUp = false;

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

      if (this.isDashing) {
          body.setVelocity(
              this.dashDirection.x * this.speed * this.dashSpeedMultiplier,
              this.dashDirection.y * this.speed * this.dashSpeedMultiplier
          );
          this.createDashTrail();
          return;
      }

      if (dirX === 0 && dirY === 0) {
          body.setVelocity(0, 0);
          return;
      }

      // Normalize and scale to speed
      const velocity = new Phaser.Math.Vector2(dirX, dirY).normalize().scale(this.speed);
      body.setVelocity(velocity.x, velocity.y);

      // Flip sprite based on direction
      if (dirX < 0) this.setFlipX(true);
      else if (dirX > 0) this.setFlipX(false);
  }

  attemptDash(dirX: number, dirY: number): boolean {
      const time = this.scene.time.now;
      if (time - this.lastDashTime < this.dashCooldown || this.isDashing) return false;

      // Determine dash direction
      if (dirX === 0 && dirY === 0) {
          // If not moving, dash in facing direction
          dirX = this.flipX ? -1 : 1;
          dirY = 0;
      }

      this.isDashing = true;
      this.lastDashTime = time;
      this.dashDirection.set(dirX, dirY).normalize();
      
      // Invulnerable during dash
      this.invulnerable = true;

      // Dash sound or effect could go here

      this.scene.time.delayedCall(this.dashDuration, () => {
          this.isDashing = false;
          this.invulnerable = false;
          // Friction/slowdown after dash
          const body = this.body as Phaser.Physics.Arcade.Body;
          body.velocity.scale(0.5);
      });

      return true;
  }

  private createDashTrail(): void {
      // Create a ghost trail
      if (this.scene.time.now % 50 < 20) { // Limit frequency
          const trail = this.scene.add.image(this.x, this.y, 'player');
          trail.setTint(0x00ffff);
          trail.setAlpha(0.5);
          trail.setFlipX(this.flipX);
          trail.setScale(this.scale);
          trail.setDepth(9);
          
          this.scene.tweens.add({
              targets: trail,
              alpha: 0,
              duration: 300,
              onComplete: () => trail.destroy()
          });
      }
  }

  autoAttack(enemies: Phaser.GameObjects.Group, bullets: Phaser.GameObjects.Group, time: number): void {
    if (time - this.lastAttackTime < this.attackSpeed) return;

    // Find nearest enemy
    let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDistance = this.attackRange;

    enemies.getChildren().forEach((enemy: Phaser.Physics.Arcade.Sprite) => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      this.lastAttackTime = time;
      const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
      
      // Multi-shot spread
      const spreadAngle = 0.15; // radians
      const count = this.projectileCount;
      
      for (let i = 0; i < count; i++) {
        let angle = baseAngle;
        if (count > 1) {
          const offset = (i - (count - 1) / 2) * spreadAngle;
          angle = baseAngle + offset;
        }
        const bullet = new Bullet(this.scene, this.x, this.y, angle, this.damage);
        bullets.add(bullet);
      }

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
      // Only reset if not dashing (dash handles its own invulnerability reset)
      if (!this.isDashing) {
          this.invulnerable = false;
      }
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
    
    // Visual effect
    createLevelUpEffect(this.scene, this.x, this.y);
    
    // Trigger upgrade selection
    this.pendingLevelUp = true;
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
