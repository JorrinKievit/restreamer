import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

export class VidPlayExtractor implements IExtractor {
  name = 'VidPlay';

  logger = log.scope(this.name);

  url = 'https://vidplay.site';

  referer = 'https://vidplay.site/';

  private key = 'Or37imdJp49PyZ4J';

  private async getFuTokenKey(referer: string) {
    const res = await axiosInstance.get(`${this.url}/futoken`, {
      headers: {
        referer: encodeURIComponent(referer),
      },
    });
    const fuKey = res.data.match(/var\s+k\s*=\s*'([^']+)'/)[1];
    const a = [];
    for (let i = 0; i < this.key.length; i += 1) a.push(fuKey.charCodeAt(i % fuKey.length) + this.key.charCodeAt(i));
    return `${fuKey},${a.join(',')}`;
  }

  private async getFileUrl(sourceUrl: string) {
    const futoken = await this.getFuTokenKey(sourceUrl);
    const url = `${this.url}/mediainfo/${futoken}?${sourceUrl.split('?')[1]}`;
    return url;
  }

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const fileUrl = await this.getFileUrl(`${url}&autostart=true`);
      this.logger.debug(fileUrl);
      const res = await axiosInstance.get(fileUrl, {
        headers: {
          referer: url,
        },
      });
      this.logger.debug(res.data);
      const source = res.data.result.sources[0].file;

      const quality = await getResolutionFromM3u8(source, true);

      const thumbnail = res.data.result?.tracks?.find((track: any) => track.kind === 'thumbnails');

      return {
        server: this.name,
        source: {
          url: source,
        },
        type: 'm3u8',
        quality,
        thumbnails: thumbnail?.file,
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
