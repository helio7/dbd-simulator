export class Button extends Phaser.GameObjects.Image {
   constructor(x: any, y: any, texture: any, callback: any, scene: any, noframes: any) {
     super(scene, x, y, texture, 0);
     this.setInteractive({ useHandCursor: false });
     
     this.on('pointerup', () => {
       if(!noframes) {
         this.setFrame(1);
       }
     }, this);
 
     this.on('pointerdown', () => {
       if(!noframes) {
         this.setFrame(2);
       }
       callback.call(scene);
     }, this);
 
     this.on('pointerover', () => {
       if(!noframes) {
         this.setFrame(1);
       }
     }, this);
 
     this.on('pointerout', () => {
       if(!noframes) {
         this.setFrame(0);
       }
     }, this);
 
     scene.add.existing(this);
   }
};
