import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { Source, Subtitle } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../utils/axios';
import { FileMoonExtractor } from './filemoon';
import { IExtractor } from './types';
import { VidstreamExtractor } from './vidstream';

export class VidSrcToExtractor implements IExtractor {
  logger = log.scope('VidSrcTo');

  url = 'https://vidsrc.to/embed/';

  private mainUrl = 'https://vidsrc.to/';

  private vidStreamExtractor = new VidstreamExtractor();

  private fileMoonExtractor = new FileMoonExtractor();

  private key = '8z5Ag5wgagfsOuhz';

  private decodeBase64UrlSafe(str: string) {
    const standardizedInput = str.replace(/_/g, '/').replace(/-/g, '+');

    const binaryData = Buffer.from(standardizedInput, 'base64').toString('binary');

    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    return bytes;
  }

  private decode(str: Uint8Array) {
    const keyBytes = new TextEncoder().encode(this.key);

    let j = 0;
    const s = new Uint8Array(256);
    for (let i = 0; i < 256; i += 1) {
      s[i] = i;
    }

    for (let i = 0, k = 0; i < 256; i += 1) {
      j = (j + s[i] + keyBytes[k % keyBytes.length]) & 0xff;
      [s[i], s[j]] = [s[j], s[i]];
      k += 1;
    }

    const decoded = new Uint8Array(str.length);
    let i = 0;
    let k = 0;
    for (let index = 0; index < str.length; index += 1) {
      i = (i + 1) & 0xff;
      k = (k + s[i]) & 0xff;
      [s[i], s[k]] = [s[k], s[i]];
      const t = (s[i] + s[k]) & 0xff;
      decoded[index] = str[index] ^ s[t];
    }

    return decoded;
  }

  private decryptSourceUrl(sourceUrl: string) {
    const encoded = this.decodeBase64UrlSafe(sourceUrl);
    const decoded = this.decode(encoded);
    const decodedText = new TextDecoder().decode(decoded);

    return decodeURIComponent(decodeURIComponent(decodedText));
  }

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const mainUrl = type === 'movie' ? `${this.url}movie/${imdbId}` : `${this.url}tv/${imdbId}/${season}/${episode}`;
      const res = await axiosInstance.get(mainUrl);
      const $ = load(res.data);
      const dataId = $('a[data-id]').attr('data-id');

      const sources = await axiosInstance.get(`${this.mainUrl}ajax/embed/episode/${dataId}/sources`);
      if (sources.data.status !== 200) throw new Error('No sources found');

      const sourceUrlsPromise = sources.data.result.map(async (source: any) => {
        if (source.title === 'Vidstream') {
          const encryptedUrl = await axiosInstance.get(`${this.mainUrl}ajax/embed/source/${source.id}`);
          const decryptedUrl = this.decryptSourceUrl(encryptedUrl.data.result.url);
          const vidStreamUrl = await this.vidStreamExtractor.extractUrl(decryptedUrl);
          return vidStreamUrl;
        }
        if (source.title === 'Filemoon') {
          const encryptedUrl = await axiosInstance.get(`${this.mainUrl}ajax/embed/source/${source.id}`);
          const decryptedUrl = this.decryptSourceUrl(encryptedUrl.data.result.url);
          const fileMoonUrl = await this.fileMoonExtractor.extractUrl(decryptedUrl);
          return fileMoonUrl;
        }
        return undefined;
      });

      const sourceUrls = (await Promise.all(sourceUrlsPromise)).filter((it) => it !== undefined) as Source[];
      const subtitles = await axiosInstance.get(`${this.mainUrl}ajax/embed/episode/${dataId}/subtitles`);

      sourceUrls.forEach((sourceUrl) => {
        sourceUrl.subtitles = subtitles.data;
      });

      return sourceUrls;
    } catch (error) {
      if (error instanceof Error || isAxiosError(error)) this.logger.error(error.message);
      return [];
    }
  }
}
