import axios, { isAxiosError } from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { ContentType } from 'types/tmbd';
import crypto from 'crypto';
import { Source } from 'types/sources';
import { IExtractor } from './IExtractor';
import { getResolutionFromM3u8 } from './utils';

export class MoviesApiExtractor implements IExtractor {
  logger = log.scope('MoviesApi');

  url = 'https://moviesapi.club/';

  referer = 'https://moviesapi.club/';

  // Stolen from https://github.com/recloudstream/cloudstream/blob/bbbb7c4982d6f83f236883e2a9ed40d7a2b8eb61/app/src/main/java/com/lagradost/cloudstream3/extractors/Chillx.kt#L35C34-L35C51
  private KEY = '11x&W5UBrcqn$9Yl';

  async extractUrls(tmdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url = type === 'movie' ? `${this.url}movie/${tmdbId}` : `${this.url}tv/${tmdbId}-${season}-${episode}`;

      const res = await axios.get(url, {
        headers: {
          referer: 'https://moviesapi.club/movie/299536',
        },
      });
      const res$ = load(res.data);
      const iframeUrl = res$('iframe').attr('src');

      if (!iframeUrl) throw new Error('No iframe url found');

      const res2 = await axios.get(iframeUrl, {
        headers: {
          referer: url,
        },
      });

      const regex = /MasterJS\s*=\s*'([^']*)'/;
      const base64EncryptedData = regex.exec(res2.data)![1];
      const base64DecryptedData = JSON.parse(Buffer.from(base64EncryptedData, 'base64').toString('utf8'));

      const derivedKey = crypto.pbkdf2Sync(this.KEY, Buffer.from(base64DecryptedData.salt, 'hex'), base64DecryptedData.iterations, 32, 'sha512');
      const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(base64DecryptedData.iv, 'hex'));
      decipher.setEncoding('utf8');

      let decrypted = decipher.update(base64DecryptedData.ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      const sources = JSON.parse(decrypted.match(/sources: ([^\]]*\])/)![1]);
      const tracks = JSON.parse(decrypted.match(/tracks: ([^]*?\}\])/)![1]);

      const subtitles = tracks.filter((it: any) => it.kind === 'captions');
      const thumbnails = tracks.filter((it: any) => it.kind === 'thumbnails');

      const highestQuality = await getResolutionFromM3u8(sources[0].file);

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
          requiresProxy: true,
        },
      ];
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
