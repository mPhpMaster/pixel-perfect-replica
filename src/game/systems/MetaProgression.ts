// Meta progression system - persists between runs

import {Player} from "@/game/entities/Player.ts";

export interface MetaUpgrade {
    id: string;
    name: string;
    description: string;
    icon: string;
    maxLevel: number;
    costPerLevel: number[];
    effect: (level: number) => number; // Returns the bonus value
}

export interface PlayerMeta {
    coins: number;
    totalKills: number;
    totalRuns: number;
    bestWave: number;
    upgrades: Record<string, number>; // upgrade id -> level
    unlockedWeapons: string[];
}

export const STORAGE_KEY = 'tater_meta';

export const META_UPGRADES: MetaUpgrade[] = [
    {
        id: 'starting_damage',
        name: 'POWER CORE',
        description: 'Start with +{value}% damage',
        icon: '⚔️',
        maxLevel: 5,
        costPerLevel: [50, 100, 200, 400, 800],
        effect: (level) => level * 10,
    },
    {
        id: 'starting_health',
        name: 'VITAL HEART',
        description: 'Start with +{value} max HP',
        icon: '❤️',
        maxLevel: 5,
        costPerLevel: [40, 80, 160, 320, 640],
        effect: (level) => level * 20,
    },
    {
        id: 'starting_speed',
        name: 'SWIFT BOOTS',
        description: 'Start with +{value}% move speed',
        icon: '👟',
        maxLevel: 3,
        costPerLevel: [75, 150, 300],
        effect: (level) => level * 8,
    },
    {
        id: 'coin_bonus',
        name: 'GOLDEN TOUCH',
        description: 'Earn +{value}% coins',
        icon: '💰',
        maxLevel: 5,
        costPerLevel: [100, 200, 400, 800, 1600],
        effect: (level) => level * 15,
    },
    {
        id: 'xp_bonus',
        name: 'WISDOM',
        description: 'Gain +{value}% XP',
        icon: '📚',
        maxLevel: 5,
        costPerLevel: [60, 120, 240, 480, 960],
        effect: (level) => level * 10,
    },
    {
        id: 'magnet_range',
        name: 'MAGNETISM',
        description: 'Start with +{value}% pickup range',
        icon: '🧲',
        maxLevel: 3,
        costPerLevel: [50, 100, 200],
        effect: (level) => level * 25,
    },
];

export const WEAPON_UNLOCKS = [
    {
        id: 'orbit_shield',
        name: 'ORBIT SHIELD',
        description: 'Rotating shields damage enemies on contact',
        icon: '🛡️',
        cost: 500,
    },
    {
        id: 'lightning',
        name: 'CHAIN LIGHTNING',
        description: 'Lightning chains between enemies',
        icon: '⚡',
        cost: 750,
    },
    {
        id: 'explosive_aura',
        name: 'EXPLOSIVE AURA',
        description: 'Auto-explodes when surrounded by enemies',
        icon: '💥',
        cost: 1000,
    },
];

export function getDefaultMeta(data: Partial<PlayerMeta> = {}): PlayerMeta {
    return {
        coins: 0,
        totalKills: 0,
        totalRuns: 0,
        bestWave: 0,
        upgrades: {},
        unlockedWeapons: [],
        ...data,
    };
}

export function loadMeta(): PlayerMeta {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return getDefaultMeta(JSON.parse(stored));
        }
    } catch (e) {
        console.warn('Failed to load meta progress:', e);
    }
    return getDefaultMeta();
}

export function saveMeta(meta: PlayerMeta): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch (e) {
        console.warn('Failed to save meta progress:', e);
    }
}

export function getUpgradeLevel(meta: PlayerMeta, upgradeId: string): number {
    return meta.upgrades[upgradeId] || 0;
}

export function canAffordUpgrade(meta: PlayerMeta, upgrade: MetaUpgrade): boolean {
    const currentLevel = getUpgradeLevel(meta, upgrade.id);
    if (currentLevel >= upgrade.maxLevel) return false;
    return meta.coins >= upgrade.costPerLevel[currentLevel];
}

export function purchaseUpgrade(meta: PlayerMeta, upgrade: MetaUpgrade): boolean {
    const currentLevel = getUpgradeLevel(meta, upgrade.id);
    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = upgrade.costPerLevel[currentLevel];
    if (meta.coins < cost) return false;

    meta.coins -= cost;
    meta.upgrades[upgrade.id] = currentLevel + 1;
    saveMeta(meta);
    return true;
}

export function canAffordWeapon(meta: PlayerMeta, weaponId: string): boolean {
    const weapon = WEAPON_UNLOCKS.find(w => w.id === weaponId);
    if (!weapon) return false;
    if (meta.unlockedWeapons.includes(weaponId)) return false;
    return meta.coins >= weapon.cost;
}

export function purchaseWeapon(meta: PlayerMeta, weaponId: string): boolean {
    const weapon = WEAPON_UNLOCKS.find(w => w.id === weaponId);
    if (!weapon) return false;
    if (meta.unlockedWeapons.includes(weaponId)) return false;
    if (meta.coins < weapon.cost) return false;

    meta.coins -= weapon.cost;
    meta.unlockedWeapons.push(weaponId);
    saveMeta(meta);
    return true;
}

export function addCoins(meta: PlayerMeta, amount: number): void {
    const bonusPercent = getUpgradeLevel(meta, 'coin_bonus') * 15;
    const finalAmount = Math.floor(amount * (1 + bonusPercent / 100));
    meta.coins += finalAmount;
    saveMeta(meta);
}

export function recordRun(meta: PlayerMeta, wave: number, kills: number, coinsEarned: number): void {
    meta.totalRuns++;
    meta.totalKills += kills;
    if (wave > meta.bestWave) {
        meta.bestWave = wave;
    }
    addCoins(meta, coinsEarned);
    saveMeta(meta);
}

export function applyMetaBonuses(player: Player, meta: PlayerMeta): void {
    // Apply starting bonuses from meta upgrades
    META_UPGRADES.forEach(upgrade => {
        const level = getUpgradeLevel(meta, upgrade.id);
        if (level === 0) return;

        const bonus = upgrade.effect(level);

        switch (upgrade.id) {
            case 'starting_damage':
                player.damage = Math.floor(player.damage * (1 + bonus / 100));
                break;
            case 'starting_health':
                player.maxHealth += bonus;
                player.health += bonus;
                break;
            case 'starting_speed':
                player.speed = Math.floor(player.speed * (1 + bonus / 100));
                break;
            case 'magnet_range':
                player.magnetRange = Math.floor(player.magnetRange * (1 + bonus / 100));
                break;
        }
    });
}

export function getXPMultiplier(meta: PlayerMeta): number {
    const level = getUpgradeLevel(meta, 'xp_bonus');
    return 1 + (level * 10) / 100;
}
