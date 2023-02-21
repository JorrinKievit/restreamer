import axios from 'axios';
import crypto from 'crypto';
import { Source } from 'types/sources';

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

  static getDecryptionKey = async (type: 'rapidclown' | 'rabbitstream') => {
    const res = await axios.get(
      type === 'rapidclown'
        ? 'https://raw.githubusercontent.com/consumet/rapidclown/main/key.txt'
        : 'https://raw.githubusercontent.com/consumet/rapidclown/rabbitstream/key.txt'
    );
    return res.data;
  };

  static extractSourceUrl = async (url: string) => {
    const id = url.split('/').pop()!.split('?')[0];
    const apiUrl = `${this.url}ajax/embed-5/getSources?id=${id}`;
    const res = await axios.get(apiUrl);

    const sourceString = res.data.sources;
    const subtitles = res.data.tracks;

    try {
      const decryptionKey = await this.getDecryptionKey('rapidclown');
      const decryptedSourceUrl = this.decrypt(sourceString, decryptionKey);
      const json = JSON.parse(decryptedSourceUrl);

      return {
        sourceUrl: json[0].file,
        subtitles,
        isHls: json[0].type === 'hls',
      };
    } catch (e) {
      const decryptionKey = await this.getDecryptionKey('rabbitstream');
      const decryptedSourceUrl = this.decrypt(sourceString, decryptionKey);
      const json = JSON.parse(decryptedSourceUrl);

      return {
        sourceUrl: json[0].file,
        subtitles,
        isHls: json[0].type === 'hls',
      };
    }
  };

  public static extractUrl = async (
    url: string
  ): Promise<Source | undefined> => {
    try {
      const { sourceUrl, subtitles, isHls } = await this.extractSourceUrl(url);
      return {
        server: 'VidCloud',
        url: sourceUrl,
        type: isHls ? 'm3u8' : 'mp4',
        quality: '720p/1080p',
        requiresProxy: false,
        subtitles,
      };
    } catch (error) {
      return Promise.resolve(undefined);
    }
  };
}
