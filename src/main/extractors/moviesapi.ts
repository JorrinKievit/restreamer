import axios from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { ContentType } from 'types/tmbd';
import crypto from 'crypto';
import { Source } from 'types/sources';
import vm from 'vm';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

export class MoviesApiExtractor implements IExtractor {
  logger = log.scope('MoviesApi');

  url = 'https://ww1.moviesapi.club/';

  referer = 'https://moviesapi.club/';

  private getKey(stringData: string) {
    const sandbox = {
      JScripts: '',
      CryptoJSAesJson: {
        decrypt: (data: string, key: string) => {
          return JSON.stringify(key);
        },
      },
    };
    vm.createContext(sandbox);
    const key = vm.runInContext(stringData, sandbox);
    return key;
  }

  async extractUrls(tmdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url = type === 'movie' ? `${this.url}movie/${tmdbId}` : `${this.url}tv/${tmdbId}-${season}-${episode}`;

      const res = await axios.get(url, {
        headers: {
          referer: 'https://pressplay.top',
        },
      });
      const res$ = load(res.data);
      const iframeUrl = res$('iframe').attr('src');
      this.logger.debug(iframeUrl);

      if (!iframeUrl) throw new Error('No iframe url found');

      const res2 = await axios.get(iframeUrl, {
        headers: {
          referer: url,
        },
      });
      const res2$ = load(res2.data);
      const stringData = res2$('body script').eq(2).html();
      if (!stringData) throw new Error('No script found');
      const key = this.getKey(stringData);
      this.logger.debug(key);

      const regex = /JScripts\s*=\s*'([^']*)'/;
      const base64EncryptedData = regex.exec(res2.data)![1];
      const base64DecryptedData = JSON.parse(base64EncryptedData);
      this.logger.debug(base64DecryptedData);

      const salt = Buffer.from(base64DecryptedData.s, 'hex');
      const iv = Buffer.from(base64DecryptedData.iv, 'hex');
      const derivedKey = crypto.pbkdf2Sync(key, salt, 1, 32, 'md5');
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
      decipher.setAutoPadding(false);

      const encryptedBuffer = Buffer.from(base64DecryptedData.ct, 'base64');
      const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

      const decryptedString = decryptedBuffer.toString('utf-8');
      this.logger.debug(decryptedString);

      const sources = JSON.parse(decryptedString.match(/sources: ([^\]]*\])/)![1]);
      const tracks = JSON.parse(decryptedString.match(/tracks: ([^]*?\}\])/)![1]);

      const subtitles = tracks.filter((it: any) => it.kind === 'captions');
      const thumbnails = tracks.filter((it: any) => it.kind === 'thumbnails');

      const highestQuality = await getResolutionFromM3u8(sources[0].file, true);

      return [
        {
          server: 'MoviesApi',
          referer: this.referer,
          url: sources[0].file,
          type: sources[0].type === 'hls' ? 'm3u8' : 'mp4',
          quality: highestQuality,
          subtitles: subtitles.map((it: any) => ({
            file: it.file,
            label: it.label,
            kind: it.kind,
          })),
          thumbnails: thumbnails[0]?.file,
          proxyType: 'm3u8',
        },
      ];
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
