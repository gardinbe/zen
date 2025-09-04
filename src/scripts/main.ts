import { query } from './utils/dom';
import { createAudioPlayer, createAudioPlayerElements } from './components/audio';
import { createDialog, createDialogElements } from './components/dialog';
import { createTerminal, createTerminalElements } from './components/terminal';
import { createOSBoot, createOSBootElements } from './components/os-boot';

const createBackgroundAudio = () => {
  const container = query('.js-background-audio');
  const elements = createAudioPlayerElements();
  const audioPlayer = createAudioPlayer(elements);
  container.append(elements.main);
  return audioPlayer;
};

const backgroundAudio = createBackgroundAudio();

const showStart = () => {
  const view = query('.js-start-view');
  const elements = createDialogElements();
  elements.main.classList.add('zen-start');
  elements.heading.innerHTML = /*html*/ `
    <h1>ZenOS</h1>
    <p>v0.1</p>
  `;
  elements.closeBtn.innerHTML = 'Start';
  elements.closeBtn.dataset.alt = 'Terminal';

  const startDialog = createDialog(elements, {
    onClose: (alt) => {
      view.hidden = true;
      backgroundAudio.play();

      if (alt) {
        showTerminal();
        return;
      }

      showBoot();
    },
  });

  view.append(elements.main);
  view.hidden = false;
  startDialog.open();
};

const showBoot = async () => {
  const view = query('.js-os-boot-view');
  const elements = createOSBootElements();

  const osBoot = createOSBoot(elements, {
    onContinue: () => {
      view.hidden = true;
      showTerminal();
    },
  });

  view.append(elements.main);
  view.hidden = false;
  osBoot.start();
};

const showTerminal = () => {
  const view = query('.js-terminal-view');
  const elements = createTerminalElements();
  createTerminal(elements);
  view.append(elements.main);
  view.hidden = false;
};

showStart();
