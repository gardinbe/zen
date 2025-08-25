import { marked } from 'marked';
import { type Result } from './result';
import { AbortError, ParseError } from './error';

/**
 * Parses markdown text into HTML and returns the result.
 * @param text Markdown text to parse.
 * @param signal Abort signal.
 * @returns Parsed HTML.
 */
export const parseMarkdown = (
  text: string,
  signal: AbortSignal | null,
): Promise<Result<string, ParseError | AbortError>> =>
  new Promise((resolve) => {
    const onAbort = () => {
      resolve([null, new AbortError()]);
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    (async () => {
      try {
        const parsed = await marked.parse(text);
        resolve([parsed, null]);
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
