import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { Source, Subtitle } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';

export class VidSrcExtractor implements IExtractor {
  logger = log.scope('VidSrc');

  url = 'https://vidsrc.me/';

  referer = 'https://vidsrc.stream/';

  origin = 'https://vidsrc.stream';

  private embedUrl = `${this.url}embed/`;

  private rcpUrl = 'https://rcp.vidsrc.me/rcp/';

  private rcp2Url = 'https://v2.vidsrc.me/srcrcp/';

  private subtitleUrl = 'https://rest.opensubtitles.org/search/imdbid-';

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
      if (!hlsUrl) throw new Error('HLS URL not found');

      const regex = /var path\s+=\s+['"]([^'"]+)['"]/g;

      let match;
      const paths = [];

      // eslint-disable-next-line no-cond-assign
      while ((match = regex.exec(srcRcpPro.data)) !== null) {
        paths.push(match[1]);
      }

      const extractorDataUrl = paths[1].replace('//', 'https://');

      const subtitleData = await axiosInstance.get(`${this.subtitleUrl}${imdbId}`, {
        headers: {
          'X-User-Agent': 'trailers.to-UA',
        },
      });

      const reducedSubtitles = subtitleData.data.reduce((accumulator: any, subtitle: any) => {
        const languageName = subtitle.LanguageName;
        accumulator[languageName] = accumulator[languageName] || [];
        if (accumulator[languageName].length < 5) {
          accumulator[languageName].push({
            file: subtitle.SubDownloadLink,
            label: subtitle.LanguageName,
            kind: 'captions',
          });
        }
        return accumulator;
      }, {});

      const finalSubtitles = Object.values(reducedSubtitles).flat() as Subtitle[];

      return [
        {
          server: 'VidSrc Pro',
          url: hlsUrl,
          type: 'm3u8',
          quality: 'Unknown',
          referer: this.referer,
          origin: this.origin,
          extractorData: {
            url: extractorDataUrl,
            hash: hashes[0],
          },
          requiresProxy: true,
          subtitles: finalSubtitles,
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
