/* eslint-disable max-classes-per-file */
import log from 'electron-log';
import { Source } from 'types/sources';
import vm from 'vm';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

export class FileMoonExtractor implements IExtractor {
  logger = log.scope('FileMoon');

  url = 'https://filemoon.sx/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url);
      const regex = /eval\((.*)\)/g;
      const evalCode = regex.exec(res.data)?.[0];
      if (!evalCode) throw new Error('No eval code found');

      const extractSource = async (file: string): Promise<Source> => {
        const quality = await getResolutionFromM3u8(file, true);

        return {
          server: 'FileMoon',
          url: file,
          type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
          quality,
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
            addEventListener: (event: string, callback: () => void) => {
              if (event === 'DOMContentLoaded') {
                callback();
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
          p2pml: {
            hlsjs: {
              Engine: class {
                constructor() {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  this.on = () => {};
                }

                createLoaderClass() {}
              },
            },
          },
        };

        vm.createContext(sandbox);
        vm.runInContext(evalCode, sandbox);
      });

      return await extractionPromise;
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
