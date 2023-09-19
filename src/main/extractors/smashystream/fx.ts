import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';

export class SmashyFxExtractor implements IExtractor {
  logger = log.scope('SmashyFx');

  url = 'https://embed.smashystream.com/fx555.php';

  referer = 'https://remotestre.am/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });

      const file = res.data.match(/file:\s*"([^"]+)"/)[1];

      return {
        server: 'SmashyFx',
        referer: this.referer,
        url: file,
        type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: 'Unknown',
        requiresProxy: true,
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
