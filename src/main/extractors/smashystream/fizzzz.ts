import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolutionName } from '../utils';

export class SmashyFizzzzExtractor implements IExtractor {
  name = 'Smashy (Fiz)';

  logger = log.scope(this.name);

  url = 'https://embed.smashystream.com/fizzzz1.php';

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

      const subtitleArray = config.subtitle
        .split(',')
        .map((entry: any) => {
          const nameRegex = /\[([^\]]*)\]/;
          const urlRegex = /https:\/\/cc\.2cdns\.com\/.*?\/(\w+-\d+)\.vtt/;
          const nameMatch = nameRegex.exec(entry);
          const urlMatch = urlRegex.exec(entry);
          const name = nameMatch && nameMatch[1].trim() ? nameMatch[1].trim() : urlMatch && urlMatch[1];
          const subtitleUrl = urlMatch && urlMatch[0].trim();
          return {
            file: subtitleUrl,
            label: name,
            kind: 'captions',
          };
        })
        .filter((subtitle: any) => subtitle.file !== null);

      return {
        server: this.name,
        url: fileUrl,
        type: fileUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality: getResolutionName(parseInt(quality, 10)),
        subtitles: subtitleArray,
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
