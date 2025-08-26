import { marked } from 'marked';
import { AbortError, ParseError } from './error';
import { withAbortableResult } from './abortable';
import { type Result } from './result';

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
  withAbortableResult<string, ParseError>(signal, async () => {
    let parsed: string;

    try {
      parsed = await marked.parse(text);
    } catch {
      return [null, new ParseError()];
    }

    return [parsed, null] as const;
  });
