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
  CROSSHAIR: {
    radius: 5,
    image: {
      name: 'crosshair',
      path: 'assets/crosshair-5x5.png',
    },
  },
  ACTIVE_IA: {
    killer: false,
  },
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
    defaultTerrorRadius: 32,
  },
  MINIMUM_SPAWN_DISTANCE_BETWEEN_ELEMENTS: 12.5,
};

export enum SurvivorIntention {
  IDLE = 'IDLE',
  REPAIR = 'REPAIR',
};

export enum KillerIntention {
  IDLE = 'IDLE',
  CHASE = 'CHASE',
};

export interface Coordinates {
  x: number,
  y: number,
};
