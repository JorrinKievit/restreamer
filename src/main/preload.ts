import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { exposeElectronTRPC } from "electron-trpc/main";

export type Channels =
  | "app-close"
  | "app-update-available"
  | "app-update-available-confirm"
  | "app-download-progress";

const electronHandler = {
  ipcRenderer: {
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld("electron", electronHandler);

process.once("loaded", () => {
  exposeElectronTRPC();
});

export type ElectronHandler = typeof electronHandler;
