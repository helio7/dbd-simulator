import { Scene } from "phaser";

export class Generator extends Phaser.Class {
   positionX: number;
   positionY: number;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   body: any;
 
   constructor(
     scene: Scene,
     x: number,
     y: number,
     phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
   ) {
     super({});
     this.positionX = x;
     this.positionY = y;
     this.phaserInstance = phaserInstance;
     this.body = scene.add.group();
   }
}
