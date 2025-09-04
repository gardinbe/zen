import { type TerminalController, createTerminalController } from './controller';
import { type TerminalLogger, createTerminalLogger, LogMethod } from './logger';
import { type TerminalInput, createTerminalInput } from './input';
import { type TerminalHistory, createTerminalHistory } from './history';
import { type TerminalSuggester, createTerminalSuggester } from './suggester';
import { getProgram, getProgramNames } from './programs';
import { ParseError, NotFoundError } from '../../utils/error';
import { DocumentFormat, Documents, getDocument } from '../../utils/documents';

export type TerminalElements = {
  main: HTMLElement;
  output: HTMLElement;
  prompt: HTMLFormElement;
  prefix: HTMLElement;
  inputContainer: HTMLElement;
  input: HTMLInputElement;
};

export const createTerminalElements = (): TerminalElements => {
  const main = document.createElement('div');
  const output = document.createElement('div');
  const prompt = document.createElement('form');
  const prefix = document.createElement('div');
  const inputContainer = document.createElement('div');
  const input = document.createElement('input');

  inputContainer.append(input);
  prompt.append(prefix, inputContainer);
  main.append(output, prompt);

  return {
    main,
    output,
    prompt,
    prefix,
    inputContainer,
    input,
  };
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
   * Input typer instance.
   */
  input: TerminalInput;

  /**
   * History instance.
   */
  history: TerminalHistory;

  /**
   * Suggester instance.
   */
  suggester: TerminalSuggester;
};

/**
 * Creates a terminal instance.
 * @returns Terminal instance.
 */
export const createTerminal = (els: TerminalElements): Terminal => {
  const init = () => {
    els.main.classList.add('zen-terminal');
    els.output.classList.add('zen-terminal-output');
    els.prompt.classList.add('zen-terminal-prompt', 'zen-typer', 'u-zen-crt-text');
    els.prefix.classList.add('zen-terminal-prefix');
    els.prefix.innerHTML = '> ';
    els.inputContainer.classList.add('zen-terminal-input-container');
    els.input.classList.add('zen-terminal-input');
    els.input.name = 'zen-terminal-input';
    els.input.type = 'text';
    els.input.autocomplete = 'off';
    els.input.spellcheck = false;
    els.input.setAttribute('autocorrect', 'off');
    els.input.autocapitalize = 'off';
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

    logger.stdout(html, {
      method: LogMethod.Insert,
      collapse: true,
    });
  };

  const controller = createTerminalController({
    createContext: (signal) => ({
      signal,
      logger,
      history,
    }),
    onTerminate: () => logger.typer.stop(),
  });

  const logger = createTerminalLogger(els);

  const input = createTerminalInput(els, {
    onInput: (value) => {
      history.reset();
      suggester.set(value);
    },
    onSubmit: async (value) => {
      history.reset();
      suggester.set(value);
      logger.stdin(value);

      if (value) {
        history.add(value);
      }

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

      logger.stdout(`Program exited with code: ${code}`, {
        method: LogMethod.Insert,
      });
    },
    onCancel: async (value) => {
      history.reset();
      suggester.set(value);
      await controller.terminate();
      logger.stdin(`${value}^C`);
    },
    onUp: () => {
      const value = history.prev();
      input.set(value);
      suggester.set(value);
    },
    onDown: () => {
      const value = history.next();
      input.set(value);
      suggester.set(value);
    },
    onTab: () => {
      const suggestion = suggester.next();

      if (!suggestion) {
        return;
      }

      history.reset();
      input.set(suggestion);
    },
    onShiftTab: () => {
      const suggestion = suggester.prev();

      if (!suggestion) {
        return;
      }

      history.reset();
      input.set(suggestion);
    },
    onSpawn: () => {
      // todo: implement
    },
  });

  const history = createTerminalHistory({
    getValue: () => input.value,
  });

  const suggester = createTerminalSuggester({
    getSuggestions: (value) => {
      const parsed = controller.parse(value);

      if (!parsed || !getProgram(parsed.name)) {
        return getProgramNames().filter((name) => name.startsWith(value));
      }

      const arg = parsed.args.at(-1) ?? '';

      return Documents.filter((name) => name.startsWith(arg)).map(
        (name) => `${parsed.name} ${name}`,
      );
    },
  });

  suggester.set(input.value);

  init();
  logStartMessage();

  return {
    controller,
    logger,
    input,
    history,
    suggester,
  };
};
