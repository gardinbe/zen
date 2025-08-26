import { query } from './utils/dom';
import { createAudioPlayer } from './components/audio';
import { createDialog } from './components/dialog';
import { createTyper } from './components/typer';
import { createTerminal } from './components/terminal';
import { DocumentFormat, getDocument } from './utils/documents';
import { unwrap } from './utils/result';

const backgroundAudio = createAudioPlayer({
  main: query<HTMLAudioElement>('.js-background-audio'),
});

const showLaunch = () => {
  const view = query('.js-start-view');
  const startDialog = createDialog(
    {
      main: query('.js-start-dialog'),
      closeBtn: query('.js-start-dialog-close'),
    },
    {
      onClose: (alt) => {
        view.hidden = true;
        backgroundAudio.play();

        if (alt) {
          showTerminal();
          return;
        }

        showBoot();
      },
    },
  );

  view.hidden = false;
  startDialog.open();
};

const showBoot = async () => {
  const view = query('.js-os-boot-view');

  const bootSequenceTyper = createTyper({
    main: query('.js-os-boot-typer'),
  });

  const html = await unwrap(
    getDocument(
      '/misc/boot.preformatted.html',
      {
        format: DocumentFormat.Html,
      },
      null,
    ),
  );

  view.hidden = false;
  bootSequenceTyper.type(html, {
    onFinish: () => {
      addEventListener(
        'keydown',
        (ev) => {
          if (ev.key !== 'Enter') {
            return;
          }

          view.hidden = true;
          showTerminal();
        },
        {
          once: true,
        },
      );
    },
  });
};

const showTerminal = () => {
  const view = query('.js-terminal-view');

  createTerminal({
    main: query('.js-terminal'),
    outputContainer: query('.js-terminal-output-container'),
    output: query('.js-terminal-output'),
    prompt: query<HTMLFormElement>('.js-terminal-prompt'),
    prefix: query('.js-terminal-prefix'),
    input: query<HTMLInputElement>('.js-terminal-input'),
  });

  view.hidden = false;
};

showLaunch();
