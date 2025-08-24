import { http } from '../../../utils/fetch';
import { type ProgramConstructor, ArgumentError } from '../program';

export const FetchProgram: ProgramConstructor = {
  name: 'fetch',
  description: 'Requests and prints the content from an API to the terminal.',
  arguments: [
    {
      name: '[url]',
      description: 'URL to send the request to.',
    },
  ],
  exec:
    ([url, arg]) =>
    async (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(2, arg));
        return;
      }

      if (!url) {
        ctx.logger.stderr(ArgumentError.missing(2));
        return;
      }

      const [res, fetchError] = await http.fetch(url, ctx.signal);

      if (fetchError) {
        ctx.logger.stderr(fetchError);
        return;
      }

      const [text, parseError] = await http.parse.text(res, ctx.signal);

      if (parseError) {
        ctx.logger.stderr(parseError);
        return;
      }

      ctx.logger.stdout(text);
    },
};
