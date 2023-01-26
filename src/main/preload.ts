import { app, contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ContentType } from 'types/tmbd';
import { VidSrcResponse } from 'types/vidsrc';

export type Channels =
  | 'vidsrc'
  | 'validate-vidsrc'
  | 'start-proxy'
  | 'stop-proxy'
  | 'proxy-started';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    getVidSrc(
      id: string,
      type: ContentType,
      season?: number,
      episode?: number
    ): Promise<VidSrcResponse> {
      return ipcRenderer.invoke('vidsrc', id, type, season, episode);
    },
    validatePass(url: string) {
      return ipcRenderer.invoke('validate-vidsrc', url);
    },
    startProxy(referer: string, origin: string) {
      ipcRenderer.send('start-proxy', referer, origin);
    },
    stopProxy() {
      ipcRenderer.send('stop-proxy');
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
