import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionFromM3u8 } from '../utils';

export class SmashySeguExtractor implements IExtractor {
  name = 'SmashySegu';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/segu.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const config = JSON.parse(res.data.match(/new\s+Playerjs\((\{[^]*?\})\);/)[1].replace(/'/g, '"'));
      const fileUrl = config.file.split(',')[0].split(']')[1];
      const quality = config.file.split(',')[0].split(']')[0].split('[')[1];

      return {
        server: this.name,
        url: fileUrl,
        type: fileUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: quality.includes('K') ? quality : quality.toLowerCase(),
        requiresProxy: false,
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
