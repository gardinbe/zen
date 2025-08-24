import { type Cursor } from '../cursor';
import { DelayEffect } from './effects/delay';
import { InsertEffect } from './effects/insert';
import { RemoveEffect } from './effects/remove';
import { TypeEffect } from './effects/type';
import { UndoEffect } from './effects/undo';

export const EffectConstructors: EffectConstructor[] = [
  DelayEffect,
  InsertEffect,
  RemoveEffect,
  TypeEffect,
  UndoEffect,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EffectConstructor<T = any> = {
  /**
   * Name of the effect.
   */
  name: string;

  /**
   * Parses the effect value.
   * @param value Raw effect value.
   * @returns Parsed effect value.
   */
  parse: (value: string) => T;

  /**
   * Creates and returns an effect.
   * @param arg Parsed effect value.
   */
  create: (arg: T) => Effect;
};

export type Effect = (ctx: EffectContext) => void | Promise<void>;

export type EffectContext = Readonly<{
  /**
   * Abort signal.
   */
  signal: AbortSignal;

  /**
   * Cursor instance.
   */
  cursor: Cursor;

  /**
   * All text nodes.
   */
  nodes: Text[];

  /**
   * Current text node.
   */
  node: Text;

  /**
   * Sets the current text node.
   * @param node Target node.
   */
  setNode: (node: Text) => void;

  /**
   * Sets the state of the given node.
   * @param node Target node.
   * @param state State to set.
   */
  setNodeState: (node: Text, state: EffectNodeState) => void;

  /**
   * Checks if the given node is preformatted.
   * @param node Target node.
   * @returns True if the node is preformatted.
   */
  isPreformattedNode: (node: Text) => boolean;
}>;

export type EffectNodeState = 'incomplete' | 'active' | 'complete';

export const WhitespaceRegex = /\s/;

/**
 * Parses and creates effects from a string.
 * @returns Array of effects.
 */
export const createEffects = (text: string): Effect[] => {
  let prevIndex = 0;

  const matches = [...text.matchAll(EffectRegex)];

  const effects = matches.flatMap((match) => {
    const [full, key, value] = match;

    if (!key || !value) {
      throw new Error('Error parsing typer');
    }

    const effect = createEffect({
      key,
      value,
    });

    const slice = text.slice(prevIndex, match.index);
    prevIndex = match.index + full.length;

    if (!slice) {
      return effect;
    }

    return [TypeEffect.create(slice), effect];
  });

  const slice = text.slice(prevIndex);

  if (slice) {
    effects.push(TypeEffect.create(slice));
  }

  return effects;
};

const EffectRegex = /\[\[\s*(.*?)\s*:(.*?)\]\]/dgs;

type EffectConstructorObject = {
  key: string;
  value: string;
};

const createEffect = (obj: EffectConstructorObject): Effect => {
  const { key, value } = obj;
  const effect = EffectConstructors.find((effect) => effect.name === key);

  if (!effect) {
    throw new Error('Unknown typer effect');
  }

  return effect.create(effect.parse(value));
};
