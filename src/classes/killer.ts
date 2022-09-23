import { Scene } from "phaser";
import { Coordinates, KillerIntention } from "../constants/constants";
import { distanceBetween2Points } from "../functions/geometry/distanceBetween2Points";
import { moveTowardsOrAwayFrom } from "../functions/ia";
import { Survivor } from "./survivor";

export class Killer extends Phaser.Class {
   positionX: number;
   positionY: number;
   speedX: number;
   speedY: number;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   intention: KillerIntention;
   objectiveFocused: Coordinates | null;
   controlledByIa: boolean;
   terrorRadius: number;
   terrorRadiusIndicatorInstance: Phaser.GameObjects.Graphics;
   movementSpeedModifier: number = 1;
   isKiller: boolean = true;
 
   body: any;
 
   constructor(scene: Scene, x: number, y: number, phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody, controlledByIa: boolean, terrorRadius: number, terrorRadiusIndicatorInstance: Phaser.GameObjects.Graphics) {
     super({});
     this.positionX = x;
     this.positionY = y;
     this.speedX = 0;
     this.speedY = 0;
     this.phaserInstance = phaserInstance;
     this.controlledByIa = controlledByIa;
     this.terrorRadius = terrorRadius;
     this.terrorRadiusIndicatorInstance = terrorRadiusIndicatorInstance;
     this.intention = KillerIntention.IDLE;
     this.objectiveFocused = null;
     this.body = scene.add.group();
   }
 
   focusNearestSurvivor = (survivors: Survivor[]) => {
     let shortestDistance = null;
     let objectiveCoordinates: Coordinates | null = null;
     for (const survivor of survivors) {
       const distance = distanceBetween2Points(
         this.positionX, this.positionY,
         survivor.positionX, survivor.positionY,
       );
 
       if (shortestDistance === null || distance < shortestDistance) {
         shortestDistance = distance;
         objectiveCoordinates = {
           x: survivor.positionX,
           y: survivor.positionY,
         };
       }
     }
     this.objectiveFocused = objectiveCoordinates;
   };
 
   runTowardsObjective = () => {
    if (!this.objectiveFocused) {
      this.speedX = 0;
      this.speedY = 0;
      this.phaserInstance.setVelocity(0, 0);
    } else moveTowardsOrAwayFrom(this, this.objectiveFocused, true);
   }

   applyMovementSpeedModifier = (percentageBonus: number) => {
    this.movementSpeedModifier += percentageBonus;
   }
}
