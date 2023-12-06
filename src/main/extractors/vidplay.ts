import { Source } from 'types/sources';
import log from 'electron-log';
import { createCipheriv } from 'crypto';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

export class VidPlayExtractor implements IExtractor {
  name = 'VidPlay';

  logger = log.scope(this.name);

  url = 'https://vidplay.site';

  referer = 'https://vidplay.site/';

  private async getKeys(): Promise<string[]> {
    // Thanks to @Claudemirovsky for the keys :D
    const res = await axiosInstance.get('https://raw.githubusercontent.com/Claudemirovsky/worstsource-keys/keys/keys.json');
    return res.data;
  }

  private async getEncodedId(sourceUrl: string): Promise<string> {
    const id = sourceUrl.split('/e/')[1].split('?')[0];
    const keyList = await this.getKeys();
    const c1 = createCipheriv('rc4', Buffer.from(keyList[0]), '');
    const c2 = createCipheriv('rc4', Buffer.from(keyList[1]), '');

    let input = Buffer.from(id);
    input = Buffer.concat([c1.update(input), c1.final()]);
    input = Buffer.concat([c2.update(input), c2.final()]);

    return input.toString('base64').replace('/', '_');
  }

  private async getFuTokenKey(sourceUrl: string) {
    const id = await this.getEncodedId(sourceUrl);
    const res = await axiosInstance.get(`${this.url}/futoken`, {
      headers: {
        referer: encodeURIComponent(sourceUrl),
      },
    });
    const fuKey = res.data.match(/var\s+k\s*=\s*'([^']+)'/)[1];
    const a = [];
    for (let i = 0; i < id.length; i += 1) a.push(fuKey.charCodeAt(i % fuKey.length) + id.charCodeAt(i));
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
        thumbnails: {
          url: thumbnail?.file,
        },
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
