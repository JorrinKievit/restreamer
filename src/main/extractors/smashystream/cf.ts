import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';

export class SmashyCfExtractor implements IExtractor {
  name = 'Smashy (CF)';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/cf.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });

      const file = res.data.match(/file:\s*"([^"]+)"/)[1];

      const fileRes = await axiosInstance.head(file);

      if (fileRes.status !== 200 || fileRes.data.includes('404')) return undefined;

      return {
        server: this.name,
        url: file,
        type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: 'Unknown',
        proxyType: 'none',
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
