// import { type Terminal, createTerminal, createTerminalElements } from '.';
// import { type Enum } from '../../utils/enum';

// export type TerminalManagerElements = {
//   main: HTMLElement;
// };

// export const createTerminalManagerElements = (): TerminalManagerElements => {
//   const main = document.createElement('div');

//   return {
//     main,
//   };
// };

// export const createTerminalManager = (els: TerminalManagerElements) => {
//   const init = () => {
//     els.main.classList.add('zen-terminal-manager');
//   };

//   const spawn = (source: Terminal, direction: TerminalSpawnDirection) => {
//     const sourceEl = terminals.get(source);

//     if (!sourceEl?.parentElement) {
//       return;
//     }

//     const terminalEls = createTerminalElements();
//     const terminal = createTerminal(terminalEls);

//     const el = terminalEls.main;
//     terminals.set(terminal, el);

//     const parent = sourceEl.parentElement;

//     const isAfter =
//       direction === TerminalSpawnDirection.South || direction === TerminalSpawnDirection.East;

//     if (isColumn(parent) || isRow(parent)) {
//       if (isAfter) {
//         parent.append(el);
//       } else {
//         parent.prepend(el);
//       }

//       return;
//     }

//     const container =
//       direction === TerminalSpawnDirection.North || direction === TerminalSpawnDirection.South
//         ? createColumn()
//         : createRow();

//     parent.insertBefore(container, sourceEl);

//     if (isAfter) {
//       container.append(sourceEl, el);
//     } else {
//       container.append(el, sourceEl);
//     }
//   };

//   const kill = (terminal: Terminal) => {
//     // todo: kill terminal properly, remove all listeners, stop typer
//     terminals.delete(terminal);
//   };

//   const terminals = new WeakMap<Terminal, HTMLElement>();

//   const create = () => {
//     const terminalEls = createTerminalElements();
//     const terminal = createTerminal(terminalEls, {
//       onSpawn: (direction) => {
//         spawn(terminal, direction);
//       },
//     });
//     terminals.set(terminal, terminalEls.main);
//     els.main.append(terminalEls.main);
//   };

//   init();
//   create();

//   return {
//     spawn,
//     kill,
//   };
// };

// const isColumn = (el: HTMLElement) => el.classList.contains('zen-terminal-column');

// const isRow = (el: HTMLElement) => el.classList.contains('zen-terminal-row');

// const createColumn = () => {
//   const el = document.createElement('div');
//   el.classList.add('zen-terminal-column');
//   return el;
// };

// const createRow = () => {
//   const el = document.createElement('div');
//   el.classList.add('zen-terminal-row');
//   return el;
// };
