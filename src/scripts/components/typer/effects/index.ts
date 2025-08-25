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

  /**
   * Checks if the given node is preformatted.
   * @param node Target node.
   * @returns True if the node is preformatted.
   */
  isPreformattedNode: (node: Node) => boolean;
}>;

export type EffectNodeState = 'incomplete' | 'active' | 'complete';

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

  const matches = [...text.matchAll(EffectRegex)];

  const effects = matches.flatMap<Effect>((match) => {
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

type CreateEffectObject = {
  key: string;
  value: string;
};

const createEffect = (obj: CreateEffectObject): Effect => {
  const { key, value } = obj;
  const effect = EffectConstructors.find((effect) => effect.name === key);

  if (!effect) {
    throw new Error('Unknown typer effect');
  }

  return effect.create(effect.parse?.(value) ?? value);
};
