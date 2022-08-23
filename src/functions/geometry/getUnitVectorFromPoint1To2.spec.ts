import { getUnitVectorFromPoint1To2 } from "./getUnitVectorFromPoint1To2";

describe('getUnitVectorFromPoint1To2 function should return a correct vector', () => {
   test('when point B is below and to the right of point A.', () => {
      const { xComponent: x, yComponent: y, magnitude } = getUnitVectorFromPoint1To2(2, 2, 3, 1);
      expect(parseFloat(x.toFixed(4))).toBe(0.7071);
      expect(parseFloat(y.toFixed(4))).toBe(-0.7071);
      expect(magnitude).toEqual(1);
   });
   test('when point B is below and to the left of point A.', () => {
      const { xComponent: x, yComponent: y, magnitude } = getUnitVectorFromPoint1To2(2, 2, 1, 1);
      expect(parseFloat(x.toFixed(4))).toBe(-0.7071);
      expect(parseFloat(y.toFixed(4))).toBe(-0.7071);
      expect(magnitude).toEqual(1);
   });
   test('when point B is above and to the right of point A.', () => {
      const { xComponent: x, yComponent: y, magnitude } = getUnitVectorFromPoint1To2(2, 2, 3, 3);
      expect(parseFloat(x.toFixed(4))).toBe(0.7071);
      expect(parseFloat(y.toFixed(4))).toBe(0.7071);
      expect(magnitude).toEqual(1);
   });
   test('when point B is above and to the left of point A.', () => {
      const { xComponent: x, yComponent: y, magnitude } = getUnitVectorFromPoint1To2(2, 2, 1, 3);
      expect(parseFloat(x.toFixed(4))).toBe(-0.7071);
      expect(parseFloat(y.toFixed(4))).toBe(0.7071);
      expect(magnitude).toEqual(1);
   });
});


