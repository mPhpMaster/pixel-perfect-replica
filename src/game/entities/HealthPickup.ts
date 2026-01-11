import Phaser from 'phaser';

export class HealthPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'health_pickup');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(3);

    // Spawn animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Pulsing glow
    scene.tweens.add({
      targets: this,
      scale: { from: 1.2, to: 1.4 },
      alpha: { from: 1, to: 0.8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 300,
    });

    // Float animation
    scene.tweens.add({
      targets: this,
      y: '+=8',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  update(): void {
    // Health pickups don't chase player
  }
}
