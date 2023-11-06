import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';

export class SmashyEeMovieExtractor implements IExtractor {
  name = 'Smashy (EE)';

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

      if (file.includes('/404Found.mp4')) return undefined;

      const fileRes = await axiosInstance.head(file);
      if (fileRes.status !== 200 || fileRes.data.includes('404')) return undefined;

      return {
        server: this.name,
        url: file,
        type: 'mp4',
        quality: 'Unknown',
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
