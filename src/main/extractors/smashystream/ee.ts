import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';

export class SmashyEeMovieExtractor implements IExtractor {
  logger = log.scope('SmashyEe');

  url = 'https://embed.smashystream.com/cf.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });

      const file = res.data.match(/file:\s*"([^"]+)"/)[1];

      if (file.includes('/404Found.mp4')) return undefined;

      return {
        server: 'SmashyEe',
        url: file,
        type: 'mp4',
        quality: 'Unknown',
        requiresProxy: false,
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}