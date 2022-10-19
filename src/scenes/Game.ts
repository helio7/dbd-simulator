import Phaser from 'phaser';
import { Generator } from '../classes/generator';
import { Killer } from '../classes/killer';
import { Survivor } from '../classes/survivor';
import { Coordinates, DBD_CONSTANTS, GameElementType, SIMULATOR_CONSTANTS, SurvivorIntention } from '../constants/constants';
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
      CROSSHAIR
    } = SIMULATOR_CONSTANTS;

    const { CINEMATIC_BEGINNING_DURATION_IN_MS } = DBD_CONSTANTS;

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
    const generatorObjectsStaticPhysicsGroup = addGeneratorsToMap(this, 7, rectanglesOccupiedSpace);

    const circlesOccupiedSpace: Phaser.Geom.Circle[] = [];
    const survivorInstances = addSurvivorsToMap(this, 4, rectanglesOccupiedSpace, circlesOccupiedSpace, playableMap);

    const killerInstance = addKillerToMap(this, playableMap);

    for (let i = 0; i < survivorInstances.length; i++) {
      this.physics.add.collider(survivorInstances[i], generatorObjectsStaticPhysicsGroup);
      this.physics.add.collider(survivorInstances[i], killerInstance);
      for (let j = i; j < survivorInstances.length; j++) {
        this.physics.add.collider(survivorInstances[i], survivorInstances[j]);
      }
    }

    this.physics.add.collider(killerInstance, generatorObjectsStaticPhysicsGroup);

    crosshair = this.add.sprite(
      PLAYABLE_MAP.position.x + PLAYABLE_MAP.dimensions.x / 2,
      PLAYABLE_MAP.position.y + PLAYABLE_MAP.dimensions.y / 2,
      'crosshair',
    );

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
        const crosshairMinimumX = PLAYABLE_MAP.position.x + 0.5 * CROSSHAIR.radius;
        const crosshairMaximumX = PLAYABLE_MAP.position.x + PLAYABLE_MAP.dimensions.x - 0.5 * CROSSHAIR.radius;
        if (crosshair.x <= crosshairMinimumX) crosshair.x = crosshairMinimumX;
        else if (crosshair.x >= crosshairMaximumX) crosshair.x = crosshairMaximumX;
        const crosshairMinimumY = PLAYABLE_MAP.position.y + 0.5 * CROSSHAIR.radius;
        const crosshairMaximumY = PLAYABLE_MAP.position.y + PLAYABLE_MAP.dimensions.y - 0.5 * CROSSHAIR.radius;
        if (crosshair.y <= crosshairMinimumY) crosshair.y = crosshairMinimumY;
        else if (crosshair.y >= crosshairMaximumY) crosshair.y = crosshairMaximumY;
      }
    }, this);
  }

  // time => miliseconds
  update(time: number, delta: number): void {
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
        if (!survivor.repairPositionFocused) survivor.focusNearestRepairPosition(generators.values());
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
        killer.terrorRadiusIndicatorInstance.setPosition(killer.phaserInstance.x, killer.phaserInstance.y);
      }
    }
  }
}

function addGeneratorsToMap(
  gameScene: Phaser.Scene,
  numberOfGenerators: number,
  rectanglesOccupiedSpace: Phaser.Geom.Rectangle[],
): Phaser.Physics.Arcade.StaticGroup {
  const { GENERATOR } = DBD_CONSTANTS;

  let generatorObjectsStaticPhysicsGroup = gameScene.physics.add.staticGroup();
  for (let i = 0; i < numberOfGenerators; i++) {
    let coordinates = calculateGameElementCoordinates(GameElementType.GENERATOR);

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
          coordinates = calculateGameElementCoordinates(GameElementType.GENERATOR);
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
        gameScene,
        coordinates.x, coordinates.y,
        generatorObjectsStaticPhysicsGroup.create(
          coordinates.x,
          coordinates.y,
          'generator',
        ),
      ),
    );
  }

  return generatorObjectsStaticPhysicsGroup;
}

function addSurvivorsToMap(
  gameScene: Phaser.Scene,
  numberOfSurvivors: number,
  rectanglesOccupiedSpace: Phaser.Geom.Rectangle[],
  circlesOccupiedSpace: Phaser.Geom.Circle[],
  playableMap: Phaser.Geom.Rectangle,
): Phaser.Types.Physics.Arcade.ImageWithDynamicBody[] {
  const { SURVIVOR } = DBD_CONSTANTS;

  const survivorInstances = [];

  for (let i = 0; i < numberOfSurvivors; i++) {
    let coordinates = calculateGameElementCoordinates(GameElementType.SURVIVOR);

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
          coordinates = calculateGameElementCoordinates(GameElementType.SURVIVOR);
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
            coordinates = calculateGameElementCoordinates(GameElementType.SURVIVOR);
            break;
          }
        }
      }

      if (!spaceAlreadyOccupied) freeSpaceFound = true;
    }

    const survivorInstance = gameScene.physics.add.image(
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
    const portraitCharacterImageInstance = gameScene.physics.add.image(
      STATUS_BAR.dimensions.x / 2,
      yMargin + height / 2 + (yMargin + height) * i,
      image.name.replace('COLOR', SURVIVOR.colors[i])
    );

    const portraitStatusImageInstance = gameScene.physics.add.image(
      STATUS_BAR.dimensions.x / 2,
      yMargin + height / 2 + (yMargin + height) * i,
      'transparent',
    );

    survivors.push(
      new Survivor(gameScene, survivorInstance, true, false, portraitCharacterImageInstance, portraitStatusImageInstance),
    );

    survivorInstances.push(survivorInstance);
  }

  return survivorInstances;
}

function addKillerToMap(
  gameScene: Phaser.Scene,
  playableMap: Phaser.Geom.Rectangle,
): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
  const { KILLER } = DBD_CONSTANTS;
  const { PIXELS_PER_DBD_METER } = SIMULATOR_CONSTANTS;

  const initialPosition = calculateGameElementCoordinates(GameElementType.KILLER);

  const killerInstance = gameScene.physics.add.image(
    initialPosition.x,
    initialPosition.y,
    'purple_ball'
  );
  killerInstance.setCircle(KILLER.radius);
  killerInstance.setBounce(1);
  killerInstance.setCollideWorldBounds(true);
  killerInstance.body.setBoundsRectangle(playableMap);

  const terrorRadiusIndicatorInstance = gameScene.add.graphics()
    .strokeCircle(0, 0, KILLER.defaultTerrorRadius * PIXELS_PER_DBD_METER);

  terrorRadiusIndicatorInstance.setPosition(initialPosition.x, initialPosition.y);

  killers.push(
    new Killer(gameScene, killerInstance, SIMULATOR_CONSTANTS.ACTIVE_IA.killers, KILLER.defaultTerrorRadius * PIXELS_PER_DBD_METER, terrorRadiusIndicatorInstance),
  );

  return killerInstance;
}

function calculateGameElementCoordinates(gameElementType: GameElementType): Coordinates {
  const { PLAYABLE_MAP } = SIMULATOR_CONSTANTS;
  const { GENERATOR, SURVIVOR, KILLER } = DBD_CONSTANTS;

  const coordinates = {
    x: PLAYABLE_MAP.position.x + 0.1 * PLAYABLE_MAP.dimensions.x,
    y: PLAYABLE_MAP.position.y + 0.1 * PLAYABLE_MAP.dimensions.y,
  };

  let xMin = null;
  let xMax = 0.8 * PLAYABLE_MAP.dimensions.x;
  let yMin = null;
  let yMax = 0.8 * PLAYABLE_MAP.dimensions.y;
  switch (gameElementType) {
    case GameElementType.GENERATOR:
      xMin = GENERATOR.dimensions.x / 2;
      xMax -= GENERATOR.dimensions.x / 2;
      yMin = GENERATOR.dimensions.y / 2;
      yMax -= GENERATOR.dimensions.y / 2;
      break;
    case GameElementType.SURVIVOR:
      xMin = SURVIVOR.radius;
      xMax -= SURVIVOR.radius;
      yMin = SURVIVOR.radius;
      yMax -= SURVIVOR.radius;
      break;
    case GameElementType.KILLER:
      xMin = KILLER.radius;
      xMax -= KILLER.radius;
      yMin = KILLER.radius;
      yMax -= KILLER.radius;
      break;
    default:
      throw new Error(`Invalid game element type: ${gameElementType}`);
  }
  coordinates.x += randomIntFromInterval(xMin, xMax);
  coordinates.y += randomIntFromInterval(yMin, yMax);

  return coordinates;
}
