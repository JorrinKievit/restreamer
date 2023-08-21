import { isAxiosError } from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../IExtractor';
import { getResolutionFromM3u8 } from '../utils';

export class SmashyImExtractor implements IExtractor {
  logger = log.scope('SmashyIm');

  url = 'https://embed.smashystream.com/im.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const config = JSON.parse(res.data.match(/new\s+Playerjs\((\{.*?\})\);/)[1]);
      const fileUrl = config.file;

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

      const quality = await getResolutionFromM3u8(fileUrl, true);
      return {
        server: 'SmashyIm',
        url: fileUrl,
        type: fileUrl.includes('.m3u8') ? 'm3u8' : 'mp4',
        quality,
        requiresProxy: false,
        subtitles: subtitleArray,
      };
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
