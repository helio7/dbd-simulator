interface Vector {
   xComponent: number;
   yComponent: number;
   magnitude: number;
}

export function getUnitVectorFromPoint1To2(x1: number, y1: number, x2: number, y2: number): Vector {
   let xComponent = x2 - x1;
   let yComponent = y2 - y1;
   let magnitude = Math.sqrt(xComponent * xComponent + yComponent * yComponent);

   xComponent = xComponent / magnitude;
   yComponent = yComponent / magnitude;
   magnitude = 1;

   return { xComponent, yComponent, magnitude };
}
