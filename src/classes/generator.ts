import { Scene } from "phaser";
import { Coordinates, DBD_CONSTANTS } from "../constants/constants";

export interface RepairPosition {
  id: number;
  generatorId: number;
  coordinates: Coordinates;
  isOccupied: boolean;
}

export class Generator extends Phaser.Class {
   id: number;
   repairPositions: Map<number, RepairPosition>;
   phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
   body: any;
 
   constructor(
     id: number,
     scene: Scene,
     phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
   ) {
     super({});
     this.id = id;

     const { GENERATOR, SURVIVOR } = DBD_CONSTANTS;

     this.repairPositions = new Map();

     const { x, y } = phaserInstance;

     this.repairPositions.set(
       1,
       {
        id: 1,
        generatorId: this.id,
        coordinates: {
          x,
          y: y - 0.5 * GENERATOR.dimensions.y - SURVIVOR.radius,
        },
        isOccupied: false,
      }
     );
      this.repairPositions.set(
        2,
        {
          id: 2,
          generatorId: this.id,
          coordinates: {
            x: x + 0.5 * GENERATOR.dimensions.x - SURVIVOR.radius,
            y,
          },
          isOccupied: false,
        }
      );
      this.repairPositions.set(
        3,
        {
          id: 3,
          generatorId: this.id,
          coordinates: {
            x,
            y: y + 0.5 * GENERATOR.dimensions.y - SURVIVOR.radius,
          },
          isOccupied: false,
        }
      );
      this.repairPositions.set(
        4,
        {
          id: 4,
          generatorId: this.id,
          coordinates: {
            x: x - 0.5 * GENERATOR.dimensions.x - SURVIVOR.radius,
            y,
          },
          isOccupied: false,
        }
      );

     this.phaserInstance = phaserInstance;
     this.body = scene.add.group();
   }

   getRepairPositionById = (repairPositionId: number): RepairPosition | null => {
    const repairPosition = this.repairPositions.get(repairPositionId)
    return repairPosition ? repairPosition : null;
   };
}
