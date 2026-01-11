import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private speed = 600;
  private lifespan = 2000;
  private spawnTime: number;

  constructor(scene: Phaser.Scene, x: number, y: number, angle: number) {
    super(scene, x, y, 'bullet');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spawnTime = scene.time.now;
    this.setDepth(8);

    // Set velocity based on angle
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed
    );

    // Trail effect
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  update(): void {
    // Destroy after lifespan
    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      this.destroy();
    }
  }
}
