import type { PeeBridge } from '../../electron/preload/index';

declare global {
  interface Window {
    pee: PeeBridge;
  }
}

/** The only way renderer code talks to the main process — see electron/preload/index.ts. */
export function getBridge(): PeeBridge {
  return window.pee;
}
