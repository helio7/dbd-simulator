import { Generator, RepairPosition } from "../../classes/generator";
import { Killer } from "../../classes/killer";
import { Survivor } from "../../classes/survivor";
import { Coordinates, DBD_CONSTANTS, KillerIntention, SIMULATOR_CONSTANTS, SurvivorIntention } from "../../constants/constants";
import { distanceBetween2Points } from "../geometry/distanceBetween2Points";
import { getUnitVectorFromPoint1To2 } from "../geometry/getUnitVectorFromPoint1To2";

export function simulateKillerBehavior(killer: Killer, survivors: Survivor[]) {
  if (killer.intention === KillerIntention.IDLE || killer.intention === KillerIntention.CHASE) {
    if (killer.intention === KillerIntention.IDLE) killer.intention = KillerIntention.CHASE;
    killer.focusNearestSurvivor(survivors);
    killer.runTowardsObjective();
  }
}

export function simulateSurvivorBehavior(generators: Map<number, Generator>, survivor: Survivor, time: number, killers: Killer[]) {
  let generator: Generator | null = null;
  let repairPosition: RepairPosition | null = null;
  const { repairPositionFocused } = survivor;
  if (repairPositionFocused) {
    const { generatorId, repairPositionId } = repairPositionFocused;
    const generatorValue = generators.get(generatorId);
    generator = generatorValue ? generatorValue : null;
    if (generator) {
      repairPosition = generator.getRepairPositionById(
        repairPositionId,
      );
    }
  }

  const shortestDistanceToAKiller = survivor.findShortestDistanceToAKiller(killers);
  
  const { IA: { survivorsTerrorRadiusEscapeThreshold }, PIXELS_PER_DBD_METER } = SIMULATOR_CONSTANTS;
  const { KILLER: { defaultTerrorRadius } } = DBD_CONSTANTS;
  if (shortestDistanceToAKiller! < survivorsTerrorRadiusEscapeThreshold * defaultTerrorRadius * PIXELS_PER_DBD_METER) {
    survivor.intention = SurvivorIntention.ESCAPE;
  } else {
    survivor.intention = SurvivorIntention.REPAIR;
    survivor.focusNearestRepairPosition(generators.values());
  }

  const { intention, phaserInstance: { x: survivorXPosition, y: survivorYPosition } } = survivor;

  switch (intention) {
    case SurvivorIntention.REPAIR:
      if (repairPosition) {
        moveTowardsOrAwayFrom(survivor, repairPosition.coordinates, true);
        if (
          distanceBetween2Points(
            survivorXPosition, survivorYPosition,
            repairPosition.coordinates.x, repairPosition.coordinates.y,
          ) <= DBD_CONSTANTS.SURVIVOR.radius &&
          !repairPosition.isOccupied
        ) {
          survivor.phaserInstance.x = repairPosition.coordinates.x;
          survivor.phaserInstance.y = repairPosition.coordinates.y;
          survivor.phaserInstance.setPosition(
            repairPosition.coordinates.x, repairPosition.coordinates.y,
          );
          survivor.speedX = 0;
          survivor.speedY = 0;
          survivor.phaserInstance.setVelocity(0, 0);
        }
      }
      break;
    case SurvivorIntention.ESCAPE:
      survivor.runAwayFromNearestKiller(killers);
      break;
    default:
      break;
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

export const moveTowardsOrAwayFrom = (character: Survivor | Killer, point: Coordinates, towards: boolean) => {
  const { xComponent, yComponent } = getUnitVectorFromPoint1To2(
    character.phaserInstance.x,
    character.phaserInstance.y,
    point.x,
    point.y,
  );
  const { KILLER, SURVIVOR } = DBD_CONSTANTS;
  const { PIXELS_PER_DBD_METER, SPEED_MULTIPLIER } = SIMULATOR_CONSTANTS;

  let speed: number = 0;
  if ('isSurvivor' in character) speed = SURVIVOR.defaultSpeed;
  else if ('isKiller' in character) speed = KILLER.speed;

  const finalSpeedX = xComponent * (towards ? 1 : -1) * speed * character.movementSpeedModifier * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
  const finalSpeedY = yComponent * (towards ? 1 : -1) * speed * character.movementSpeedModifier * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER;
  character.speedX = finalSpeedX;
  character.speedY = finalSpeedY;
  character.phaserInstance.setVelocity(finalSpeedX, finalSpeedY);
};
