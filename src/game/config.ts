import Phaser from 'phaser';
import {BootScene} from './scenes/BootScene';
import {MainMenuScene} from './scenes/MainMenuScene';
import {GameScene} from './scenes/GameScene';
import {HUDScene} from './scenes/HUDScene';
import {PauseScene} from './scenes/PauseScene';
import {GameOverScene} from './scenes/GameOverScene';
import {UpgradeScene} from './scenes/UpgradeScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig: Phaser.Types.Core.GameConfig = {
    title: 'Pixel Perfect Replica',
    version: '1.1.0',
    type: Phaser.AUTO,
    fps: {
        target: 60,
    },
    disableContextMenu: true,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0d0d14',
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {x: 0, y: 0},
            debug: false,
        },
    },
    scale: {
        mode: Phaser.Scale.EXPAND,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainMenuScene, GameScene, HUDScene, PauseScene, GameOverScene, UpgradeScene],

};
