import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionFromM3u8 } from '../utils';

export class SmashyDudMovieExtractor implements IExtractor {
  name = 'Smashy (DM)';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/dud_movie.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const config = JSON.parse(res.data.match(/new\s+Playerjs\((\{[^]*?\})\);/)[1].replace(/'/g, '"'));
      const fileUrl = config.file.find((it: any) => it.title === 'English').file;

      const quality = await getResolutionFromM3u8(fileUrl, true);
      return {
        server: this.name,
        source: {
          url: fileUrl,
        },
        type: fileUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality,
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
