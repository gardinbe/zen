import { type Result } from './result';
import { Http404Error, HttpGenericError, FetchFailedError, AbortError, ParseError } from './error';

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
    text: (res: Response, signal: AbortSignal | null) => parse(res, 'text', signal),

    /**
     * Parses the response body as JSON and returns the result.
     * @param res Response to parse.
     * @param signal Abort signal.
     * @returns Parsed JSON.
     */
    json: <T>(res: Response, signal: AbortSignal | null) => parse(res, 'json', signal) as T,
  },
} as const;

const parse = async (
  res: Response,
  method: 'text' | 'json',
  signal: AbortSignal | null,
): Promise<Result<string, ParseError | AbortError>> =>
  new Promise((resolve) => {
    const onAbort = async () => {
      await res.body?.cancel();
      resolve([null, new AbortError()]);
    };

    signal?.addEventListener('abort', onAbort, {
      once: true,
    });

    (async () => {
      try {
        const text = await res[method]();
        resolve([text, null]);
      } catch {
        if (signal?.aborted) {
          resolve([null, new AbortError()]);
          return;
        }

        resolve([null, new ParseError()]);
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    })();
  });
