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

     for (let i = 1; i < 5; i++) {
        let repairPositionXCoordinate = null;
        let repairPositionYCoordinate = null;

        switch (i) {
          case 1:
            repairPositionXCoordinate = x;
            repairPositionYCoordinate = y - 0.5 * GENERATOR.dimensions.y - SURVIVOR.radius;
          case 2:
            repairPositionXCoordinate = x + 0.5 * GENERATOR.dimensions.x - SURVIVOR.radius;
            repairPositionYCoordinate = y;
          case 3:
            repairPositionXCoordinate = x;
            repairPositionYCoordinate = y + 0.5 * GENERATOR.dimensions.y - SURVIVOR.radius;
          case 4:
            repairPositionXCoordinate = x - 0.5 * GENERATOR.dimensions.x - SURVIVOR.radius;
            repairPositionYCoordinate = y;
            break;
          default:
            throw new Error(`Invalid 'i' value: ${i}`);
        }

        this.repairPositions.set(
            i,
            {
            id: i,
            generatorId: this.id,
            coordinates: {
              x: repairPositionXCoordinate,
              y: repairPositionYCoordinate,
            },
            isOccupied: false,
          }
        );
     }

     this.phaserInstance = phaserInstance;
     this.body = scene.add.group();
   }

   getRepairPositionById = (repairPositionId: number): RepairPosition | null => {
    const repairPosition = this.repairPositions.get(repairPositionId)
    return repairPosition ? repairPosition : null;
   };
}
