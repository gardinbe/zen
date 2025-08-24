import { marked } from 'marked';
import { fetchDocument } from '../../../utils/fetch';
import { type Program, ArgumentError } from '../program';

export const Open: Program = {
  name: 'open',
  description: 'Opens a document.',
  run:
    ([filename, arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return;
      }

      if (!filename) {
        ctx.logger.stderr(ArgumentError.missing(1));
        return;
      }

      const md = await fetchDocument(filename);
      const html = await marked.parse(md);

      ctx.logger.stdout(`<div class="u-html">${html}</div>`, {
        noNewline: true,
      });
    },
};
