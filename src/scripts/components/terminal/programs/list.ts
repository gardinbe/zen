import { Documents } from '../../../lib/documents';
import { type ProgramConstructor, ArgumentError } from '.';

export const ListProgram: ProgramConstructor = {
  name: 'ls',
  description: 'Lists available documents.',
  exec:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return 1;
      }

      const str = Documents.join('\n');
      ctx.logger.stdout(str);
      return 0;
    },
};
