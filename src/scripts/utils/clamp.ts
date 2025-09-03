/**
 * Clamps the given value within the given range.
 * @param value Value to clamp.
 * @param min Minimum value.
 * @param max Maximum value.
 * @returns Clamped value.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
