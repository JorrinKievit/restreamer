import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import fs from 'fs';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

export class RemoteStreamExtractor implements IExtractor {
  name = 'RemoteStream';

  logger = log.scope(this.name);

  url = 'https://remotestre.am/e/?';

  referer = 'https://remotestre.am/';

  async extractUrls(imdbId: string, type: ContentType, season?: number | undefined, episode?: number | undefined): Promise<Source[]> {
    try {
      const url = type === 'movie' ? `${this.url}imdb=${imdbId}` : `${this.url}imdb=${imdbId}&s=${season}&e=${episode}`;
      const res = await axiosInstance.get(url);

      const fileRegex = /"file":"(.*?)"/;
      const match = res.data.match(fileRegex);

      if (!match || !match[1]) throw new Error('No match found');

      this.logger.debug(match[1]);
      const quality = await getResolutionFromM3u8(match[1], true, {
        referer: this.referer,
      });

      return [
        {
          server: this.name,
          url: match[1],
          type: 'm3u8',
          quality,
          proxySettings: {
            type: 'm3u8',
            referer: this.referer,
          },
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
