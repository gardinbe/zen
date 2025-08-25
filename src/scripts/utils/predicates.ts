/**
 * Checks if a value is truthy.
 *
 * Acts as a more accurate predicate than `Boolean(value)`.
 * @param value Value to check.
 * @returns True if the value is truthy.
 */
export const isTruthy = <T>(value: T): value is Exclude<T, false | 0 | '' | null | undefined> =>
  Boolean(value);
