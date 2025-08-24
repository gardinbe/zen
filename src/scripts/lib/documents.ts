import { type Result, type FetchError, type ParseError, AbortError } from '../utils/result';
import { parseMarkdown } from '../utils/markdown';
import { http } from '../utils/fetch';

/**
 * Array of available documents.
 *
 * Necessary as it's not possible to get a list of available documents without a dedicated HTTP server.
 */
export const Documents = ['bee-movie.md', 'example.md'];

export type GetDocumentOptions = {
  /**
   * If true, returns the raw markdown content, instead of parsing as HTML.
   * @default false
   */
  raw?: boolean;
};

/**
 * Retrieves and parses a markdown document.
 * @param name Document name.
 * @param signal Abort signal.
 * @param raw If true, returns the raw markdown content.
 * @returns Document content.
 */
export const getDocument = async (
  name: string,
  signal: AbortSignal | null,
  options?: Partial<GetDocumentOptions>,
): Promise<Result<string, FetchError | ParseError | AbortError>> => {
  const url = `/docs/${name.replace(/^.\//, '').replace(/(\.md)?$/i, '.md')}`;
  const [res, fetchError] = await http.fetch(url, signal);

  if (fetchError) {
    return [null, fetchError];
  }

  const [text, parseError] = await http.parse.text(res, signal);

  if (parseError) {
    return [null, parseError];
  }

  if (options?.raw) {
    return [text, null];
  }

  const [html, markdownParseError] = await parseMarkdown(text, signal);

  if (markdownParseError) {
    return [null, markdownParseError];
  }

  return [html, null];
};
