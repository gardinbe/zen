import { type ProgramContext, getCommands, getProgram } from './program';
import { type TerminalLogger, createTerminalLogger } from './logger';
import { type TerminalProgramController, createTerminalProgramController } from './controller';
import { type TerminalInput, createTerminalInput } from './input';
import { type TerminalHistory, createTerminalHistory } from './history';
import { Documents, getDocument } from '../../lib/documents';

export type TerminalElements = {
  main: HTMLElement;
  outputContainer: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  input: HTMLInputElement;
};

export type Terminal = {
  /**
   * Logger instance.
   */
  logger: TerminalLogger;

  /**
   * Program controller instance.
   */
  controller: TerminalProgramController;

  /**
   * Input typer instance.
   */
  input: TerminalInput;

  /**
   * History instance.
   */
  history: TerminalHistory;

  /**
   * Executes a command.
   * @param value Command to execute.
   */
  exec: (value: string) => Promise<void>;
};

export const createTerminal = (els: TerminalElements): Terminal => {
  const exec = async (value: string) => {
    await controller.terminate();

    history.reset();
    history.add(value);
    logger.stdin(value);

    if (!value) {
      return;
    }

    const parsed = parse(value);

    if (!parsed) {
      logger.stderr(`Error parsing command: ${value}`);
      return;
    }

    const program = getProgram(parsed.name);

    if (!program) {
      logger.stderr(`Unknown program: ${parsed.name}`);
      return;
    }

    const signal = controller.init();

    const ctx: ProgramContext = {
      signal,
      logger,
      history,
    };

    return program.exec(parsed.args)(ctx);
  };

  const logStartMessage = async () => {
    const [html, error] = await getDocument('misc/terminal-start-message.md', controller.signal, {
      raw: true,
    });

    if (error) {
      return;
    }

    logger.stdout(html);
  };

  const logger = createTerminalLogger(els);
  const controller = createTerminalProgramController({
    onTerminate: logger.typer.stop,
  });
  const input = createTerminalInput(els, {
    onCancel: async () => {
      await controller.terminate();
      logger.stdin('^C');
    },
    onSubmit: exec,
    suggester: {
      getSuggestions: (value) => {
        const parsed = parse(value);

        if (!parsed || !getProgram(parsed.name)) {
          return getCommands().filter((name) => name.startsWith(value));
        }

        const arg = parsed.args.at(-1) || '';

        return Documents.filter((name) => name.startsWith(arg)).map(
          (name) => `${parsed.name} ${name}`,
        );
      },
    },
  });
  const history = createTerminalHistory(els, {
    onNavigate: input.set,
  });

  logStartMessage();

  return {
    logger,
    controller,
    input,
    history,
    exec,
  };
};

type ParsedInput = {
  name: string;
  args: string[];
};

const parse = (str: string): ParsedInput | null => {
  const match = str.match(ExpressionRegex);
  const [, name, argsStr] = match || [];

  if (!name) {
    return null;
  }

  const args = argsStr
    ? [...argsStr.matchAll(TokenRegex)].map(
        (match) => (match.at(1) || match.at(2) || match.at(3) || match.at(4)) as string,
      )
    : [];

  return {
    name,
    args,
  };
};

const ExpressionRegex = /(\S+)(?:\s+(.*))?/s;
const TokenRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/gs;
