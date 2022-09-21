import { Scene } from "phaser";
import { Coordinates, DBD_CONSTANTS, SIMULATOR_CONSTANTS, SurvivorHealthState, SurvivorIntention } from "../constants/constants";
import { distanceBetween2Points } from "../functions/geometry/distanceBetween2Points";
import { getUnitVectorFromPoint1To2 } from "../functions/geometry/getUnitVectorFromPoint1To2";
import { Generator } from "./generator";
import { Killer } from "./killer";

export class Survivor extends Phaser.Class {
   positionX: number;
   positionY: number;
   speedX: number;
   speedY: number;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   controlledByIa: boolean;
   dummyMovement: boolean;
   portraitCharacterImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   portraitStatusImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   intention: SurvivorIntention;
   repairPositionFocused: {
     repairPositionId: number,
     generatorId: number
   } | null;
 
   healthState: SurvivorHealthState;
   isAdvancingTowardsObjective: boolean;
   isInHurtAnimation: boolean;
   hurtAnimationEndsAt: number | null;
 
   body: any;
 
   constructor(
     scene: Scene,
     x: number,
     y: number,
     phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
     controlledByIa: boolean,
     dummyMovement: boolean,
     portraitCharacterImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
     portraitStatusImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
    ) {
     super({});
     this.positionX = x;
     this.positionY = y;
     this.speedX = 0;
     this.speedY = 0;
     this.phaserInstance = phaserInstance;
     this.controlledByIa = controlledByIa;
     this.dummyMovement = dummyMovement;
     this.portraitCharacterImageInstance = portraitCharacterImageInstance;
     this.portraitStatusImageInstance = portraitStatusImageInstance;
     this.intention = SurvivorIntention.IDLE;
     this.repairPositionFocused = null;
 
     this.healthState = SurvivorHealthState.NORMAL;
     
     this.isInHurtAnimation = false;
     this.hurtAnimationEndsAt = null;
     
 
     
     this.isAdvancingTowardsObjective = false;
     this.body = scene.add.group();
   }
 
   receiveBasicAttack = () => {
     const { NORMAL, INJURED, DOWNED } = SurvivorHealthState;
     switch (this.healthState) {
       case NORMAL:
         this.healthState = INJURED;
         this.portraitStatusImageInstance.setTexture('injured');
         break;
       case INJURED:
         this.healthState = DOWNED;
         this.portraitStatusImageInstance.setTexture('transparent');
         this.portraitCharacterImageInstance.setTexture('downed');
       default:
         break;
     }
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
 
   focusNearestGenerator = (
     generators: Generator[] | IterableIterator<Generator>
   ) => {
     let shortestDistance = null;
     let repairPositionId = null;
     let generatorId = null;
     for (const generator of generators) {
       for (const { id, generatorId: genId, isOccupied, coordinates } of generator.repairPositions.values()) {
         if (!isOccupied) {
          const distance = distanceBetween2Points(
            this.positionX, this.positionY,
            coordinates.x, coordinates.y,
          );
          if (shortestDistance === null || distance < shortestDistance) {
           shortestDistance = distance;
           repairPositionId = id;
           generatorId = genId;
          }
         }
       }
     }

     if (repairPositionId && generatorId) {
      this.repairPositionFocused = {
        repairPositionId,
        generatorId,
      };
     }
   };
 
   runTowardsObjective = (
     objectiveCoordinates: Coordinates,
   ): { xComponent: number, yComponent: number } => {
     const { xComponent, yComponent } = this.repairPositionFocused ?
       getUnitVectorFromPoint1To2(
         this.positionX,
         this.positionY,
         objectiveCoordinates.x,
         objectiveCoordinates.y,
       ): { xComponent: 0, yComponent: 0 };
     const { SURVIVOR } = DBD_CONSTANTS;
     const { PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;
 
     const finalSpeedX = xComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
     const finalSpeedY = yComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
 
     this.speedX = finalSpeedX;
     this.speedY = finalSpeedY;
     return { xComponent: finalSpeedX, yComponent: finalSpeedY };
   }

   runAwayFromNearestKiller = (
     killers: Killer[],
   ): { xComponent: number, yComponent: number } => {
     let shortestDistance = null;
    let positionToRunFrom: Coordinates | null = null;
    for (const killer of killers) {
      const distance = distanceBetween2Points(
        this.positionX, this.positionY,
        killer.positionX, killer.positionY,
      );
      if (shortestDistance === null || distance < shortestDistance) {
        shortestDistance = distance;
        positionToRunFrom = { x: killer.positionX, y: killer.positionY };
      }
    }

    const { xComponent, yComponent } = getUnitVectorFromPoint1To2(
      this.positionX,
      this.positionY,
      positionToRunFrom!.x,
      positionToRunFrom!.y,
    );

    const { SURVIVOR } = DBD_CONSTANTS;
     const { PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;

    const finalSpeedX = -1 * xComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
    const finalSpeedY = -1 * yComponent * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;

    this.speedX = finalSpeedX;
    this.speedY = finalSpeedY;

    this.phaserInstance.setVelocity(finalSpeedX, finalSpeedY);

    return { xComponent: positionToRunFrom!.x, yComponent: positionToRunFrom!.y };
   }
}
