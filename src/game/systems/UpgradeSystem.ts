import Phaser from "phaser";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: number;
  apply: (player: any) => void;
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'damage_up',
    name: 'POWER UP',
    description: '+15% Damage',
    icon: '⚔️',
    color: 0xff4444,
    apply: (player) => {
      player.damage = Math.floor(player.damage * 1.15);
    },
  },
  // {
  //   id: 'damage_up',
  //   name: 'POWER UP',
  //   description: '+ANY% Damage',
  //   icon: '🕸',
  //   color: 0xcccccc,
  //   apply: (player) => {
  //     player.damage = prompt("Enter new player ", player.damage);
  //   },
  // },
  {
    id: 'attack_speed',
    name: 'RAPID FIRE',
    description: '+20% Attack Speed',
    icon: '⚡',
    color: 0xffaa00,
    apply: (player) => {
      player.attackSpeed = Math.max(100, player.attackSpeed * 0.8);
    },
  },
  {
    id: 'move_speed',
    name: 'SWIFT FEET',
    description: '+15% Move Speed',
    icon: '👟',
    color: 0x44ff44,
    apply: (player) => {
      player.speed = Math.floor(player.speed * 1.15);
    },
  },
  {
    id: 'max_health',
    name: 'VITALITY',
    description: '+25 Max HP',
    icon: '❤️',
    color: 0xff6666,
    apply: (player) => {
      player.maxHealth += 25;
      player.health += 25;
    },
  },
  {
    id: 'heal',
    name: 'RESTORATION',
    description: 'Heal 30% HP',
    icon: '💚',
    color: 0x66ff66,
    apply: (player) => {
      player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.3);
    },
  },
  {
    id: 'attack_range',
    name: 'EAGLE EYE',
    description: '+25% Attack Range',
    icon: '🎯',
    color: 0x4488ff,
    apply: (player) => {
      player.attackRange = Math.floor(player.attackRange * 1.25);
    },
  },
  {
    id: 'multi_shot',
    name: 'SPREAD SHOT',
    description: '+1 Projectile',
    icon: '🔥',
    color: 0xff8800,
    apply: (player) => {
      player.projectileCount = (player.projectileCount || 1) + 1;
    },
  },
  {
    id: 'magnet',
    name: 'MAGNETISM',
    description: '+50% XP Pickup Range',
    icon: '🧲',
    color: 0xaa44ff,
    apply: (player) => {
      player.magnetRange = (player.magnetRange || 100) * 1.5;
    },
  },
];

export function getRandomUpgrades(count: number = 3): Upgrade[] {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
