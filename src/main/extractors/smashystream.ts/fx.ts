import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../IExtractor';

export class SmashyFxExtractor implements IExtractor {
  logger = log.scope('SmashyFx');

  url = 'https://embed.smashystream.com/fx1.php';

  async extractUrl(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        referer: url,
      },
    });

    const file = res.data.match(/file:\s*"([^"]+)"/)[1];

    return {
      server: 'SmashyFx',
      url: file,
      type: file.includes('.m3u8') ? 'm3u8' : 'mp4',
      quality: 'Unknown',
      requiresProxy: false,
    };
  }
}
