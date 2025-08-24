import { type Result } from './result';

export class HttpNotFoundError extends Error {}
export class HttpGenericError extends Error {}
export class FetchFailedError extends Error {}
export class ParseError extends Error {}
export type FetchError = HttpNotFoundError | HttpGenericError | FetchFailedError;

export const http = {
  /**
   * Fetches content from the given URL and returns the response.
   * @param url URL to fetch.
   * @returns Response.
   */
  fetch: async (url: string): Promise<Result<Response, FetchError>> => {
    let res;

    try {
      res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          return [null, new HttpNotFoundError()];
        }

        return [null, new HttpGenericError()];
      }
    } catch {
      return [null, new FetchFailedError()];
    }

    return [res, null];
  },
  parse: {
    text: (res: Response) => _parse(res, 'text'),
    json: <T>(res: Response) => _parse(res, 'json') as T,
  },
} as const;

const _parse = async (res: Response, method: 'text' | 'json') => {
  try {
    const text = await res[method]();
    return [text, null];
  } catch {
    return [null, new ParseError()];
  }
};
