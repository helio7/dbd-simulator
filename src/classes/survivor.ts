import { Scene } from "phaser";
import { distanceBetween2Points } from "../functions/geometry/distanceBetween2Points";
import { getUnitVectorFromPoint1To2 } from "../functions/geometry/getUnitVectorFromPoint1To2";
import { Coordinates, DBD_CONSTANTS, SIMULATOR_CONSTANTS, SurvivorIntention } from "../scenes/Game";
import { Generator } from "./generator";
import { Killer } from "./killer";

export class Survivor extends Phaser.Class {
   positionX: number;
   positionY: number;
   speedX: number;
   speedY: number;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   intention: SurvivorIntention;
   objectiveFocused: Coordinates | null;
 
   healthStates: number;
   isAdvancingTowardsObjective: boolean;
   isInHurtAnimation: boolean;
   hurtAnimationEndsAt: number | null;
 
   body: any;
 
   constructor(scene: Scene, x: number, y: number, phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
     super({});
     this.positionX = x;
     this.positionY = y;
     this.speedX = 0;
     this.speedY = 0;
     this.phaserInstance = phaserInstance;
     this.intention = SurvivorIntention.IDLE;
     this.objectiveFocused = null;
 
 
     this.healthStates = 2;
     
     this.isInHurtAnimation = false;
     this.hurtAnimationEndsAt = null;
     
 
     
     this.isAdvancingTowardsObjective = false;
     this.body = scene.add.group();
   }
 
   loseHealthState = () => {
     this.healthStates -= 1;
   };
 
   beginHurtAnimation = (time: number) => {
     this.isInHurtAnimation = true;
     this.hurtAnimationEndsAt = time;
   };
 
   stopHurtAnimation = () => {
     this.isInHurtAnimation = false;
     this.hurtAnimationEndsAt = null;
   }
 
   collideWithKiller = (killer: Killer) => {
     if (
       distanceBetween2Points(
         this.positionX, this.positionY,
         killer.positionX, killer.positionY
       ) <= DBD_CONSTANTS.SURVIVOR.radius + DBD_CONSTANTS.KILLER.radius
     ) return true;
     else return false;
   };
 
   focusNearestGenerator = (generators: Generator[]) => {
     let shortestDistance = null;
     let objectiveCoordinates: Coordinates | null = null;
     for (const generator of generators) {
       const distance = distanceBetween2Points(
         this.positionX, this.positionY,
         generator.positionX, generator.positionY,
       );
 
       if (shortestDistance === null || distance < shortestDistance) {
         shortestDistance = distance;
         objectiveCoordinates = {
           x: generator.positionX,
           y: generator.positionY,
         };
       }
     }
     this.objectiveFocused = objectiveCoordinates;
   };
 
   runTowardsObjective = (): { xComponent: number, yComponent: number } => {
     const { xComponent, yComponent } = this.objectiveFocused ?
       getUnitVectorFromPoint1To2(this.positionX, this.positionY, this.objectiveFocused?.x, this.objectiveFocused?.y): { xComponent: 0, yComponent: 0 };
     const { SURVIVOR } = DBD_CONSTANTS;
     const { PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;
 
     const finalSpeedX = xComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
     const finalSpeedY = yComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
 
     this.speedX = finalSpeedX;
     this.speedY = finalSpeedY;
     return { xComponent: finalSpeedX, yComponent: finalSpeedY };
   }
}
