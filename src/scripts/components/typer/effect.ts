import { type Cursor } from '../cursor';
import { Delay } from './effects/delay';
import { Insert } from './effects/insert';
import { Remove } from './effects/remove';
import { Type } from './effects/type';
import { Undo } from './effects/undo';

export const Effects = {
  delay: Delay,
  insert: Insert,
  remove: Remove,
  type: Type,
  undo: Undo,
} as const satisfies Record<string, Effect>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Effect<Arg = any> = {
  name: string;
  parse: (value: string) => Arg;
  run: (arg: Arg) => EffectFunction;
};

export type EffectFunction = (ctx: EffectContext) => void | Promise<void>;

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
  node: Text | null;

  /**
   * Sets the current text node.
   */
  set: (node: Text | null) => void;

  /**
   * Sets the state of the current node.
   */
  setState: (state: EffectNodeState) => void;
}>;

export type EffectNodeState = 'incomplete' | 'active' | 'complete';

export const WhitespaceRegex = /\s/;

const EffectRegex = /\[\[\s*(.*?)\s*:(.*?)\]\]/dgs;

const createEffect = (match: RegExpExecArray) => {
  const [, key, value] = match;

  if (!key || !value) {
    throw new Error('Error parsing typer');
  }

  const effect = Object.values<Effect>(Effects).find((effect) => effect.name === key);

  if (!effect) {
    throw new Error('Unknown typer effect');
  }

  return {
    effect: effect.run(effect.parse(value)),
    end: match.index,
  };
};

export const createEffects = (text: string): EffectFunction[] => {
  let last = 0;

  const effects = [...text.matchAll(EffectRegex)].flatMap<EffectFunction>((match) => {
    const [full] = match;
    const { effect, end } = createEffect(match);

    const slice = text.slice(last, end);
    last = match.index + full.length;

    if (!slice) {
      return effect;
    }

    return [Type.run(slice), effect];
  });

  const slice = text.slice(last);

  if (slice) {
    effects.push(Type.run(slice));
  }

  return effects;
};
