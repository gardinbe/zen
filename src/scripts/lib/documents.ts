import { parse } from 'marked';
import { type FetchError, http, ParseError } from '../utils/fetch';
import { type Result } from '../utils/result';

/**
 * Array of available documents.
 *
 * Necessary as it's not possible to get a list of available documents without a dedicated HTTP server.
 */
export const Documents = ['example.md', 'bee-movie.md'];

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
 * @param raw If true, returns the raw markdown content.
 * @returns Document content.
 */
export const getDocument = async (
  name: string,
  options?: Partial<GetDocumentOptions>,
): Promise<Result<string, FetchError | ParseError>> => {
  const url = `/docs/${name.replace(/^.\//, '').replace(/(\.md)?$/i, '.md')}`;
  const [res, fetchError] = await http.fetch(url);

  if (fetchError) {
    return [null, fetchError];
  }

  const [md, parseError] = await http.parse.text(res);

  if (parseError) {
    return [null, parseError];
  }

  if (options?.raw) {
    return [md, null];
  }

  let html;

  try {
    html = await parse(md);
  } catch {
    return [null, new ParseError()];
  }

  return [html, null];
};
