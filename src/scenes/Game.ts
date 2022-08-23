import Phaser from 'phaser';
import { Generator } from '../classes/generator';
import { Killer } from '../classes/killer';
import { Survivor } from '../classes/survivor';
import { circleAndRectangleOverlap } from '../functions/geometry/circleAndRectangleOverlap';
import { circlesOverlap } from '../functions/geometry/circlesOverlap';
import { randomIntFromInterval } from '../functions/math/randomIntFromInterval';

export const SIMULATOR_CONSTANTS = {
  STATUS_BAR: {
    dimensions: {
      x: 100,
    },
  },
  PLAYABLE_MAP: {
    dimensions: {
      x: 600,
      y: 600,
    },
  },
  PIXELS_PER_DBD_METER: 6,
  SPEED_MULTIPLIER: 1, // 10,
};

export const DBD_CONSTANTS = {
  GENERATOR: {
    dimensions: {
      x: 25,
      y: 20,
    },
    image: {
      name: 'generator',
      path: 'assets/generator_25x20.png',
    },
  },
  SURVIVOR: {
    radius: 8.5,
    defaultSpeed: 4,
    image: {
      name: 'blue_ball',
      path: 'assets/blue_ball-17x17.png',
    },
  },
  KILLER: {
    radius: 9.5,
    speed: 4.6,
    image: {
      name: 'purple_ball',
      path: 'assets/purple_ball-19x19.png',
    },
  },
  MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS: 12.5,
}

export enum SurvivorIntention {
  IDLE = 'IDLE',
  REPAIR = 'REPAIR',
}

export enum KillerIntention {
  IDLE = 'IDLE',
  CHASE = 'CHASE',
}

const generators: Generator[] = [];
const survivors: Survivor[] = [];
const killers: Killer[] = [];

export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    const { GENERATOR, SURVIVOR, KILLER } = DBD_CONSTANTS;
    this.load.image(GENERATOR.image.name, GENERATOR.image.path);
    this.load.image(SURVIVOR.image.name, SURVIVOR.image.path);
    this.load.image(KILLER.image.name, KILLER.image.path);
  }

  create() {
    const rectanglesOccupiedSpace: Phaser.Geom.Rectangle[] = [];
    const circlesOccupiedSpace: Phaser.Geom.Circle[] = [];

    const {
      STATUS_BAR,
      PLAYABLE_MAP,
      PIXELS_PER_DBD_METER,
      SPEED_MULTIPLIER,
    } = SIMULATOR_CONSTANTS;

    const { KILLER, SURVIVOR, GENERATOR } = DBD_CONSTANTS;

    const map = new Phaser.Geom.Rectangle(
      STATUS_BAR.dimensions.x,
      0,
      PLAYABLE_MAP.dimensions.x,
      PLAYABLE_MAP.dimensions.y,
    );
    this.add.graphics()
          .lineStyle(5, 0x00ffff, 0.5)
          .strokeRectShape(map);

    const spawnableMap = new Phaser.Geom.Rectangle(
      STATUS_BAR.dimensions.x + 0.1 * PLAYABLE_MAP.dimensions.x,
      0.1 * PLAYABLE_MAP.dimensions.y,
      0.8 * PLAYABLE_MAP.dimensions.x,
      0.8 * PLAYABLE_MAP.dimensions.y,
    );
    /* this.add.graphics()
          .lineStyle(5, 0x00ffff, 0.5)
          .strokeRectShape(spawnableMap); */

    let myGenerators = this.physics.add.staticGroup();
    for (let i = 0; i < 7; i++) {
      let coordinates = calculateGeneratorCoordinates();

      let rectangleInstance = new Phaser.Geom.Rectangle(
        coordinates.x - GENERATOR.dimensions.x / 2,
        coordinates.y - GENERATOR.dimensions.y / 2,
        GENERATOR.dimensions.x,
        GENERATOR.dimensions.y,
      );

      let freeSpaceFound = false;
      while (!freeSpaceFound) {
        let spaceAlreadyOccupied = false;
        for (const element of rectanglesOccupiedSpace) {
          if (
            Phaser.Geom.Rectangle.Overlaps(
              rectangleInstance,
              element,
            )
          ) {
            spaceAlreadyOccupied = true;
            coordinates = calculateGeneratorCoordinates();
            rectangleInstance = new Phaser.Geom.Rectangle(
              coordinates.x - GENERATOR.dimensions.x / 2,
              coordinates.y - GENERATOR.dimensions.y / 2,
              GENERATOR.dimensions.x,
              GENERATOR.dimensions.y,
            );
            break;
          }
        }
        if (!spaceAlreadyOccupied) freeSpaceFound = true;
      }

      rectanglesOccupiedSpace.push(
        new Phaser.Geom.Rectangle(
          coordinates.x - GENERATOR.dimensions.x / 2 - DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS,
          coordinates.y - GENERATOR.dimensions.y / 2 - DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS,
          GENERATOR.dimensions.x + 2 * DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS,
          GENERATOR.dimensions.y + 2 * DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS,
        ),
      );

      generators.push(
        new Generator(
          this,
          coordinates.x, coordinates.y,
          myGenerators.create(
            coordinates.x,
            coordinates.y,
            'generator',
          ),
        ),
      );
    }

    for (let i = 0; i < 4; i++) {
      let coordinates = calculateSurvivorCoordinates();

      let freeSpaceFound = false;
      while (!freeSpaceFound) {
        let spaceAlreadyOccupied = false;

        for (const rectangle of rectanglesOccupiedSpace) {
          if (
            circleAndRectangleOverlap(
              SURVIVOR.radius, coordinates.x, coordinates.y,
              rectangle.x, rectangle.y,
              rectangle.x + rectangle.width, rectangle.y + rectangle.height,
            )
          ) {
            spaceAlreadyOccupied = true;
            coordinates = calculateSurvivorCoordinates();
            break;
          }
        }

        if (!spaceAlreadyOccupied) {
          for (const circle of circlesOccupiedSpace) {
            if (
              circlesOverlap(
                coordinates.x, coordinates.y, SURVIVOR.radius,
                circle.x, circle.y, circle.radius,
              )
            ) {
              spaceAlreadyOccupied = true;
              coordinates = calculateSurvivorCoordinates();
              break;
            }
          }
        }

        if (!spaceAlreadyOccupied) freeSpaceFound = true;
      }

      const survivorInstance = this.physics.add.image(
        coordinates.x,
        coordinates.y,
        'blue_ball',
      );

      circlesOccupiedSpace.push(
        new Phaser.Geom.Circle(coordinates.x, coordinates.y, SURVIVOR.radius + DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS),
      );

      survivorInstance.setCircle(SURVIVOR.radius);
      survivorInstance.setMaxVelocity(SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER, SURVIVOR.defaultSpeed * PIXELS_PER_DBD_METER * SPEED_MULTIPLIER);
      survivorInstance.setBounce(1);
      survivorInstance.setCollideWorldBounds(true);
      survivorInstance.body.setBoundsRectangle(map);

      survivors.push(
        new Survivor(this, coordinates.x, coordinates.y, survivorInstance),
      );
    }

    const initialPosition = calculateKillerCoordinates();

    const killerInstance = this.physics.add.image(
        initialPosition.x,
        initialPosition.y,
        'purple_ball'
    );
    killerInstance.setCircle(KILLER.radius);
    killerInstance.setBounce(1);
    killerInstance.setCollideWorldBounds(true);
    killerInstance.body.setBoundsRectangle(map);

    killers.push(
      new Killer(this, initialPosition.x, initialPosition.y, killerInstance),
    );

    for (const survivor of survivors) {
      this.physics.add.collider(survivor.phaserInstance, myGenerators);
      this.physics.add.collider(survivor.phaserInstance, killerInstance);
    }

    for (let i = 0; i < survivors.length; i++) {
      this.physics.add.collider(survivors[i].phaserInstance, myGenerators);
      this.physics.add.collider(survivors[i].phaserInstance, killerInstance);

      for (let j = i; j < survivors.length; j++) {
        this.physics.add.collider(survivors[i].phaserInstance, survivors[j].phaserInstance);
      }
    }

    this.physics.add.collider(killerInstance, myGenerators);
  }

  update(time: number, delta: number): void {

    // Update positions.
    for (const survivor of survivors) {
      survivor.positionX = survivor.phaserInstance.x;
      survivor.positionY = survivor.phaserInstance.y;
    }
    for (const killer of killers) {
      killer.positionX = killer.phaserInstance.x;
      killer.positionY = killer.phaserInstance.y;
    }

    for (const survivor of survivors) {

      if (time > 3000) {
        if (survivor.intention === SurvivorIntention.IDLE) {
          survivor.intention = SurvivorIntention.REPAIR;
          survivor.focusNearestGenerator(generators);
          const { xComponent, yComponent } = survivor.runTowardsObjective();
          survivor.phaserInstance.setVelocity(xComponent, yComponent);
        }

        if (survivor.isInHurtAnimation && survivor.hurtAnimationEndsAt && time >= survivor.hurtAnimationEndsAt) {
          survivor.stopHurtAnimation();
        }
      }

      if (survivor.collideWithKiller(killers[0]) && !survivor.isInHurtAnimation) {
        survivor.loseHealthState();
        survivor.beginHurtAnimation(time + 1000);
        console.log('COLLISION');
      }
      if (survivor.intention === SurvivorIntention.REPAIR) {

        if (!survivor.objectiveFocused) survivor.focusNearestGenerator(generators);



        
      }
    }

    for (const killer of killers) {
      if (time > 3000) {
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
    }
  }
}

function calculateGeneratorCoordinates(): Coordinates {
  const { STATUS_BAR, PLAYABLE_MAP } = SIMULATOR_CONSTANTS;
  const { GENERATOR } = DBD_CONSTANTS;
  return {
    x: STATUS_BAR.dimensions.x + 0.1 * PLAYABLE_MAP.dimensions.x + randomIntFromInterval(GENERATOR.dimensions.x / 2, 0.8 * PLAYABLE_MAP.dimensions.x - GENERATOR.dimensions.x / 2),
    y: 0.1 * PLAYABLE_MAP.dimensions.y + randomIntFromInterval(GENERATOR.dimensions.y / 2, 0.8 * PLAYABLE_MAP.dimensions.y - GENERATOR.dimensions.y / 2),
  };
}
function calculateSurvivorCoordinates(): Coordinates {
  const { STATUS_BAR, PLAYABLE_MAP } = SIMULATOR_CONSTANTS;
  const { SURVIVOR } = DBD_CONSTANTS;
  return {
    x: STATUS_BAR.dimensions.x + 0.1 * PLAYABLE_MAP.dimensions.x + randomIntFromInterval(SURVIVOR.radius, 0.8 * PLAYABLE_MAP.dimensions.x - SURVIVOR.radius),
    y: 0.1 * PLAYABLE_MAP.dimensions.y + randomIntFromInterval(SURVIVOR.radius, 0.8 * PLAYABLE_MAP.dimensions.y - SURVIVOR.radius),
  };
}
function calculateKillerCoordinates(): Coordinates {
  const { STATUS_BAR, PLAYABLE_MAP } = SIMULATOR_CONSTANTS;
  const { KILLER } = DBD_CONSTANTS;
  return {
    x: STATUS_BAR.dimensions.x + 0.1 * PLAYABLE_MAP.dimensions.x + randomIntFromInterval(KILLER.radius, 0.8 * PLAYABLE_MAP.dimensions.x - KILLER.radius),
    y: 0.1 * PLAYABLE_MAP.dimensions.y + randomIntFromInterval(KILLER.radius, 0.8 * PLAYABLE_MAP.dimensions.y - KILLER.radius),
  };
}

export interface Coordinates {
  x: number,
  y: number,
}
