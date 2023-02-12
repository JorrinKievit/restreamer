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
        requiresProxy: false,
        subtitles,
      };
    } catch (error) {
      return Promise.resolve(undefined);
    }
  };
}

// [{"file":"https://b-g-eu-12.feetcdn.com:2223/v3-hls-playback/902e42e6fee81096adf6d124a196177f0cf4baf650cb2ee1e9cff3dc7185a819e10b923f1a8b2add93c5d6caabf6db375281f8331cfb3023533a2169625aadd7249b87ea2e630f31b2b49cc6e640df5e0560da3a2db598aed8664b3d17336073f1cd2b0497d219c02ee9d08a3128ba82e368be21a6cdabc72ed0939583506ce31ac40b94982cf1c095da68ed598dab0e41e06d5a4535e26e615331d315608b1453668eb0664404d42dc52ef51cf5f695/playlist.m3u8","type":"hls"}]
