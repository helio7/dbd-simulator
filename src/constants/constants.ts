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
  SPEED_MULTIPLIER: 1,
  CROSSHAIR: {
    radius: 5,
    image: {
      name: 'crosshair',
      path: 'assets/crosshair-5x5.png',
    },
  },
  ACTIVE_IA: {
    killers: true,
  },
  IA: {
    survivorsTerrorRadiusEscapeThreshold: 0.25,
  },
  UI: {
    SURVIVOR_PORTRAIT: {
      width: 51,
      height: 51,
      image: {
        name: 'COLOR_ball_portrait',
        path: 'assets/COLOR_ball-51x51.png',
      },
      yMargin: 25
    },
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
    colors: ['blue', 'green', 'orange', 'yellow'],
    image: {
      name: 'COLOR_ball',
      path: 'assets/COLOR_ball-17x17.png',
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
  CINEMATIC_BEGINNING_DURATION_IN_MS: 3000,
};

export enum SurvivorHealthState {
  NORMAL = 'NORMAL',
  INJURED = 'INJURED',
  DOWNED = 'DOWNED',
  CARRIED = 'CARRIED',
  HOOKED = 'HOOKED',
}

export enum SurvivorIntention {
  IDLE = 'IDLE',
  REPAIR = 'REPAIR',
  ESCAPE = 'ESCAPE',
};

export enum KillerIntention {
  IDLE = 'IDLE',
  CHASE = 'CHASE',
};

export interface Coordinates {
  x: number,
  y: number,
};
