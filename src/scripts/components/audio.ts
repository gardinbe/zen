import { asset } from '../utils/asset';

export type AudioPlayerElements = {
  main: HTMLAudioElement;
};

export const createAudioPlayerElements = (): AudioPlayerElements => {
  const main = document.createElement('audio');

  return {
    main,
  };
};

export type AudioPlayer = {
  /**
   * Plays the audio track.
   */
  play: () => void;

  /**
   * Pauses the audio track.
   */
  pause: () => void;
};

/**
 * Creates an audio player instance.
 * @param els Audio player elements.
 * @returns Audio player instance.
 */
export const createAudioPlayer = (els: AudioPlayerElements): AudioPlayer => {
  const init = () => {
    els.main.src = asset('/audio/background.mp3');
    els.main.loop = true;
    els.main.hidden = true;
  };

  const play = () => els.main.play();
  const pause = () => els.main.pause();

  init();

  return {
    play,
    pause,
  };
};
