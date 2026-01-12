import Phaser from 'phaser';

export class OrbitShield extends Phaser.GameObjects.Container {
  private shields: Phaser.GameObjects.Arc[] = [];
  private orbitRadius = 80;
  private rotationSpeed = 2; // radians per second
  private currentAngle = 0;
  private damage = 15;
  private shieldCount = 0;
  private player: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, player: Phaser.Physics.Arcade.Sprite) {
    super(scene, player.x, player.y);
    this.player = player;
    scene.add.existing(this);
    this.setDepth(9);
  }

  addShield(): void {
    this.shieldCount++;
    this.rebuildShields();
  }

  private rebuildShields(): void {
    // Clear existing
    this.shields.forEach(s => s.destroy());
    this.shields = [];

    // Create new shields evenly distributed
    for (let i = 0; i < this.shieldCount; i++) {
      const shield = this.scene.add.circle(0, 0, 15, 0x00d4aa, 0.9);
      shield.setStrokeStyle(3, 0x00ffcc, 1);
      
      // Add glow effect
      const glow = this.scene.add.circle(0, 0, 20, 0x00d4aa, 0.3);
      this.add(glow);
      this.add(shield);
      
      this.shields.push(shield);
    }
  }

  setDamage(damage: number): void {
    this.damage = damage;
  }

  getDamage(): number {
    return this.damage;
  }

  getShieldCount(): number {
    return this.shieldCount;
  }

  update(time: number, delta: number): void {
    // Follow player
    this.setPosition(this.player.x, this.player.y);

    // Rotate shields
    this.currentAngle += this.rotationSpeed * (delta / 1000);

    // Position each shield in orbit
    for (let i = 0; i < this.shields.length; i++) {
      const angle = this.currentAngle + (i * (Math.PI * 2) / this.shieldCount);
      const x = Math.cos(angle) * this.orbitRadius;
      const y = Math.sin(angle) * this.orbitRadius;
      
      // Shield and glow are paired (glow at i*2, shield at i*2+1)
      const glowIndex = i * 2;
      const shieldIndex = i * 2 + 1;
      
      if (this.list[glowIndex]) {
        (this.list[glowIndex] as Phaser.GameObjects.Arc).setPosition(x, y);
      }
      if (this.list[shieldIndex]) {
        (this.list[shieldIndex] as Phaser.GameObjects.Arc).setPosition(x, y);
      }
    }
  }

  getShieldPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < this.shields.length; i++) {
      const angle = this.currentAngle + (i * (Math.PI * 2) / this.shieldCount);
      positions.push({
        x: this.player.x + Math.cos(angle) * this.orbitRadius,
        y: this.player.y + Math.sin(angle) * this.orbitRadius,
      });
    }
    return positions;
  }
}
