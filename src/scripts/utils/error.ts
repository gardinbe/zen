// general errors

export class AbortError extends Error {
  static is(error: unknown): error is AbortError {
    return error instanceof AbortError;
  }

  #id = 'AbortError';
  override message = this.#id;
}

export class ParseError extends Error {
  static is(error: unknown): error is ParseError {
    return error instanceof ParseError;
  }

  #id = 'ParseError';
  override message = this.#id;
}

export class NotFoundError extends Error {
  static is(error: unknown): error is NotFoundError {
    return error instanceof NotFoundError;
  }

  #id = 'NotFoundError';
  override message = this.#id;
}

export class MissingError extends Error {
  static is(error: unknown): error is MissingError {
    return error instanceof MissingError;
  }

  #id = 'MissingError';
  override message = this.#id;
}

// fetch/http errors

export class FetchFailedError extends Error {
  static is(error: unknown): error is FetchFailedError {
    return error instanceof FetchFailedError;
  }

  #id = 'FetchFailedError';
  override message = this.#id;
}

export class Http404Error extends Error {
  static is(error: unknown): error is Http404Error {
    return error instanceof Http404Error;
  }

  #id = 'Http404Error';
  override message = this.#id;
}

export class HttpGenericError extends Error {
  static is(error: unknown): error is HttpGenericError {
    return error instanceof HttpGenericError;
  }

  #id = 'HttpGenericError';
  override message = this.#id;
}
