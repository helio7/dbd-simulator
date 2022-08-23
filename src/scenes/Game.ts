import Phaser, { Scene } from 'phaser';
import { circleAndRectangleOverlap } from '../functions/geometry/circleAndRectangleOverlap';
import { circlesOverlap } from '../functions/geometry/circlesOverlap';
import { distanceBetween2Points } from '../functions/geometry/distanceBetween2Points';
import { getUnitVectorFromPoint1To2 } from '../functions/geometry/getUnitVectorFromPoint1To2';
import { randomIntFromInterval } from '../functions/math/randomIntFromInterval';

const SIMULATOR_CONSTANTS = {
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

const DBD_CONSTANTS = {
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

class Generator extends Phaser.Class {
  positionX: number;
  positionY: number;
  phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  body: any;

  constructor(scene: Scene, x: number, y: number, phaserInstance: Phaser.Types.Physics.Arcade.ImageWithDynamicBody) {
    super({});
    this.positionX = x;
    this.positionY = y;
    this.phaserInstance = phaserInstance;
    this.body = scene.add.group();
  }
}

class Killer extends Phaser.Class {
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

enum SurvivorIntention {
  IDLE = 'IDLE',
  REPAIR = 'REPAIR',
}

enum KillerIntention {
  IDLE = 'IDLE',
  CHASE = 'CHASE',
}

class Survivor extends Phaser.Class {
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

interface GeneratorInterface {
  initialPosition: Coordinates;
  entity: Generator;
}
const generators: GeneratorInterface[] = [];

interface SurvivorInterface {
  initialPosition: Coordinates;
  entity: Survivor;
}
const survivors: SurvivorInterface[] = [];

interface KillerInterface {
  initialPosition: Coordinates;
  entity: Killer;
}
const killers: KillerInterface[] = [];

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

      generators.push({
        initialPosition: coordinates,
        entity: new Generator(
          this,
          coordinates.x, coordinates.y,
          myGenerators.create(
            coordinates.x,
            coordinates.y,
            'generator',
          ),
        ),
      });
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

      survivors.push({
        initialPosition: coordinates,
        entity: new Survivor(this, coordinates.x, coordinates.y, survivorInstance),
      });
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

    killers.push({
      initialPosition,
      entity: new Killer(this, initialPosition.x, initialPosition.y, killerInstance),
    });

    for (const { entity } of survivors) {
      this.physics.add.collider(entity.phaserInstance, myGenerators);
      this.physics.add.collider(entity.phaserInstance, killerInstance);
    }

    for (let i = 0; i < survivors.length; i++) {
      this.physics.add.collider(survivors[i].entity.phaserInstance, myGenerators);
      this.physics.add.collider(survivors[i].entity.phaserInstance, killerInstance);

      for (let j = i; j < survivors.length; j++) {
        this.physics.add.collider(survivors[i].entity.phaserInstance, survivors[j].entity.phaserInstance);
      }
    }

    this.physics.add.collider(killerInstance, myGenerators);
  }

  update(time: number, delta: number): void {

    // Update positions.
    for (const { entity } of survivors) {
      entity.positionX = entity.phaserInstance.x;
      entity.positionY = entity.phaserInstance.y;
    }
    for (const { entity } of killers) {
      entity.positionX = entity.phaserInstance.x;
      entity.positionY = entity.phaserInstance.y;
    }

    for (const { entity: survivor } of survivors) {

      if (time > 3000) {
        if (survivor.intention === SurvivorIntention.IDLE) {
          survivor.intention = SurvivorIntention.REPAIR;
          survivor.focusNearestGenerator(generators.map(gen => gen.entity));
          const { xComponent, yComponent } = survivor.runTowardsObjective();
          survivor.phaserInstance.setVelocity(xComponent, yComponent);
        }

        if (survivor.isInHurtAnimation && survivor.hurtAnimationEndsAt && time >= survivor.hurtAnimationEndsAt) {
          survivor.stopHurtAnimation();
        }
      }

      if (survivor.collideWithKiller(killers[0].entity) && !survivor.isInHurtAnimation) {
        survivor.loseHealthState();
        survivor.beginHurtAnimation(time + 1000);
        console.log('COLLISION');
      }
      if (survivor.intention === SurvivorIntention.REPAIR) {

        if (!survivor.objectiveFocused) survivor.focusNearestGenerator(generators.map(gen => gen.entity));



        
      }
    }

    for (const { entity: killer } of killers) {
      if (time > 3000) {
        if (killer.intention === KillerIntention.IDLE) {
          killer.intention = KillerIntention.CHASE;
          killer.focusNearestSurvivor(survivors.map(surv => surv.entity));
          const { xComponent, yComponent } = killer.runTowardsObjective();
          killer.phaserInstance.setVelocity(xComponent, yComponent);
        } else if (killer.intention === KillerIntention.CHASE) {
          killer.focusNearestSurvivor(survivors.map(surv => surv.entity));
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

interface Coordinates {
  x: number,
  y: number,
}
