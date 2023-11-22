import * as m3u8Parser from 'm3u8-parser';
import crypto from 'crypto';
import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { getResolutionName } from './utils';
import { IExtractor } from './types';

export class RabbitStreamExtractor implements IExtractor {
  logger = log.scope('VidCloud');

  url: string = 'https://rabbitstream.net/';

  referer: string = 'https://rabbitstream.net/';

  private decryptionKeyUrl = 'https://raw.githubusercontent.com/enimax-anime/key/e4/key.txt';

  private md5(input: Buffer): Buffer {
    return crypto.createHash('md5').update(input).digest();
  }

  private generateKey(salt: Buffer, secret: Buffer): Buffer {
    let key = this.md5(Buffer.concat([secret, salt]));
    let currentKey = key;
    while (currentKey.length < 48) {
      key = this.md5(Buffer.concat([key, secret, salt]));
      currentKey = Buffer.concat([currentKey, key]);
    }
    return currentKey;
  }

  private decryptSourceUrl(decryptionKey: Buffer, sourceUrl: string): string {
    const cipherData = Buffer.from(sourceUrl, 'base64');
    const encrypted = cipherData.slice(16);
    const algorithm = 'aes-256-cbc';
    const iv = decryptionKey.slice(32);
    const decryptionKeyWithoutIv = decryptionKey.slice(0, 32);
    const decipher = crypto.createDecipheriv(algorithm, decryptionKeyWithoutIv, iv);
    const decryptedData = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decryptedData.toString('utf8');
  }

  private decrypt(input: string, key: string): string {
    const decryptionKey = this.generateKey(Buffer.from(input, 'base64').slice(8, 16), Buffer.from(key, 'utf8'));
    return this.decryptSourceUrl(decryptionKey, input);
  }

  private async getDecryptionKey() {
    const res = await axiosInstance.get(this.decryptionKeyUrl);
    return res.data;
  }

  private async extractSourceUrl(url: string) {
    const id = url.split('/').pop()!.split('?')[0];
    const apiUrl = `${this.url}ajax/embed-5/getSources?id=${id}`;
    const res = await axiosInstance.get(apiUrl);

    const sources = res.data.sources;
    const subtitles = res.data.tracks;

    const isDecrypted = !sources.includes('https://');

    let source = null;
    if (isDecrypted) {
      const decryptionKey = await this.getDecryptionKey();
      const decryptedSourceUrl = this.decrypt(sources, decryptionKey);
      const json = JSON.parse(decryptedSourceUrl);
      source = json[0];
    } else {
      source = sources[0];
    }

    return {
      sourceUrl: source.file,
      subtitles,
      isHls: source.type === 'hls',
    };
  }

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const { sourceUrl, subtitles, isHls } = await this.extractSourceUrl(url);

      const m3u8Manifest = await axiosInstance.get(sourceUrl);

      const parser = new m3u8Parser.Parser();
      parser.push(m3u8Manifest.data);
      parser.end();

      const parsedManifest = parser.manifest;
      const highestQuality = parsedManifest.playlists.reduce((prev: any, current: any) => {
        return prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH ? prev : current;
      });

      return {
        server: 'VidCloud',
        source: {
          url: sourceUrl,
        },
        type: isHls ? 'm3u8' : 'mp4',
        quality: getResolutionName(highestQuality.attributes.RESOLUTION.height),
        subtitles,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error.message);
      }
      return undefined;
    }
  }
}
