import Phaser from 'phaser';

export class XPGem extends Phaser.Physics.Arcade.Sprite {
  value: number;
  magnetDistance = 150; // Increased range
  private magnetSpeed = 500; // Faster flow
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private floatTween: Phaser.Tweens.Tween | null = null;
  private lastTrailTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'xp_gem');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;
    this.setDepth(3);
    this.setScale(0);

    // Scatter/Flow out animation on spawn
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(15, 40);
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    // Initial pop and scatter
    scene.tweens.add({
      targets: this,
      scale: 1,
      x: targetX,
      y: targetY,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Float animation (bobbing)
    this.floatTween = scene.tweens.add({
      targets: this,
      y: '+=8',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(200, 600),
    });

    // Gentle rotation for "flowy" feel
    scene.tweens.add({
      targets: this,
      angle: { from: -10, to: 10 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 1000),
    });

    // Add glow
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  update(time: number, delta: number): void {
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
        
        // Accelerate towards player
        const speed = this.magnetSpeed;
        
        body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );

        // Create flow trail
        if (time > this.lastTrailTime + 50) {
            this.createTrail();
            this.lastTrailTime = time;
        }

      } else {
        // Reset depth and stop moving if out of range
        if (this.depth === 11) this.setDepth(3);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
      }
    }
  }

  private createTrail(): void {
      const trail = this.scene.add.image(this.x, this.y, 'xp_gem');
      trail.setTint(0xaa44ff);
      trail.setAlpha(0.4);
      trail.setScale(this.scale);
      trail.setRotation(this.rotation);
      trail.setBlendMode(Phaser.BlendModes.ADD);
      trail.setDepth(10);

      this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.1,
          duration: 300,
          onComplete: () => trail.destroy()
      });
  }
}
