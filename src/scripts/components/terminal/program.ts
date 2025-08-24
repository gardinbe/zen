import type { TerminalHistory } from './history';
import type { TerminalLogger } from './logger';
import { Clear } from './programs//clear';
import { Eval } from './programs//eval';
import { Help } from './programs//help';
import { History } from './programs//history';
import { Open } from './programs/open';
/**
 * Object of available terminal programs.
 */
export const Programs = {
  clear: Clear,
  eval: Eval,
  help: Help,
  history: History,
  open: Open,
} as const satisfies Record<string, Program>;

/**
 * Object of aliases for terminal programs.
 */
export const Aliases = {
  cls: Programs.clear,
} as const satisfies Record<string, Program>;

export type Program = {
  name: string;
  description: string;
  run: (args: string[]) => ProgramFunction;
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
  unexpected: (pos: number, msg: string) => `Unexpected argument at position ${pos}: ${msg}`,
  missing: (pos: number) => `Missing argument at position ${pos}`,
  invalid: (pos: number, msg: string) => `Invalid argument at position ${pos}: ${msg}`,
};

export const getProgram = (name: string): Program | null =>
  Object.entries(Aliases).find(([n]) => n.toLocaleUpperCase() === name.toLocaleUpperCase())?.[1] ??
  Object.values(Programs).find(
    (program) => program.name.toLocaleUpperCase() === name.toLocaleUpperCase(),
  ) ??
  null;
