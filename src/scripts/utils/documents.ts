import { type Enum } from './enum';
import { type Result } from './result';
import { type FetchError, http } from './fetch';
import { AbortError, ParseError } from './error';
import { parseMarkdown } from './markdown';

/**
 * Array of available documents.
 *
 * Necessary as it's not possible to get a list of available documents without a dedicated HTTP server.
 */
export const Documents = ['bee-movie.md', 'example.md', 'volcanoes.md'];

/**
 * Document types.
 */
export const DocumentFormat = {
  Html: 0,
  Markdown: 1,
} as const;

export type DocumentFormat = Enum<typeof DocumentFormat>;

export type GetDocumentOptions = {
  /**
   * If true, returns the raw markdown content, instead of parsing as HTML.
   */
  format: DocumentFormat;
};

/**
 * Retrieves and parses a markdown document.
 * @param name Document name.
 * @param options Options.
 * @param signal Abort signal.
 * @returns Document content.
 */
export const getDocument = async (
  name: string,
  options: GetDocumentOptions,
  signal: AbortSignal | null,
): Promise<Result<string, FetchError | ParseError | AbortError>> => {
  const url = resolveUrl(name);
  const [res, fetchError] = await http.fetch(url, signal);

  if (fetchError) {
    return [null, fetchError];
  }

  const [text, responseParseError] = await http.parse.text(res, signal);

  if (responseParseError) {
    return [null, responseParseError];
  }

  if (options.format === DocumentFormat.Html) {
    return [text, null];
  }

  const [html, markdownParseError] = await parseMarkdown(text, signal);

  if (markdownParseError) {
    return [null, markdownParseError];
  }

  return [html, null];
};

const resolveUrl = (name: string): string => {
  let resolved = name.trim();

  if (/^(https?:\/\/)/i.test(resolved)) {
    return resolved;
  }

  if (resolved.includes('\\')) {
    resolved = resolved.replaceAll('\\', '/');
  }

  while (resolved.startsWith('./')) {
    resolved = resolved.slice(2);
  }

  if (!resolved) {
    return '/documents/';
  }

  return resolved.startsWith('/') ? resolved : `/documents/${resolved}`;
};
