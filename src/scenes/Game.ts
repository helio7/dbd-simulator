import Phaser from 'phaser';
import { Generator } from '../classes/generator';
import { Killer } from '../classes/killer';
import { Survivor } from '../classes/survivor';
import { Coordinates, DBD_CONSTANTS, SIMULATOR_CONSTANTS, SurvivorIntention } from '../constants/constants';
import { circleAndRectangleOverlap } from '../functions/geometry/circleAndRectangleOverlap';
import { circlesOverlap } from '../functions/geometry/circlesOverlap';
import { simulateDummyMovement, simulateKillerBehavior, simulateSurvivorBehavior } from '../functions/ia';
import { randomIntFromInterval } from '../functions/math/randomIntFromInterval';

const generators: Map<number, Generator> = new Map();
const survivors: Survivor[] = [];
const killers: Killer[] = [];
let wasdKeys: any;
let crosshair: any;

let gameStartMilisecond: number | null = null;

export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    const { GENERATOR, SURVIVOR, KILLER } = DBD_CONSTANTS;
    const { CROSSHAIR, UI } = SIMULATOR_CONSTANTS;

    const images = [
      { key: GENERATOR.image.name, url: GENERATOR.image.path },
      { key: SURVIVOR.image.name, url: SURVIVOR.image.path },
      { key: KILLER.image.name, url: KILLER.image.path },
      { key: CROSSHAIR.image.name, url: CROSSHAIR.image.path },
      { key: 'transparent', url: 'assets/transparent-51x51.png' },
      { key: 'injured', url: 'assets/injured-51x51.png' },
      { key: 'downed', url: 'assets/downed-51x51.png' },
    ];

    for (const color of SURVIVOR.colors) {
      images.push({ key: SURVIVOR.image.name.replace('COLOR', color), url: SURVIVOR.image.path.replace('COLOR', color) });
      images.push({ key: UI.SURVIVOR_PORTRAIT.image.name.replace('COLOR', color), url: UI.SURVIVOR_PORTRAIT.image.path.replace('COLOR', color) });
    }

    for (const { key, url } of images) this.load.image(key, url);
  }

  create() {
    const {
      STATUS_BAR,
      PLAYABLE_MAP,
      PIXELS_PER_DBD_METER,
      CROSSHAIR
    } = SIMULATOR_CONSTANTS;

    const { KILLER, SURVIVOR, GENERATOR, CINEMATIC_BEGINNING_DURATION_IN_MS } = DBD_CONSTANTS;

    gameStartMilisecond = this.time.now + CINEMATIC_BEGINNING_DURATION_IN_MS;

    const playableMap = new Phaser.Geom.Rectangle(
      STATUS_BAR.dimensions.x,
      PLAYABLE_MAP.position.y,
      PLAYABLE_MAP.dimensions.x,
      PLAYABLE_MAP.dimensions.y,
    );
    this.add.graphics()
      .lineStyle(1, 0xffffff)
      .strokeRectShape(playableMap);

    const rectanglesOccupiedSpace: Phaser.Geom.Rectangle[] = [];
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

      generators.set(
        i + 1,
        new Generator(
          i + 1,
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

    const circlesOccupiedSpace: Phaser.Geom.Circle[] = [];
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
        DBD_CONSTANTS.SURVIVOR.image.name.replace('COLOR', DBD_CONSTANTS.SURVIVOR.colors[i]),
      );

      circlesOccupiedSpace.push(
        new Phaser.Geom.Circle(coordinates.x, coordinates.y, SURVIVOR.radius + DBD_CONSTANTS.MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS),
      );

      survivorInstance.setCircle(SURVIVOR.radius);
      survivorInstance.setBounce(1);
      survivorInstance.setCollideWorldBounds(true);
      survivorInstance.body.setBoundsRectangle(playableMap);

      const { STATUS_BAR, UI: { SURVIVOR_PORTRAIT: { yMargin, height, image } } } = SIMULATOR_CONSTANTS;
      const portraitCharacterImageInstance = this.physics.add.image(
        STATUS_BAR.dimensions.x / 2,
        yMargin + height / 2 + (yMargin + height) * i,
        image.name.replace('COLOR', SURVIVOR.colors[i])
      );

      const portraitStatusImageInstance = this.physics.add.image(
        STATUS_BAR.dimensions.x / 2,
        yMargin + height / 2 + (yMargin + height) * i,
        'transparent',
      );

      survivors.push(
        new Survivor(this, coordinates.x, coordinates.y, survivorInstance, true, false, portraitCharacterImageInstance, portraitStatusImageInstance),
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
    killerInstance.body.setBoundsRectangle(playableMap);

    const terrorRadiusIndicatorInstance = this.add.graphics()
      .strokeCircle(0, 0, KILLER.defaultTerrorRadius * PIXELS_PER_DBD_METER);

    terrorRadiusIndicatorInstance.setPosition(initialPosition.x, initialPosition.y);

    killers.push(
      new Killer(this, initialPosition.x, initialPosition.y, killerInstance, SIMULATOR_CONSTANTS.ACTIVE_IA.killers, KILLER.defaultTerrorRadius * PIXELS_PER_DBD_METER, terrorRadiusIndicatorInstance),
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

    crosshair = this.add.sprite(400, 300, 'crosshair');

    wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
    });

    this.input.on('pointerdown', (pointer: any) => {
      this.input.mouse.requestPointerLock();
    }, this);

    this.input.on('pointermove', (pointer: any) => {
      if (this.input.mouse.locked) {
        crosshair.x += pointer.movementX;
        crosshair.y += pointer.movementY;
        const crosshairMinimumX = STATUS_BAR.dimensions.x + 0.5 * CROSSHAIR.radius;
        const crosshairMaximumX = STATUS_BAR.dimensions.x + PLAYABLE_MAP.dimensions.x - 0.5 * CROSSHAIR.radius;
        if (crosshair.x <= crosshairMinimumX) crosshair.x = crosshairMinimumX;
        else if (crosshair.x >= crosshairMaximumX) crosshair.x = crosshairMaximumX;
        const crosshairMinimumY = 0.5 * CROSSHAIR.radius;
        const crosshairMaximumY = PLAYABLE_MAP.dimensions.y - 0.5 * CROSSHAIR.radius;
        if (crosshair.y <= crosshairMinimumY) crosshair.y = crosshairMinimumY;
        else if (crosshair.y >= crosshairMaximumY) crosshair.y = crosshairMaximumY;
      }
    }, this);
  }

  // time => miliseconds
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
      if (gameStartMilisecond && time > gameStartMilisecond) {
        if (survivor.dummyMovement) {
          simulateDummyMovement(survivor);
          continue;
        } else if (survivor.controlledByIa) simulateSurvivorBehavior(generators, survivor, time, killers);
      }
      if (survivor.collideWithKiller(killers[0]) && !survivor.isInHurtAnimation) {
        survivor.receiveBasicAttack();
        survivor.beginHurtAnimation(time + 1000);
        survivor.applyMovementSpeedModifier(0.5);
        this.time.addEvent({
          delay: 1800,
          callback: () => {
            survivor.applyMovementSpeedModifier(-0.5);
          },
        });
        killers[0].applyMovementSpeedModifier(-0.5);
        this.time.addEvent({
          delay: 2700,
          callback: () => {
            killers[0].applyMovementSpeedModifier(0.5);
          },
        });
        console.log('COLLISION');
      }
      if (survivor.controlledByIa && survivor.intention === SurvivorIntention.REPAIR) {
        if (!survivor.repairPositionFocused) survivor.focusNearestGenerator(generators.values());
      }
    }

    for (const killer of killers) {
      if (gameStartMilisecond && time > gameStartMilisecond) {
        if (killer.controlledByIa) simulateKillerBehavior(killer, survivors);
        else {
          let xVelocity: number = 0;
          let yVelocity: number = 0;
  
          let up = wasdKeys.up.isDown;
          let right = wasdKeys.right.isDown;
          let down = wasdKeys.down.isDown;
          let left = wasdKeys.left.isDown;
  
          const killerVelocity = DBD_CONSTANTS.KILLER.speed * SIMULATOR_CONSTANTS.PIXELS_PER_DBD_METER * SIMULATOR_CONSTANTS.SPEED_MULTIPLIER;
  
          if (up) yVelocity -= killerVelocity;
          if (down) yVelocity += killerVelocity;
          if (left) xVelocity -= killerVelocity;
          if (right) xVelocity += killerVelocity;

          if (xVelocity && yVelocity) {
            xVelocity = 0.5 * Math.sqrt(2) * xVelocity;
            yVelocity = 0.5 * Math.sqrt(2) * yVelocity;
          }
  
          killer.phaserInstance.setVelocity(xVelocity, yVelocity);
        }
        killer.terrorRadiusIndicatorInstance.setPosition(killer.positionX, killer.positionY);
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
