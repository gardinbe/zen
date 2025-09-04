import { type Terminal, createTerminal, createTerminalElements } from '.';
import { type Enum } from '../../utils/enum';

export type TerminalManagerElements = {
  main: HTMLElement;
};

export const createTerminalManagerElements = (): TerminalManagerElements => {
  const main = document.createElement('div');

  return {
    main,
  };
};

export const createTerminalManager = (elements: TerminalManagerElements) => {
  const init = () => {
    elements.main.classList.add('zen-terminal-manager');
  };

  const spawn = (direction: TerminalSpawnDirection) => {
    const terminalElements = createTerminalElements();
    const terminal = createTerminal(terminalElements);

    const element = terminalElements.main;

    terminals.push(terminal);

    let container;

    switch (direction) {
      case TerminalSpawnDirection.North:
      case TerminalSpawnDirection.South: {
        container = createColumn();
        break;
      }
      case TerminalSpawnDirection.East:
      case TerminalSpawnDirection.West: {
        container = createRow();
        break;
      }
    }

    if (container.type === )

    switch (direction) {
      case TerminalSpawnDirection.North:
      case TerminalSpawnDirection.East: {
        container.prepend(element);
        break;
      }
      case TerminalSpawnDirection.South:
      case TerminalSpawnDirection.West: {
        container.append(element);
        break;
      }
    }
  };

  const kill = (terminal: Terminal) => {
    // todo: kill terminal properly, remove all listeners, stop typer

    terminal.elements.main.remove();

    terminals.splice(terminals.indexOf(terminal), 1);
  };

  const terminals: Terminal[] = [];
};

export type TerminalSpawnDirection = Enum<typeof TerminalSpawnDirection>;
export const TerminalSpawnDirection = {
  North: 0,
  East: 1,
  South: 2,
  West: 3,
} as const;

type TerminalContainerType = Enum<typeof TerminalContainerType>;
const TerminalContainerType = {
  Column: 0,
  Row: 1,
} as const;

type TerminalContainer = {
  type: TerminalContainerType;
  element: HTMLElement;
};

const createColumn = (): TerminalContainer => {
  const element = document.createElement('div');
  element.classList.add('zen-terminal-column');
  return {
    type: TerminalContainerType.Column,
    element,
  };
};

const createRow = (): TerminalContainer => {
  const element = document.createElement('div');
  element.classList.add('zen-terminal-row');
  return {
    type: TerminalContainerType.Row,
    element,
  };
};
