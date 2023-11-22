import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionFromM3u8 } from '../utils';

export class SmashyVideo3MExtractor implements IExtractor {
  name = 'Smashy (3M)';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/video1.php';

  referer = 'https://embed.smashystream.com/playere.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: this.referer,
        },
      });
      const sourceUrl = res.data.sourceUrls.find((s: any) => s.title === 'English').file;
      if (!sourceUrl) throw new Error('No source url found');

      const quality = await getResolutionFromM3u8(sourceUrl, true, {
        referer: this.referer,
      });

      return {
        server: this.name,
        source: {
          url: sourceUrl,
        },
        type: 'm3u8',
        quality,
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
