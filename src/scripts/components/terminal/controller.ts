import { type Result } from '../../utils/result';
import { type ProgramExitCode, type ProgramContext, getProgram } from './programs';
import { MissingError, ParseError, NotFoundError } from '../../utils/error';

export type TerminalController = {
  /**
   * Executes a command.
   * @param value Command to execute.
   */
  exec: (value: string) => Promise<Result<ProgramExitCode, ProgramExecutionError>>;

  /**
   * Terminates the running program.
   */
  terminate: () => Promise<void>;

  /**
   * Parses a command string.
   * @param value String to parse.
   * @returns Parsed command, or `null` if the command is invalid.
   */
  parse: (value: string) => Command | null;
};

export type TerminalControllerOptions = {
  /**
   * Invoked to get a new program context.
   * @returns A new program context.
   */
  createContext: (signal: AbortSignal) => ProgramContext;

  /**
   * Invoked when a command is executed.
   * @param value Command to execute.
   */
  onExec: (value: string) => void | Promise<void>;

  /**
   * Invoked when the program is terminated.
   */
  onTerminate: () => void | Promise<void>;
};

export const createTerminalController = (
  options: TerminalControllerOptions,
): TerminalController => {
  const init = () => {
    if (!controller.signal.aborted) {
      return;
    }

    controller = new AbortController();
  };

  const terminate = async () => {
    controller.abort();
    await options.onTerminate();
  };

  const exec = async (value: string): Promise<Result<ProgramExitCode, ProgramExecutionError>> => {
    await terminate();
    init();

    await options.onExec(value);

    if (!value) {
      return [null, new MissingError()];
    }

    const parsed = parse(value);

    if (!parsed) {
      return [null, new ParseError()];
    }

    const program = getProgram(parsed.name);

    if (!program) {
      return [null, new NotFoundError()];
    }

    const ctx = options.createContext(controller.signal);
    const code = await program.exec(parsed.args)(ctx);
    return [code, null];
  };

  let controller = new AbortController();

  return {
    exec,
    terminate,
    parse,
  };
};

export type ProgramExecutionError = MissingError | ParseError | NotFoundError;

export type Command = {
  name: string;
  args: string[];
};

const parse = (str: string): Command | null => {
  const match = str.match(ExpressionRegex);
  const [, name, argsStr] = match || [];

  if (!name) {
    return null;
  }

  const args = argsStr
    ? [...argsStr.matchAll(TokenRegex)].flatMap((match) => match.slice(1).filter((m) => m))
    : [];

  return {
    name,
    args,
  };
};

const ExpressionRegex = /(\S+)(?:\s+(.*))?/s;
const TokenRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/gs;
