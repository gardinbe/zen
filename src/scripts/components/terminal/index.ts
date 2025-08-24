import { type ProgramContext, getProgram } from './program';
import { type TerminalLogger, createTerminalLogger } from './logger';
import { type TerminalProgramController, createTerminalProgramController } from './controller';
import { type TerminalInput, createTerminalInput } from './input';
import { type TerminalHistory, createTerminalHistory } from './history';

export type TerminalElements = {
  main: HTMLElement;
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

    return program.run(parsed.args)(ctx);
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
  });
  const history = createTerminalHistory(els, {
    setInput: input.set,
  });

  return {
    logger,
    controller,
    input,
    history,
    exec,
  };
};

const ExpressionRegex = /(\S+)(?:\s+(.*))?/s;
const TokenRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/gs;

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
    ? [...argsStr.matchAll(TokenRegex)].map((m) => (m[1] || m[2] || m[3] || m[4]) as string)
    : [];

  return {
    name,
    args,
  };
};
