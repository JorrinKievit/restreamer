import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { addLeadingZero } from './utils';

export class MyFileStorageExtractor implements IExtractor {
  name = 'MyFileStorage';

  logger = log.scope('MyFileStorage');

  url = 'https://myfilestorage.xyz';

  referer = 'https://bflix.gs/';

  async extractUrls(tmdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      let url = `${this.url}/${tmdbId}.mp4`;

      if (type === 'tv' && season && episode) {
        url = `${this.url}/tv/${tmdbId}/s${season}e${addLeadingZero(episode)}.mp4`;
      }

      const res = await axiosInstance.head(url, {
        validateStatus: () => true,
        headers: {
          referer: this.referer,
        },
      });
      this.logger.debug(res.status, res.statusText);
      if (res.status !== 200) throw new Error('No sources found');

      return [
        {
          server: this.name,
          source: {
            url,
          },
          type: 'mp4',
          quality: '720p/1080p',
          proxySettings: {
            type: 'mp4',
            referer: this.referer,
          },
        },
      ];
    } catch (e) {
      if (e instanceof Error) this.logger.error(e.message);
      return [];
    }
  }
}
