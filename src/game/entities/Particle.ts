import Phaser from 'phaser';

export function createDeathParticles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number = 0xff4444,
  count: number = 8
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Phaser.Math.Between(100, 200);
    const size = Phaser.Math.Between(3, 8);

    const particle = scene.add.circle(x, y, size, color);
    particle.setDepth(15);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * speed,
      y: y + Math.sin(angle) * speed,
      alpha: 0,
      scale: 0.2,
      duration: Phaser.Math.Between(3000, 5000),
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }
}

export function createDamageNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  amount: number,
  color: string = '#ff4444'
): void {
  const text = scene.add.text(x, y, `${amount}`, {
    fontFamily: '"Press Start 2P"',
    fontSize: '12px',
    color,
    stroke: '#000000',
    strokeThickness: 2,
  });
  text.setOrigin(0.5);
  text.setDepth(20);

  scene.tweens.add({
    targets: text,
    y: y - 40,
    alpha: 0,
    scale: 1.5,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });
}

export function createXPPopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  amount: number
): void {
  const text = scene.add.text(x, y, `${amount} XP`, {
    fontFamily: '"Press Start 2P"',
    fontSize: '10px',
    color: '#aa44ff',
    stroke: '#000000',
    strokeThickness: 2,
  });
  text.setOrigin(0.5);
  text.setDepth(20);

  scene.tweens.add({
    targets: text,
    y: y - 30,
    alpha: 0,
    duration: 1000,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });
}

export function createLevelUpEffect(scene: Phaser.Scene, x: number, y: number): void {
  // Ring expansion
  const ring = scene.add.circle(x, y, 10, 0xffaa00, 0);
  ring.setStrokeStyle(4, 0xffaa00, 1);
  ring.setDepth(15);

  scene.tweens.add({
    targets: ring,
    radius: 100,
    alpha: 0,
    duration: 2000,
    ease: 'Power2',
    onComplete: () => ring.destroy(),
  });

  // Particles burst
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const particle = scene.add.star(x, y, 4, 4, 8, 0xffaa00);
    particle.setDepth(15);
    particle.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * 80,
      y: y + Math.sin(angle) * 80,
      alpha: 0,
      rotation: Math.PI,
      scale: 0.3,
      duration: 4000,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }
}
