import { getDocument, DocumentFormat } from '../utils/documents';
import { unwrap } from '../utils/result';
import { createTyper } from './typer';

export type OSBootElements = {
  main: HTMLElement;
  output: HTMLElement;
  continueBtn: HTMLElement;
};

export const createOSBootElements = (): OSBootElements => {
  const main = document.createElement('div');
  const output = document.createElement('div');
  const continueBtn = document.createElement('button');

  main.append(output, continueBtn);

  return {
    main,
    output,
    continueBtn,
  };
};

export type OSBoot = {
  /**
   * Starts the boot sequence.
   */
  start: () => void;
};

export type OSBootOptions = {
  /**
   * Invoked after the boot sequence has completed, and the user continues.
   */
  onContinue: () => void;
};

export const createOSBoot = (elements: OSBootElements, options: OSBootOptions) => {
  const init = () => {
    elements.main.classList.add('zen-os-boot');
    elements.output.classList.add('zen-os-boot-output');
    elements.continueBtn.classList.add('zen-os-boot-continue', 'u-zen-btn');
    elements.continueBtn.hidden = true;
  };

  const next = () => {
    removeEventListener('keydown', listeners.keydown);
    elements.continueBtn.removeEventListener('click', next);
    options.onContinue();
  };

  const start = async () => {
    const html = await unwrap(
      getDocument(
        '/misc/boot.preformatted.html',
        {
          format: DocumentFormat.Html,
        },
        null,
      ),
    );

    typer.type(html, {
      onFinish: () => {
        elements.continueBtn.hidden = false;
        addEventListener('keydown', listeners.keydown);
        elements.continueBtn.addEventListener('click', next);
      },
    });
  };

  const listeners = {
    keydown: (ev: KeyboardEvent) => {
      if (ev.key !== 'Enter') {
        return;
      }

      next();
    },
  };

  const typer = createTyper(
    {
      main: elements.output,
    },
    {
      scrollable: true,
    },
  );

  init();

  return {
    start,
  };
};
