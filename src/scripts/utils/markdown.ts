import { marked } from 'marked';
import { type Result, AbortError } from './result';

/**
 * Parses markdown text into HTML and returns the result.
 * @param text Markdown text to parse.
 * @param signal Abort signal.
 * @returns Parsed HTML.
 */
export const parseMarkdown = (
  text: string,
  signal: AbortSignal | null,
): Promise<Result<string, AbortError>> =>
  new Promise((resolve) => {
    const onAbort = () => {
      resolve([null, new AbortError()]);
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    (async () => {
      try {
        const parsed = await marked.parse(text);
        resolve([parsed, null]);
      } catch (error) {
        if (signal?.aborted) {
          resolve([null, new AbortError()]);
          return;
        }

        resolve([null, error as Error]);
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    })();
  });
