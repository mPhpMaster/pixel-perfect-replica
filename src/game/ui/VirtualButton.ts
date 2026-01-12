import Phaser from 'phaser';

export class VirtualButton {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Arc;
  private text: Phaser.GameObjects.Text;
  private callback: () => void;

  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    radius: number, 
    color: number, 
    label: string, 
    callback: () => void
  ) {
    this.scene = scene;
    this.callback = callback;

    // Background
    this.bg = scene.add.circle(0, 0, radius, color, 0.6);
    this.bg.setStrokeStyle(3, 0xffffff, 0.8);

    // Label
    this.text = scene.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff',
    });
    this.text.setOrigin(0.5);

    // Container
    this.container = scene.add.container(x, y, [this.bg, this.text]);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setSize(radius * 2, radius * 2);

    // Interaction
    this.container.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains);
    
    this.container.on('pointerdown', this.onPointerDown, this);
    this.container.on('pointerup', this.onPointerUp, this);
    this.container.on('pointerout', this.onPointerUp, this);
  }

  private onPointerDown(): void {
    this.bg.setAlpha(0.9);
    this.container.setScale(0.9);
    this.callback();
  }

  private onPointerUp(): void {
    this.bg.setAlpha(0.6);
    this.container.setScale(1.0);
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  public destroy(): void {
    this.container.destroy();
  }
}
