import { type Result } from '../../utils/result';
import { type ProgramExitCode, type ProgramContext, getProgram } from './programs';
import { MissingError, ParseError, NotFoundError } from '../../utils/error';
import { isTruthy } from '../../utils/predicates';

export type TerminalController = {
  /**
   * Executes a command.
   * @param value Command to execute.
   */
  exec: (value: string) => Promise<ProgramResult>;

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
   * Invoked when the controller is terminated.
   */
  onTerminate: () => void | Promise<void>;
};

/**
 * Creates a terminal controller instance.
 * @param options Controller options.
 * @returns Terminal controller instance.
 */
export const createTerminalController = (
  options: TerminalControllerOptions,
): TerminalController => {
  const create = () => {
    if (!controller.signal.aborted) {
      return;
    }

    controller = new AbortController();
  };

  const exec = async (value: string): Promise<ProgramResult> => {
    await terminate();
    create();

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

  const terminate = async () => {
    controller.abort();
    await options.onTerminate();
  };

  let controller = new AbortController();

  return {
    exec,
    terminate,
    parse,
  };
};

export type ProgramResult = Result<ProgramExitCode, ProgramExecutionError>;

export type ProgramExecutionError = MissingError | ParseError | NotFoundError;

export type Command = {
  name: string;
  args: string[];
};

const parse = (str: string): Command | null => {
  const match = str.match(ExpressionRegex);
  const [, name, argsStr] = match ?? [];

  if (!name) {
    return null;
  }

  const args = argsStr
    ? Array.from(argsStr.matchAll(TokenRegex)).flatMap((match) => match.slice(1).filter(isTruthy))
    : [];

  return {
    name,
    args,
  };
};

const ExpressionRegex = /(\S+)(?:\s+(.*))?/s;
const TokenRegex = /"([^"]+)"|'([^']+)'|`([^`]+)`|(\S+)/gs;
