import { Scene } from "phaser";
import { Coordinates, DBD_CONSTANTS, SurvivorHealthState, SurvivorIntention } from "../constants/constants";
import { distanceBetween2Points } from "../functions/geometry/distanceBetween2Points";
import { moveTowardsOrAwayFrom } from "../functions/ia";
import { Generator } from "./generator";
import { Killer } from "./killer";

export class Survivor extends Phaser.Class {
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
   movementSpeedModifier: number = 1;
   isSurvivor: boolean = true;
 
   constructor(
     scene: Scene,
     phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
     controlledByIa: boolean,
     dummyMovement: boolean,
     portraitCharacterImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
     portraitStatusImageInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
    ) {
     super({});
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

   applyMovementSpeedModifier = (percentageBonus: number) => {
     this.movementSpeedModifier += percentageBonus;
   }
 
   beginHurtAnimation = (time: number) => {
     this.isInHurtAnimation = true;
     this.hurtAnimationEndsAt = time;
   };
 
   stopHurtAnimation = () => {
     this.isInHurtAnimation = false;
     this.hurtAnimationEndsAt = null;
   }
 
   collideWithKiller = (killer: Killer) => {
     const { x, y } = this.phaserInstance;
     if (
       distanceBetween2Points(
        x, y,
         killer.phaserInstance.x, killer.phaserInstance.y,
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
          const { x, y } = this.phaserInstance;
          const distance = distanceBetween2Points(
            x, y,
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
   ) => {
    if (!this.repairPositionFocused) {
      this.speedX = 0;
      this.speedY = 0;
      this.phaserInstance.setVelocity(0, 0);
    } else moveTowardsOrAwayFrom(this, objectiveCoordinates, true);
   }

   findShortestDistanceToAKiller = (
     killers: Killer[],
   ): number | null => {
    let shortestDistanceToAKiller = null;
    const { phaserInstance: { x: survivorXPosition, y: survivorYPosition } } = this;
    for (const killer of killers) {
      const { phaserInstance: { x: killerXPosition, y: killerYPosition } } = killer;
      const distanceBetweenKillerAndSurvivor = distanceBetween2Points(
        survivorXPosition, survivorYPosition,
        killerXPosition, killerYPosition,
      );
      if (shortestDistanceToAKiller === null || distanceBetweenKillerAndSurvivor < shortestDistanceToAKiller) {
        shortestDistanceToAKiller = distanceBetweenKillerAndSurvivor;
      }
    }
    return shortestDistanceToAKiller;
   }

   runAwayFromNearestKiller = (
     killers: Killer[],
   ) => {
     let shortestDistance = null;
    let positionToRunFrom: Coordinates | null = null;
    for (const killer of killers) {
      const { x, y } = this.phaserInstance;
      const distance = distanceBetween2Points(
        x, y,
        killer.phaserInstance.x, killer.phaserInstance.y,
      );
      if (shortestDistance === null || distance < shortestDistance) {
        shortestDistance = distance;
        positionToRunFrom = { x: killer.phaserInstance.x, y: killer.phaserInstance.y };
      }
    }
    moveTowardsOrAwayFrom(this, positionToRunFrom!, false);
   }
}
