import Phaser from 'phaser';

export default {
  /* type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#33A5E7',
  scale: {
    width: 800,
    height: 600,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  } */
  type: Phaser.AUTO,
   width: 700,
   height: 600,
   physics: {
      default: 'arcade',
      arcade: {
         // fps: 60,
         fps: 60,
         // debug: true,
      },
   },
};
