/**
 * Represents a successful result.
 * @template T Value type.
 */
export type SuccessResult<T = unknown> = [T, null];

/**
 * Represents an error result.
 * @template E Error type.
 */
export type ErrorResult<E = unknown> = [null, E];

/**
 * Represents a value or an error.
 * @template T Value type.
 * @template E Error type.
 */
export type Result<T = unknown, E = unknown> = SuccessResult<T> | ErrorResult<E>;

/**
 * Unwraps a result.
 * @template T Result type.
 */
export type Unwrapped<T> = T extends Result<infer U, never> ? U : never;

export const unwrap: {
  /**
   * Unwraps a result.
   * @param result Result to unwrap.
   * @returns Unwrapped value.
   * @throws Error if the result is an error.
   */
  <T>(result: Result<T>): T;
  <T>(result: PromiseLike<Result<T>>): Promise<T>;
} = (result) => {
  if (isPromiseLike(result)) {
    return result.then(unwrap);
  }

  const [data, error] = result;

  if (error) {
    throw error;
  }

  return data!;
};

export const unwrapAll: {
  /**
   * Unwraps multiple results.
   * @param results Results to unwrap.
   * @returns Unwrapped values.
   * @throws Error if any result is an error.
   */
  <T extends Result[]>(
    ...results: T[]
  ): {
    [K in keyof T]: Unwrapped<T[K]>;
  };
  <T extends PromiseLike<Result[]>, U extends Awaited<T>>(
    results: T,
  ): Promise<{
    [K in keyof U]: Unwrapped<U[K]>;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = (results: Result[] | PromiseLike<Result>[]): any => {
  if (isPromiseLike(results)) {
    return results.then(unwrapAll);
  }

  return results.map(unwrap);
};

/**
 * Checks if a value is Promise-like.
 * @param value Value to check.
 * @returns True if the value is Promise-like.
 */
export const isPromiseLike = <T>(value: T | PromiseLike<T>): value is PromiseLike<T> =>
  typeof value === 'object' && value !== null && 'then' in value;
