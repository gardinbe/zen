import { type TerminalHistory } from './history';
import { type TerminalLogger } from './logger';
import { ClearProgram } from './programs//clear';
import { EvalProgram } from './programs//eval';
import { HelpProgram } from './programs//help';
import { HistoryProgram } from './programs//history';
import { ListProgram } from './programs/list';
import { PrintProgram } from './programs/print';

/**
 * Object of available terminal programs.
 */
export const Programs: Program[] = [
  ClearProgram,
  EvalProgram,
  HelpProgram,
  HistoryProgram,
  ListProgram,
  PrintProgram,
];

/**
 * Object of aliases for terminal programs.
 */
export const Aliases: Record<string, Program> = {
  cls: ClearProgram,
};

export type Program = {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
  }[];
  exec: (args: string[]) => ProgramFunction;
};

export type ProgramFunction = (ctx: ProgramContext) => void | Promise<void>;

export type ProgramContext = Readonly<{
  /**
   * Abort signal.
   */
  signal: AbortSignal;

  /**
   * Logger instance.
   */
  logger: TerminalLogger;

  /**
   * History instance.
   */
  history: TerminalHistory;
}>;

export const ArgumentError = {
  /**
   * Returns an error message for an unexpected argument.
   * @param position Position of the argument.
   * @param message Message to append.
   * @returns Error message.
   */
  unexpected: (position: number, message: string) =>
    `Unexpected argument at position ${position}: ${message}`,

  /**
   * Returns an error message for a missing argument.
   * @param position Position of the argument.
   * @returns Error message.
   */
  missing: (position: number) => `Missing argument at position ${position}`,

  /**
   * Returns an error message for an invalid argument.
   * @param position Position of the argument.
   * @param message Message to append.
   * @returns Error message.
   */
  invalid: (position: number, message: string) =>
    `Invalid argument at position ${position}: ${message}`,
};

/**
 * Returns all available commands.
 * @returns Array of commands.
 */
export const getCommands = (): string[] => [
  ...Programs.map(({ name }) => name),
  ...Object.entries(Aliases).map(([name]) => name),
];

/**
 * Returns a program by name.
 * @param name Name of the program.
 */
export const getProgram = (name: string): Program | null =>
  Object.entries(Aliases).find(
    ([_name]) => _name.toLocaleUpperCase() === name.toLocaleUpperCase(),
  )?.[1] ??
  Programs.find((program) => program.name.toLocaleUpperCase() === name.toLocaleUpperCase()) ??
  null;
