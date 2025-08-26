import { type ProgramConstructor, Arg } from '.';
import { DocumentFormat, getDocument } from '../../../utils/documents';
import { Http404Error } from '../../../utils/error';

export const PrintProgram: ProgramConstructor = {
  name: 'print',
  description: 'Prints a document to the terminal.',
  arguments: [
    {
      name: '[filename]',
      description: 'Name of the document to print. Use `ls` to list available documents.',
    },
  ],
  exec:
    ([filename, arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(Arg.unexpected(2, arg));
        return 1;
      }

      if (!filename) {
        ctx.logger.stderr(Arg.missing(1));
        return 1;
      }

      const [html, error] = await getDocument(
        filename,
        {
          format: DocumentFormat.Markdown,
        },
        ctx.signal,
      );

      if (error) {
        if (Http404Error.is(error)) {
          ctx.logger.stderr(Arg.invalid(1, `Document \`${filename}\` not found.`));
        } else {
          ctx.logger.stderr(error);
        }

        return 1;
      }

      ctx.logger.stdout(`<div class="zen-typer-html">${html}</div>`, {
        noNewlines: true,
      });

      return 0;
    },
};
