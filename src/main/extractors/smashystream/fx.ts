import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';

export class SmashyFxExtractor implements IExtractor {
  name = 'Smashy (Fx)';

  logger = log.scope(this.name);

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
        server: this.name,
        referer: this.referer,
        url: file,
        type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: 'Unknown',
        proxyType: file.includes('.m3u8') ? 'm3u8' : 'mp4',
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
