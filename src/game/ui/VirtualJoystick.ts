import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Arc;
  private stick: Phaser.GameObjects.Arc;
  private baseX: number;
  private baseY: number;
  private radius = 120;
  private isActive = false;
  private currentPointer: Phaser.Input.Pointer | null = null;
  
  // Output
  public forceX = 0;
  public forceY = 0;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.baseX = x;
    this.baseY = y;
    
    // Create joystick base
    this.base = scene.add.circle(x, y, this.radius, 0x1a1a3e, 0.6);
    this.base.setStrokeStyle(3, 0x00d4aa, 0.8);
    this.base.setScrollFactor(0);
    this.base.setDepth(1000);
    
    // Create joystick stick
    this.stick = scene.add.circle(x, y, 60, 0x00d4aa, 0.8);
    this.stick.setScrollFactor(0);
    this.stick.setDepth(1001);
    
    // Make interactive
    this.base.setInteractive();
    
    // Touch events
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }
  
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Only respond to touches on the left side of the screen
    if (pointer.x < this.scene.cameras.main.width * 0.4) {
      this.isActive = true;
      this.currentPointer = pointer;
      
      // Move base to touch position
      this.baseX = pointer.x;
      this.baseY = pointer.y;
      this.base.setPosition(this.baseX, this.baseY);
      this.stick.setPosition(this.baseX, this.baseY);
    }
  }
  
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isActive || pointer !== this.currentPointer) return;
    
    // Calculate distance from base
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Constrain stick to radius
    if (distance > this.radius) {
      const angle = Math.atan2(dy, dx);
      this.stick.x = this.baseX + Math.cos(angle) * this.radius;
      this.stick.y = this.baseY + Math.sin(angle) * this.radius;
      
      // Normalized force
      this.forceX = Math.cos(angle);
      this.forceY = Math.sin(angle);
    } else {
      this.stick.x = pointer.x;
      this.stick.y = pointer.y;
      
      // Proportional force
      this.forceX = dx / this.radius;
      this.forceY = dy / this.radius;
    }
  }
  
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer !== this.currentPointer) return;
    
    this.isActive = false;
    this.currentPointer = null;
    
    // Reset stick position
    this.stick.setPosition(this.baseX, this.baseY);
    this.forceX = 0;
    this.forceY = 0;
  }
  
  public setVisible(visible: boolean): void {
    this.base.setVisible(visible);
    this.stick.setVisible(visible);
  }
  
  public destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.base.destroy();
    this.stick.destroy();
  }
}
