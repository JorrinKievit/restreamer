import { app, contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContentType } from 'types/tmbd';
import { Sources } from 'types/sources';

export type Channels =
  | 'vidsrc'
  | 'validate-vidsrc'
  | 'start-proxy'
  | 'stop-proxy'
  | 'proxy-started'
  | 'app-close'
  | 'app-update-available'
  | 'app-update-available-confirm'
  | 'get-version'
  | 'app-download-progress';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    async getSources(
      imdbId: string | undefined,
      showName: string | undefined,
      type: ContentType,
      season?: number,
      episode?: number
    ): Promise<Sources> {
      if (!imdbId && !showName) {
        return [];
      }
      const response = await ipcRenderer.invoke(
        'get-sources',
        imdbId,
        showName,
        type,
        season,
        episode
      );
      return response;
    },
    validatePass(url: string) {
      return ipcRenderer.invoke('validate-vidsrc', url);
    },
    startProxy(referer?: string, origin?: string) {
      ipcRenderer.send('start-proxy', referer, origin);
    },
    stopProxy() {
      ipcRenderer.send('stop-proxy');
    },
    getVersion() {
      return ipcRenderer.invoke('get-version');
    },
    confirmUpdate() {
      ipcRenderer.send('app-update-available-confirm');
    },
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

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
