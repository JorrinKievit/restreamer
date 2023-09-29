import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionName } from '../utils';

export class SmashyNFlimExtractor implements IExtractor {
  name = 'Smashy (NF)';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/nflim.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const config = JSON.parse(res.data.match(/var\s+config\s*=\s*({.*?});/)[1]);
      const fileUrl = config.file.split(',')[0];

      const vttArray = config.subtitle.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g).map((entry: any) => {
        const [, name, link] = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
        return { name, link: link.replace(',', '') };
      });

      const fileUrlRes = await axiosInstance.head(fileUrl.split(']')[1]);

      if (fileUrlRes.status !== 200) return undefined;

      return {
        server: this.name,
        url: fileUrl.split(']')[1],
        type: fileUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: getResolutionName(parseInt(fileUrl.split(']')[0].split('[')[1], 10)),
        requiresProxy: false,
        subtitles: vttArray
          .filter((it: any) => !it.link.includes('thumbnails'))
          .map((subtitle: any) => ({
            file: subtitle.link,
            label: subtitle.name,
            kind: 'captions',
          })),
        thumbnails: vttArray.find((it: any) => it.link.includes('thumbnails'))?.link,
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
