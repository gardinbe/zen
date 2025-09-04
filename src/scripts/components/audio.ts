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
export const createAudioPlayer = (elements: AudioPlayerElements): AudioPlayer => {
  const init = () => {
    elements.main.src = asset('/audio/background.mp3');
    elements.main.loop = true;
    elements.main.hidden = true;
  };

  const play = () => elements.main.play();
  const pause = () => elements.main.pause();

  init();

  return {
    play,
    pause,
  };
};
