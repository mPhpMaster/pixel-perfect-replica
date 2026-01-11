import Phaser from 'phaser';

export class XPGem extends Phaser.Physics.Arcade.Sprite {
  value: number;
  private magnetDistance = 100;
  private magnetSpeed = 300;
  private player: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'xp_gem');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;
    this.setDepth(3);

    // Spawn animation - pop up
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scale: 1,
      y: y - 20,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Float animation
    scene.tweens.add({
      targets: this,
      y: '+=5',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200,
    });

    // Add glow
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  update(): void {
    if (!this.player) {
      const gameScene = this.scene as any;
      if (gameScene.player) {
        this.player = gameScene.player;
      }
    }

    if (this.player && this.active) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
      
      // Magnet effect when close to player
      if (distance < this.magnetDistance) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
        const body = this.body as Phaser.Physics.Arcade.Body;
        const speed = this.magnetSpeed * (1 - distance / this.magnetDistance);
        body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
      }
    }
  }
}
