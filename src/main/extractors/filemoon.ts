import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import vm from 'vm';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { getResolutionFromM3u8 } from './utils';

export class FileMoonExtractor implements IExtractor {
  logger = log.scope('FileMoon');

  url = 'https://filemoon.sx/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url);
      const regex = /eval\((.*)\)/g;
      const evalCode = res.data.match(regex)?.[0];
      if (!evalCode) throw new Error('No eval code found');

      const extractSource = async (file: string): Promise<Source> => {
        console.log('Callback called with file:', file);
        const quality = await getResolutionFromM3u8(file, true);

        return {
          server: 'FileMoon',
          url: file,

          type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
          quality,
          requiresProxy: false,
        };
      };

      const extractionPromise = new Promise<Source>((resolve, reject) => {
        const sandbox = {
          jwplayer: () => ({
            setup: async (config: any) => {
              if (config.sources && Array.isArray(config.sources)) {
                const firstSource = config.sources[0];
                if (firstSource && firstSource.file) {
                  resolve(extractSource(firstSource.file));
                } else {
                  reject(new Error('No file found'));
                }
              } else {
                reject(new Error('No sources found'));
              }
            },
            on: () => {},
            addButton: () => {},
            getButton: () => {},
            seek: () => {},
            getPosition: () => {},
            addEventListener: () => {},
            setCurrentCaptions: () => {},
            pause: () => {},
          }),
          document: {
            addEventListener: (event: string, cb: () => void) => {
              if (event === 'DOMContentLoaded') {
                cb();
              }
            },
          },
          fetch: async () => ({
            json: async () => ({}),
          }),
          $: () => ({
            hide: () => {},
            get: () => {},
            detach: () => ({
              insertAfter: () => {},
            }),
          }),
        };
        vm.createContext(sandbox);
        vm.runInContext(evalCode, sandbox);
      });

      return await extractionPromise;
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
