import axios from 'axios';
import * as m3u8Parser from 'm3u8-parser';
import crypto from 'crypto';
import { Source } from 'types/sources';
import { getResolutionName } from './utils';

export class RabbitStreamExtractor {
  private static url: string = 'https://rabbitstream.net/';

  private static referer: string = 'https://rabbitstream.net/';

  static md5 = (input: Buffer): Buffer => {
    return crypto.createHash('md5').update(input).digest();
  };

  static generateKey = (salt: Buffer, secret: Buffer): Buffer => {
    let key = this.md5(Buffer.concat([secret, salt]));
    let currentKey = key;
    while (currentKey.length < 48) {
      key = this.md5(Buffer.concat([key, secret, salt]));
      currentKey = Buffer.concat([currentKey, key]);
    }
    return currentKey;
  };

  static decryptSourceUrl = (
    decryptionKey: Buffer,
    sourceUrl: string
  ): string => {
    const cipherData = Buffer.from(sourceUrl, 'base64');
    const encrypted = cipherData.slice(16);
    const algorithm = 'aes-256-cbc';
    const iv = decryptionKey.slice(32);
    const decryptionKeyWithoutIv = decryptionKey.slice(0, 32);
    const decipher = crypto.createDecipheriv(
      algorithm,
      decryptionKeyWithoutIv,
      iv
    );
    const decryptedData = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decryptedData.toString('utf8');
  };

  static decrypt = (input: string, key: string): string => {
    const decryptionKey = this.generateKey(
      Buffer.from(input, 'base64').slice(8, 16),
      Buffer.from(key, 'utf8')
    );
    return this.decryptSourceUrl(decryptionKey, input);
  };

  static getDecryptionKey = async () => {
    const res = await axios.get(
      'https://raw.githubusercontent.com/enimax-anime/key/e4/key.txt'
    );
    return res.data;
  };

  static extractSourceUrl = async (url: string) => {
    const id = url.split('/').pop()!.split('?')[0];
    const apiUrl = `${this.url}ajax/embed-5/getSources?id=${id}`;
    const res = await axios.get(apiUrl);

    const sourceString = res.data.sources;
    const subtitles = res.data.tracks;

    const decryptionKey = await this.getDecryptionKey();
    const decryptedSourceUrl = this.decrypt(sourceString, decryptionKey);
    const json = JSON.parse(decryptedSourceUrl);

    return {
      sourceUrl: json[0].file,
      subtitles,
      isHls: json[0].type === 'hls',
    };
  };

  public static extractUrl = async (
    url: string
  ): Promise<Source | undefined> => {
    try {
      const { sourceUrl, subtitles, isHls } = await this.extractSourceUrl(url);

      const m3u8Manifest = await axios.get(sourceUrl);

      const parser = new m3u8Parser.Parser();
      parser.push(m3u8Manifest.data);
      parser.end();

      const parsedManifest = parser.manifest;
      const highestQuality = parsedManifest.playlists.reduce(
        (prev: any, current: any) => {
          return prev.attributes.BANDWIDTH > current.attributes.BANDWIDTH
            ? prev
            : current;
        }
      );

      return {
        server: 'VidCloud',
        url: sourceUrl,
        type: isHls ? 'm3u8' : 'mp4',
        quality: getResolutionName(highestQuality.attributes.RESOLUTION.height),
        requiresProxy: false,
        subtitles,
      };
    } catch (error) {
      return Promise.resolve(undefined);
    }
  };
}
