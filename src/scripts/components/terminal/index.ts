import { type TerminalController, createTerminalController } from './controller';
import { type TerminalLogger, createTerminalLogger } from './logger';
import { type TerminalHistory, createTerminalHistory } from './history';
import { type TerminalInput, createTerminalInput } from './input';
import { ParseError, NotFoundError } from '../../utils/error';
import { DocumentFormat, Documents, getDocument } from '../../utils/documents';
import { getProgram, getProgramNames } from './programs';

export type TerminalElements = {
  main: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  input: HTMLInputElement;
};

export type Terminal = {
  /**
   * Controller instance.
   */
  controller: TerminalController;

  /**
   * Logger instance.
   */
  logger: TerminalLogger;

  /**
   * History instance.
   */
  history: TerminalHistory;

  /**
   * Input typer instance.
   */
  input: TerminalInput;
};

/**
 * Creates a terminal instance.
 * @param els Terminal elements.
 * @returns Terminal instance.
 */
export const createTerminal = (els: TerminalElements): Terminal => {
  const exec = async (value: string) => {
    const [code, error] = await controller.exec(value);

    if (error) {
      if (ParseError.is(error)) {
        logger.stderr(`Error parsing command: ${value}`);
      } else if (NotFoundError.is(error)) {
        logger.stderr(`Unknown program: ${value}`);
      }

      return;
    }

    if (code === 0) {
      return;
    }

    logger.stdout(`Program exited with code: ${code}`);
  };

  const logStartMessage = async () => {
    const [html, error] = await getDocument(
      '/misc/banner.preformatted.html',
      {
        format: DocumentFormat.Html,
      },
      null,
    );

    if (error) {
      return;
    }

    logger.stdout(html);
  };

  const controller = createTerminalController({
    createContext: (signal) => ({
      signal,
      logger,
      history,
    }),
    onExec: (value) => {
      history.reset();
      history.add(value);
      logger.stdin(value);
    },
    onTerminate: () => logger.typer.stop(),
  });
  const logger = createTerminalLogger(els);
  const history = createTerminalHistory({
    getValue: () => input.value,
    onNavigate: (value) => input.set(value),
  });
  const input = createTerminalInput(els, {
    onCancel: async (value) => {
      await controller.terminate();
      logger.stdin(`${value}^C`);
    },
    onSubmit: (value) => exec(value),
    onUp: () => history.up(),
    onDown: () => history.down(),
    suggester: {
      getSuggestions: (value) => {
        const parsed = controller.parse(value);

        if (!parsed || !getProgram(parsed.name)) {
          return getProgramNames().filter((name) => name.startsWith(value));
        }

        const arg = parsed.args.at(-1) || '';

        return Documents.filter((name) => name.startsWith(arg)).map(
          (name) => `${parsed.name} ${name}`,
        );
      },
    },
  });

  logStartMessage();

  return {
    controller,
    logger,
    history,
    input,
  };
};
