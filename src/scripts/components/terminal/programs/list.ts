import { Documents } from '../../../lib/documents';
import { type Program, ArgumentError } from '../program';

export const ListProgram: Program = {
  name: 'ls',
  description: 'Lists available documents.',
  exec:
    ([arg]) =>
    (ctx) => {
      if (arg) {
        ctx.logger.stderr(ArgumentError.unexpected(1, arg));
        return;
      }

      const str = Documents.join('\n');
      ctx.logger.stdout(str);
    },
};
