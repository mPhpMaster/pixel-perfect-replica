import Phaser from 'phaser';
import { 
  META_UPGRADES, 
  WEAPON_UNLOCKS, 
  loadMeta, 
  saveMeta,
  getUpgradeLevel,
  canAffordUpgrade,
  purchaseUpgrade,
  canAffordWeapon,
  purchaseWeapon,
  PlayerMeta
} from '../systems/MetaProgression';

export class ShopScene extends Phaser.Scene {
  private meta!: PlayerMeta;
  private coinText!: Phaser.GameObjects.Text;
  private upgradeContainers: Phaser.GameObjects.Container[] = [];
  private weaponContainers: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.meta = loadMeta();
    const { width, height } = this.cameras.main;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d14, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, 40, 'UPGRADE SHOP', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ffaa00',
    });
    title.setOrigin(0.5);

    // Coin display
    this.coinText = this.add.text(width / 2, 80, `💰 ${this.meta.coins} COINS`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ffdd00',
    });
    this.coinText.setOrigin(0.5);

    // Stats display
    const statsText = this.add.text(width / 2, 110, 
      `Runs: ${this.meta.totalRuns} | Best Wave: ${this.meta.bestWave} | Total Kills: ${this.meta.totalKills}`, {
      fontFamily: 'Inter',
      fontSize: '12px',
      color: '#888888',
    });
    statsText.setOrigin(0.5);

    // Upgrades section
    const upgradesLabel = this.add.text(40, 150, 'PERMANENT UPGRADES', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00d4aa',
    });

    this.createUpgradesList(40, 180);

    // Weapons section
    const weaponsLabel = this.add.text(width / 2 + 40, 150, 'WEAPON UNLOCKS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#9933ff',
    });

    this.createWeaponsList(width / 2 + 40, 180);

    // Back button
    this.createButton(width / 2, height - 60, 'BACK TO MENU', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private createUpgradesList(startX: number, startY: number): void {
    META_UPGRADES.forEach((upgrade, index) => {
      const y = startY + index * 75;
      const container = this.createUpgradeItem(startX, y, upgrade);
      this.upgradeContainers.push(container);
    });
  }

  private createUpgradeItem(x: number, y: number, upgrade: typeof META_UPGRADES[0]): Phaser.GameObjects.Container {
    const level = getUpgradeLevel(this.meta, upgrade.id);
    const isMaxed = level >= upgrade.maxLevel;
    const cost = isMaxed ? 0 : upgrade.costPerLevel[level];
    const canAfford = canAffordUpgrade(this.meta, upgrade);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(canAfford ? 0x1a2a1a : 0x1a1a2e, 0.8);
    bg.fillRoundedRect(0, 0, 350, 65, 8);
    bg.lineStyle(2, canAfford ? 0x44ff44 : 0x333355, 1);
    bg.strokeRoundedRect(0, 0, 350, 65, 8);

    // Icon
    const icon = this.add.text(15, 12, upgrade.icon, { fontSize: '24px' });

    // Name
    const name = this.add.text(55, 8, upgrade.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ffffff',
    });

    // Description with value
    const value = upgrade.effect(level + 1);
    const desc = this.add.text(55, 28, upgrade.description.replace('{value}', value.toString()), {
      fontFamily: 'Inter',
      fontSize: '11px',
      color: '#aaaaaa',
    });

    // Level display
    const levelText = this.add.text(55, 48, `Level: ${level}/${upgrade.maxLevel}`, {
      fontFamily: 'Inter',
      fontSize: '10px',
      color: '#888888',
    });

    // Cost/Buy button
    let buyBtn: Phaser.GameObjects.Container | null = null;
    if (!isMaxed) {
      buyBtn = this.createSmallButton(280, 32, `${cost}💰`, () => {
        if (purchaseUpgrade(this.meta, upgrade)) {
          this.refreshUI();
        }
      }, canAfford);
    } else {
      const maxedText = this.add.text(280, 25, 'MAXED', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#ffaa00',
      });
      maxedText.setOrigin(0.5);
    }

    const children: Phaser.GameObjects.GameObject[] = [bg, icon, name, desc, levelText];
    if (buyBtn) children.push(buyBtn);

    const container = this.add.container(x, y, children);
    return container;
  }

  private createWeaponsList(startX: number, startY: number): void {
    WEAPON_UNLOCKS.forEach((weapon, index) => {
      const y = startY + index * 85;
      const container = this.createWeaponItem(startX, y, weapon);
      this.weaponContainers.push(container);
    });
  }

  private createWeaponItem(x: number, y: number, weapon: typeof WEAPON_UNLOCKS[0]): Phaser.GameObjects.Container {
    const isUnlocked = this.meta.unlockedWeapons.includes(weapon.id);
    const canAfford = canAffordWeapon(this.meta, weapon.id);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(isUnlocked ? 0x1a2a3a : (canAfford ? 0x2a1a2a : 0x1a1a2e), 0.8);
    bg.fillRoundedRect(0, 0, 350, 75, 8);
    bg.lineStyle(2, isUnlocked ? 0x4488ff : (canAfford ? 0x9933ff : 0x333355), 1);
    bg.strokeRoundedRect(0, 0, 350, 75, 8);

    // Icon
    const icon = this.add.text(15, 15, weapon.icon, { fontSize: '28px' });

    // Name
    const name = this.add.text(60, 10, weapon.name, {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: isUnlocked ? '#4488ff' : '#ffffff',
    });

    // Description
    const desc = this.add.text(60, 32, weapon.description, {
      fontFamily: 'Inter',
      fontSize: '11px',
      color: '#aaaaaa',
      wordWrap: { width: 200 },
    });

    const children: Phaser.GameObjects.GameObject[] = [bg, icon, name, desc];

    // Cost/Status
    if (isUnlocked) {
      const unlockedText = this.add.text(290, 37, 'UNLOCKED', {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#44ff44',
      });
      unlockedText.setOrigin(0.5);
      children.push(unlockedText);
    } else {
      const buyBtn = this.createSmallButton(290, 37, `${weapon.cost}💰`, () => {
        if (purchaseWeapon(this.meta, weapon.id)) {
          this.refreshUI();
        }
      }, canAfford);
      children.push(buyBtn);
    }

    const container = this.add.container(x, y, children);
    return container;
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void, enabled: boolean): Phaser.GameObjects.Container {
    const bg = this.add.graphics();
    bg.fillStyle(enabled ? 0x44aa44 : 0x444444, 1);
    bg.fillRoundedRect(-35, -15, 70, 30, 6);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      color: enabled ? '#ffffff' : '#888888',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, buttonText]);
    container.setSize(70, 30);
    
    if (enabled) {
      container.setInteractive();
      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x66cc66, 1);
        bg.fillRoundedRect(-35, -15, 70, 30, 6);
      });
      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x44aa44, 1);
        bg.fillRoundedRect(-35, -15, 70, 30, 6);
      });
      container.on('pointerdown', callback);
    }

    return container;
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x1a1a3e, 1);
    buttonBg.fillRoundedRect(-100, -20, 200, 40, 8);
    buttonBg.lineStyle(2, 0x00d4aa, 1);
    buttonBg.strokeRoundedRect(-100, -20, 200, 40, 8);

    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00d4aa',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(x, y, [buttonBg, buttonText]);
    container.setSize(200, 40);
    container.setInteractive();

    container.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00d4aa, 0.2);
      buttonBg.fillRoundedRect(-100, -20, 200, 40, 8);
      buttonBg.lineStyle(2, 0x00ffcc, 1);
      buttonBg.strokeRoundedRect(-100, -20, 200, 40, 8);
      buttonText.setColor('#00ffcc');
    });

    container.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x1a1a3e, 1);
      buttonBg.fillRoundedRect(-100, -20, 200, 40, 8);
      buttonBg.lineStyle(2, 0x00d4aa, 1);
      buttonBg.strokeRoundedRect(-100, -20, 200, 40, 8);
      buttonText.setColor('#00d4aa');
    });

    container.on('pointerdown', callback);
  }

  private refreshUI(): void {
    this.meta = loadMeta();
    this.coinText.setText(`💰 ${this.meta.coins} COINS`);
    
    // Destroy and recreate upgrade items
    this.upgradeContainers.forEach(c => c.destroy());
    this.upgradeContainers = [];
    this.createUpgradesList(40, 180);
    
    this.weaponContainers.forEach(c => c.destroy());
    this.weaponContainers = [];
    this.createWeaponsList(this.cameras.main.width / 2 + 40, 180);
  }
}
