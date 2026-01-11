import Phaser from 'phaser';
import { Upgrade, getRandomUpgrades } from '../systems/UpgradeSystem';
import { GameScene } from './GameScene';

export class UpgradeScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private upgrades: Upgrade[] = [];

  constructor() {
    super({ key: 'UpgradeScene' });
  }

  init(data: { gameScene: GameScene }): void {
    this.gameScene = data.gameScene;
    this.upgrades = getRandomUpgrades(3);
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Title
    const title = this.add.text(width / 2, height * 0.15, 'LEVEL UP!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: '#ffaa00',
      stroke: '#664400',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Glow animation
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Level indicator
    const levelText = this.add.text(width / 2, height * 0.25, `Level ${this.gameScene.player.level}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#aa44ff',
    });
    levelText.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.32, 'Choose an upgrade:', {
      fontFamily: 'Inter',
      fontSize: '18px',
      color: '#888899',
    });
    subtitle.setOrigin(0.5);

    // Upgrade cards
    const cardWidth = 220;
    const cardHeight = 280;
    const cardSpacing = 40;
    const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
    const startX = (width - totalWidth) / 2 + cardWidth / 2;

    this.upgrades.forEach((upgrade, index) => {
      const x = startX + (cardWidth + cardSpacing) * index;
      const y = height * 0.58;
      this.createUpgradeCard(x, y, cardWidth, cardHeight, upgrade);
    });
  }

  private createUpgradeCard(
    x: number,
    y: number,
    width: number,
    height: number,
    upgrade: Upgrade
  ): Phaser.GameObjects.Container {
    // Card background
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x1a1a3e, 1);
    cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    cardBg.lineStyle(3, upgrade.color, 1);
    cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    // Icon background circle
    const iconBg = this.add.graphics();
    iconBg.fillStyle(upgrade.color, 0.2);
    iconBg.fillCircle(0, -60, 40);
    iconBg.lineStyle(2, upgrade.color, 0.5);
    iconBg.strokeCircle(0, -60, 40);

    // Icon text (emoji)
    const iconText = this.add.text(0, -60, upgrade.icon, {
      fontSize: '36px',
    });
    iconText.setOrigin(0.5);

    // Upgrade name
    const nameText = this.add.text(0, 10, upgrade.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 30 },
    });
    nameText.setOrigin(0.5);

    // Description
    const descText = this.add.text(0, 50, upgrade.description, {
      fontFamily: 'Inter',
      fontSize: '14px',
      color: `#${upgrade.color.toString(16).padStart(6, '0')}`,
      align: 'center',
    });
    descText.setOrigin(0.5);

    // Select button
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(upgrade.color, 0.3);
    buttonBg.fillRoundedRect(-70, 75, 140, 40, 8);
    buttonBg.lineStyle(2, upgrade.color, 1);
    buttonBg.strokeRoundedRect(-70, 75, 140, 40, 8);

    const buttonText = this.add.text(0, 95, 'SELECT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);

    // Container
    const container = this.add.container(x, y, [
      cardBg,
      iconBg,
      iconText,
      nameText,
      descText,
      buttonBg,
      buttonText,
    ]);

    container.setSize(width, height);
    container.setInteractive();

    // Hover effects
    container.on('pointerover', () => {
      cardBg.clear();
      cardBg.fillStyle(0x2a2a4e, 1);
      cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
      cardBg.lineStyle(4, upgrade.color, 1);
      cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Back.easeOut',
      });
    });

    container.on('pointerout', () => {
      cardBg.clear();
      cardBg.fillStyle(0x1a1a3e, 1);
      cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
      cardBg.lineStyle(3, upgrade.color, 1);
      cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    container.on('pointerdown', () => {
      // Apply upgrade
      upgrade.apply(this.gameScene.player);

      // Flash effect
      this.cameras.main.flash(200, 
        (upgrade.color >> 16) & 0xff,
        (upgrade.color >> 8) & 0xff,
        upgrade.color & 0xff
      );

      // Resume game
      this.time.delayedCall(100, () => {
        this.gameScene.resumeFromUpgrade();
        this.scene.stop();
      });
    });

    // Entry animation
    container.setScale(0);
    container.alpha = 0;
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 300,
      delay: 100 + (this.upgrades.indexOf(upgrade) * 100),
      ease: 'Back.easeOut',
    });

    return container;
  }
}
