import { getDocument } from '../../../lib/documents';
import { HttpNotFoundError } from '../../../utils/fetch';
import { type Program, ArgumentError } from '../program';

export const PrintProgram: Program = {
  name: 'print',
  description: 'Prints a document to the terminal.',
  arguments: [
    {
      name: '[filename]',
      description: 'The name of the document to print. Use `ls` to list available documents.',
    },
  ],
  exec:
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

      const [html, error] = await getDocument(filename);

      if (error) {
        if (error instanceof HttpNotFoundError) {
          ctx.logger.stderr(ArgumentError.invalid(1, `Document \`${filename}\` not found.`));
        } else {
          ctx.logger.stderr(error);
        }

        return;
      }

      ctx.logger.stdout(`<div class="u-html">${html}</div>`, {
        noNewlines: true,
      });
    },
};
