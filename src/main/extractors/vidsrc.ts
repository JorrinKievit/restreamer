import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { EmbedsitoExtractor } from './embedsito';

export class VidSrcExtractor implements IExtractor {
  logger = log.scope('VidSrc');

  url: string = 'https://vidsrc.me/';

  referer: string = 'https://vidsrc.stream/';

  origin: string = 'https://vidsrc.stream';

  private embedUrl: string = `${this.url}embed/`;

  private rcpUrl = 'https://rcp.vidsrc.me/rcp/';

  private rcp2Url = 'https://v2.vidsrc.me/srcrcp/';

  private embedsitoExtractor = new EmbedsitoExtractor();

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie' ? `${this.embedUrl}${imdbId}/` : type === 'tv' ? `${this.embedUrl}${imdbId}/${season}-${episode}/` : '';
      const res = await axiosInstance.get(url);

      const $ = load(res.data);
      const hashes = $('div.source')
        .map((_, el) => {
          const childDiv = $(el).find('div#name');
          const text = childDiv.text();
          if (text.includes('VidSrc Fembed')) return undefined;
          return el;
        })
        .map((_, el) => $(el).attr('data-hash'))
        .get();

      const srcRcpRes = await axiosInstance.get(`${this.rcpUrl}${hashes[0]}`, {
        headers: {
          referer: url,
        },
      });

      if (srcRcpRes.status !== 200) throw new Error('RCP Error');

      const srcRcpPro = await axiosInstance.get(`${this.rcp2Url}${hashes[0]}`, {
        headers: {
          referer: `${this.rcpUrl}${hashes[0]}`,
        },
      });

      const hlsUrl = /var hls_url = "(.*)"/g.exec(srcRcpPro.data)?.[1];
      const regex = /var path\s+=\s+['"]([^'"]+)['"]/g;

      let match;
      const paths = [];

      // eslint-disable-next-line no-cond-assign
      while ((match = regex.exec(srcRcpPro.data)) !== null) {
        paths.push(match[1]);
      }

      const extractorData = paths[1].replace('//', 'https://');

      return [
        {
          server: 'VidSrc Pro',
          url: hlsUrl as string,
          type: 'm3u8',
          quality: 'Unknown',
          referer: this.referer,
          origin: this.origin,
          extractorData,
          requiresProxy: true,
        },
      ];
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        this.logger.error(error.message);
      }
      return [];
    }
  }
}
