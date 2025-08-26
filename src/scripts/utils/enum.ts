/**
 * Represents an enum,
 * @template T Enum type.
 */
export type Enum<T> = T[keyof T];
