import { type Enum } from '../../../utils/enum';
import { type Cursor } from '../../cursor';
import { DelayEffect } from './delay';
import { InsertEffect } from './insert';
import { NullEffect } from './null';
import { RemoveEffect } from './remove';
import { TypeEffect } from './type';
import { UndoEffect } from './undo';

/**
 * Array of all available effect constructors.
 */
export const EffectConstructors: EffectConstructor[] = [
  DelayEffect,
  InsertEffect,
  NullEffect,
  RemoveEffect,
  TypeEffect,
  UndoEffect,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EffectConstructor<T extends any[] = any> = {
  /**
   * Name of the effect.
   */
  name: string;

  /**
   * Parses the effect value.
   *
   * todo: enforce validating this. create `EffectConstructorParser` object with `int` and `float`
   * methods. then enforce `Result<T, ParseError>` return type.
   * @param value Raw effect value.
   * @returns Parsed effect value.
   */
  parse?: (value: string) => T;

  /**
   * Creates and returns an effect.
   * @param arg Parsed effect value.
   */
  create: (...args: T) => Effect;
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
   * All nodes.
   */
  nodes: Node[];

  /**
   * Target node.
   */
  targetNode: Node;

  /**
   * Returns the active node.
   */
  readonly node: Node;

  /**
   * Sets the active node.
   * @param node Target node.
   */
  setActiveNode: (node: Node) => void;

  /**
   * Sets the state of the given node.
   * @param node Target node.
   * @param state State to set.
   */
  setNodeState: (node: Node, state: EffectNodeState) => void;
}>;

export const EffectNodeState = {
  Incomplete: 'incomplete',
  Active: 'active',
  Complete: 'complete',
} as const;

export type EffectNodeState = Enum<typeof EffectNodeState>;

export const WhitespaceRegex = /\s/;

/**
 * Parses and creates effects from a string.
 * @returns Array of effects.
 */
export const createEffects = (text: string | null): Effect[] => {
  let prevIndex = 0;

  if (!text) {
    return [NullEffect.create()];
  }

  const matches = Array.from(text.matchAll(EffectRegex));

  const effects = matches.flatMap<Effect>((match) => {
    const [full, key, value] = match as unknown as [string, string, string];

    const effect = createEffect({
      key,
      value,
    });

    if (!effect) {
      return [];
    }

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

type CreateEffectObject = {
  key: string;
  value: string;
};

const createEffect = (obj: CreateEffectObject): Effect | null => {
  const { key, value } = obj;
  const effect = EffectConstructors.find((effect) => effect.name === key);

  if (!effect) {
    return null;
  }

  return effect.create(...(effect.parse?.(value) ?? [value]));
};
