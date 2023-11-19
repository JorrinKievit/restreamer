import { load } from 'cheerio';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { RabbitStreamExtractor } from './rabbitstream';
import { StreamlareExtractor } from './streamlare';
import { formatToJSON, getCaptchaToken, getResolutionFromM3u8 } from './utils';

export class TwoEmbedExtractor implements IExtractor {
  name = '2Embed';

  logger = log.scope(this.name);

  url: string = 'https://www.2embed.cc/';

  referer: string = 'https://www.2embed.cc/';

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie' ? `${this.url}embed/${imdbId}` : type === 'tv' ? `${this.url}embedtv${imdbId}&s=${season}&e=${episode}/` : '';

      let res = await axiosInstance.get(url);
      const $ = load(res.data);
      const iframeUrl = $('iframe').attr('data-src');
      const id = iframeUrl?.match(/\?id=(.*?)&/)?.[1];
      if (!id) throw new Error('No id found');

      res = await axiosInstance.get(`https://wishfast.top/e/${id}`, {
        headers: {
          referer: this.referer,
        },
      });
      this.logger.debug(formatToJSON(res.data.match(/sources:\s*(\[.*?\])/)[1]), formatToJSON(res.data.match(/tracks:\s*(\[.*?\])/)[1]));
      const sources = JSON.parse(formatToJSON(res.data.match(/sources:\s*(\[.*?\])/)[1]));
      const tracks = JSON.parse(formatToJSON(res.data.match(/tracks:\s*(\[.*?\])/)[1]));
      const quality = await getResolutionFromM3u8(sources[0].file, true);
      const thumbnails = tracks.filter((t: any) => t.kind === 'thumbnails');
      const subtitles = tracks
        .filter((t: any) => t.kind === 'captions')
        .map((subtitle: any) => ({
          file: subtitle.file,
          label: subtitle.label,
          kind: 'captions',
        }));

      return [
        {
          server: this.name,
          quality,
          url: sources[0].file,
          type: 'm3u8',
          thumbnails: thumbnails.length ? thumbnails[0].file : undefined,
          subtitles,
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
