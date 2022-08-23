import { distanceBetween2Points } from "./distanceBetween2Points";

export function circlesOverlap(xc1: number, yc1: number, r1: number, xc2: number, yc2: number, r2: number) {
   const distanceBetweenCenters = distanceBetween2Points(xc1, yc1, xc2, yc2);
   const biggestRadius = r1 > r2 ? r1 : r2;
   return distanceBetweenCenters < biggestRadius;
}
