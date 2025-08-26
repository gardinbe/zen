import { type Result } from './result';
import { Http404Error, HttpGenericError, FetchFailedError, AbortError, ParseError } from './error';
import { withAbortableResult } from './abortable';

export type FetchError = Http404Error | HttpGenericError | FetchFailedError;

/**
 * Basic HTTP client.
 */
export const http = {
  /**
   * Fetches content from the given URL and returns the response.
   * @param url URL to fetch.
   * @param signal Abort signal.
   * @returns Response.
   */
  fetch: async (
    url: string,
    signal: AbortSignal | null,
  ): Promise<Result<Response, FetchError | AbortError>> => {
    let res;

    try {
      res = await fetch(url, {
        signal: signal ?? null,
      });

      if (!res.ok) {
        if (res.status === 404) {
          return [null, new Http404Error()];
        }

        return [null, new HttpGenericError()];
      }
    } catch {
      if (signal?.aborted) {
        return [null, new AbortError()];
      }

      return [null, new FetchFailedError()];
    }

    return [res, null];
  },

  parse: {
    /**
     * Parses the response body as text and returns the result.
     * @param res Response to parse.
     * @param signal Abort signal.
     * @returns Parsed text.
     */
    text: (res: Response, signal: AbortSignal | null) => parse<string>(res, 'text', signal),

    /**
     * Parses the response body as JSON and returns the result.
     * @param res Response to parse.
     * @param signal Abort signal.
     * @returns Parsed JSON.
     */
    json: <T>(res: Response, signal: AbortSignal | null) => parse<T>(res, 'json', signal),
  },
} as const;

const parse = async <T>(
  res: Response,
  method: 'text' | 'json',
  signal: AbortSignal | null,
): Promise<Result<T, ParseError | AbortError>> =>
  withAbortableResult<T, ParseError>(
    signal,
    async () => {
      let parsed: T;

      try {
        parsed = await res[method]();
      } catch {
        return [null, new ParseError()];
      }

      return [parsed, null];
    },
    () => {
      if (res.body?.locked) {
        return;
      }

      res.body!.cancel();
    },
  );
