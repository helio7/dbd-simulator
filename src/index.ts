import Phaser from 'phaser';
import config from './config';
import GameScene from './scenes/Game';
import MenuScene from './scenes/Menu';

export default new Phaser.Game(
  Object.assign(config, {
    scene: [MenuScene, GameScene]
  })
);
