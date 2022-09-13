import { Generator, RepairPosition } from "../../classes/generator";
import { Killer } from "../../classes/killer";
import { Survivor } from "../../classes/survivor";
import { DBD_CONSTANTS, KillerIntention, SIMULATOR_CONSTANTS, SurvivorIntention } from "../../constants/constants";
import { distanceBetween2Points } from "../geometry/distanceBetween2Points";

export function simulateKillerBehavior(killer: Killer, survivors: Survivor[]) {
   if (killer.intention === KillerIntention.IDLE) {
     killer.intention = KillerIntention.CHASE;
     killer.focusNearestSurvivor(survivors);
     const { xComponent, yComponent } = killer.runTowardsObjective();
     killer.phaserInstance.setVelocity(xComponent, yComponent);
   } else if (killer.intention === KillerIntention.CHASE) {
     killer.focusNearestSurvivor(survivors);
     const { xComponent, yComponent } = killer.runTowardsObjective();
     killer.phaserInstance.setVelocity(xComponent, yComponent);
   }
}

export function simulateSurvivorBehavior(generators: Map<number, Generator>, survivor: Survivor, time: number) {
  let generator: Generator | null = null;
  let repairPosition: RepairPosition | null = null;
  if (survivor.repairPositionFocused) {
    const generatorValue = generators.get(survivor.repairPositionFocused.generatorId);
    generator = generatorValue ? generatorValue : null;
    if (generator) {
      repairPosition = generator.getRepairPositionById(
        survivor.repairPositionFocused.repairPositionId,
      );
    }
  }

  if (survivor.intention === SurvivorIntention.IDLE) {
    survivor.intention = SurvivorIntention.REPAIR;
    survivor.focusNearestGenerator(generators.values());
  }

  if (survivor.intention === SurvivorIntention.REPAIR) {
    if (repairPosition) {
      const { xComponent, yComponent } = survivor.runTowardsObjective(
        repairPosition?.coordinates,
      );
      survivor.phaserInstance.setVelocity(xComponent, yComponent);
    }
    if (
      generator &&
      repairPosition &&
      distanceBetween2Points(
        survivor.positionX,
        survivor.positionY,
        repairPosition.coordinates.x,
        repairPosition.coordinates.y,
      ) <= DBD_CONSTANTS.SURVIVOR.radius &&
      !repairPosition.isOccupied
    ) {
      survivor.positionX = repairPosition.coordinates.x;
      survivor.positionY = repairPosition.coordinates.y;
      survivor.phaserInstance.setPosition(
        repairPosition.coordinates.x, repairPosition.coordinates.y,
      );
      survivor.speedX = 0;
      survivor.speedY = 0;
      survivor.phaserInstance.setVelocity(0, 0);
    }
  }

  if (survivor.isInHurtAnimation && survivor.hurtAnimationEndsAt && time >= survivor.hurtAnimationEndsAt) {
    survivor.stopHurtAnimation();
  }
}

export function simulateDummyMovement(survivor: Survivor) {
  const { STATUS_BAR, PLAYABLE_MAP, PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;
  const { SURVIVOR } = DBD_CONSTANTS;
  if (survivor.phaserInstance.x < STATUS_BAR.dimensions.x + 0.1 * PLAYABLE_MAP.dimensions.x) {
    survivor.phaserInstance.setVelocityX(SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER);
    survivor.speedX = SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
  } else if (survivor.phaserInstance.x > STATUS_BAR.dimensions.x + 0.9 * PLAYABLE_MAP.dimensions.x) {
    survivor.phaserInstance.setVelocityX(-1 * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER);
    survivor.speedX = -1 * SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
  } else if (survivor.speedX === 0) {
    survivor.phaserInstance.setVelocityX(SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER);
    survivor.speedX = SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
  }
}
