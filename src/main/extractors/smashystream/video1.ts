import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionFromM3u8 } from '../utils';

export class SmashyVideo1Extractor implements IExtractor {
  name = 'Smashy (V1)';

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

      const vttArray = res.data.subtitleUrls.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g).map((entry: any) => {
        const [, name, link] = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
        return { name, link: link.replace(',', '') };
      });

      const quality = await getResolutionFromM3u8(res.data.sourceUrls[0], true, {
        referer: this.referer,
      });

      return {
        server: this.name,
        source: {
          url: res.data.sourceUrls[0],
        },
        type: 'm3u8',
        quality,
        subtitles: vttArray
          .filter((it: any) => !it.link.includes('thumbnails'))
          .map((subtitle: any) => ({
            file: subtitle.link,
            label: subtitle.name,
            kind: 'captions',
          })),
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
