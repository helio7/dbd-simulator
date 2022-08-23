import { Scene } from "phaser";
import { Coordinates, DBD_CONSTANTS, KillerIntention, SIMULATOR_CONSTANTS } from "../constants/constants";
import { distanceBetween2Points } from "../functions/geometry/distanceBetween2Points";
import { getUnitVectorFromPoint1To2 } from "../functions/geometry/getUnitVectorFromPoint1To2";
import { Survivor } from "./survivor";

export class Killer extends Phaser.Class {
   positionX: number;
   positionY: number;
   speedX: number;
   speedY: number;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   intention: KillerIntention;
   objectiveFocused: Coordinates | null;
 
   body: any;
 
   constructor(scene: Scene, x: number, y: number, phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
     super({});
     this.positionX = x;
     this.positionY = y;
     this.speedX = 0;
     this.speedY = 0;
     this.phaserInstance = phaserInstance;
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
 
   runTowardsObjective = (): { xComponent: number, yComponent: number } => {
     const { xComponent, yComponent } = this.objectiveFocused ?
       getUnitVectorFromPoint1To2(this.positionX, this.positionY, this.objectiveFocused?.x, this.objectiveFocused?.y): { xComponent: 0, yComponent: 0 };
     const { KILLER } = DBD_CONSTANTS;
     const { PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;
 
     const finalSpeedX = xComponent * KILLER.speed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
     const finalSpeedY = yComponent * KILLER.speed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
 
     this.speedX = finalSpeedX;
     this.speedY = finalSpeedY;
     return { xComponent: finalSpeedX, yComponent: finalSpeedY };
   }
}
