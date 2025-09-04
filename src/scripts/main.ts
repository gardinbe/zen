import { query } from './utils/dom';
import { createAudioPlayer, createAudioPlayerElements } from './components/audio';
import { createDialog, createDialogElements } from './components/dialog';
import { createTerminal, createTerminalElements } from './components/terminal';
import { createOSBoot, createOSBootElements } from './components/os-boot';

const createBackgroundAudio = () => {
  const container = query('.js-background-audio');
  const els = createAudioPlayerElements();
  const audioPlayer = createAudioPlayer(els);
  container.append(els.main);
  return audioPlayer;
};

const backgroundAudio = createBackgroundAudio();

const showStart = () => {
  const view = query('.js-start-view');
  const els = createDialogElements();
  els.main.classList.add('zen-start');
  els.heading.innerHTML = /*html*/ `
    <h1>ZenOS</h1>
    <p>v0.1</p>
  `;
  els.closeBtn.innerHTML = 'Start';
  els.closeBtn.dataset.alt = 'Terminal';

  const startDialog = createDialog(els, {
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

  view.append(els.main);
  view.hidden = false;
  startDialog.open();
};

const showBoot = async () => {
  const view = query('.js-os-boot-view');
  const els = createOSBootElements();

  const osBoot = createOSBoot(els, {
    onContinue: () => {
      view.hidden = true;
      showTerminal();
    },
  });

  view.append(els.main);
  view.hidden = false;
  osBoot.start();
};

const showTerminal = () => {
  const view = query('.js-terminal-view');
  const els = createTerminalElements();
  createTerminal(els);
  view.append(els.main);
  view.hidden = false;
};

showStart();
