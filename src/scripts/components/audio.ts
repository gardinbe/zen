export type AudioPlayerElements = {
  main: HTMLAudioElement;
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

export const createAudioPlayer = (els: AudioPlayerElements): AudioPlayer => {
  const play = () => els.main.play();
  const pause = () => els.main.pause();

  return {
    play,
    pause,
  };
};
