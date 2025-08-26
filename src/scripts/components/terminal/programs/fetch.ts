import { http } from '../../../utils/fetch';
import { type ProgramConstructor, Arg } from '.';

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
        ctx.logger.stderr(Arg.unexpected(2, arg));
        return 1;
      }

      if (!url) {
        ctx.logger.stderr(Arg.missing(2));
        return 1;
      }

      const [res, fetchError] = await http.fetch(url, ctx.signal);

      if (fetchError) {
        ctx.logger.stderr(fetchError);
        return 1;
      }

      const [text, parseError] = await http.parse.text(res, ctx.signal);

      if (parseError) {
        ctx.logger.stderr(parseError);
        return 1;
      }

      ctx.logger.stdout(text);
      return 0;
    },
};
