import Phaser from 'phaser';

export class XPGem extends Phaser.Physics.Arcade.Sprite {
  value: number;
  magnetDistance = 100;
  private magnetSpeed = 300;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private floatTween: Phaser.Tweens.Tween | null = null;

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
    this.floatTween = scene.tweens.add({
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
        // Stop floating animation when magnetized so physics can take over fully
        if (this.floatTween) {
            this.floatTween.stop();
            this.floatTween = null;
        }

        // Bring to front when flying towards player
        this.setDepth(11);

        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        // Constant speed to ensure it catches up
        const speed = this.magnetSpeed;
        
        body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
      } else {
        // Reset depth and stop moving if out of range
        this.setDepth(3);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
      }
    }
  }
}
