import { Button } from "../utils";

export default class Menu extends Phaser.Scene {
   buttonStart: any;
   constructor() {
      super('MenuScene');
   }
   preload() {
      this.load.spritesheet(
         'plas_as_survivor',
         'assets/play_as_survivor.png',
         { frameWidth: 306, frameHeight: 80 },
      );
   }
   create() {
      this.buttonStart = new Button(213, 110, 'plas_as_survivor', this.clickHandler, this, false);
   }

   clickHandler (pointer: any, box: any) {
      this.scene.start('GameScene');
   }
}
