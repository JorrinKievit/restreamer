import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { RabbitStreamExtractor } from './rabbitstream';
import { StreamlareExtractor } from './streamlare';
import { getCaptchaToken } from './utils';

export class TwoEmbedExtractor implements IExtractor {
  logger = log.scope('2Embed');

  url: string = 'https://www.2embed.cc/';

  referer: string = 'https://www.2embed.cc/';

  private streamlareExtractor = new StreamlareExtractor();

  private rabbitStreamExtractor = new RabbitStreamExtractor();

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie' ? `${this.url}embed/${imdbId}` : type === 'tv' ? `${this.url}embedtv${imdbId}&s=${season}&e=${episode}/` : '';

      let res = await axiosInstance.get(url);
      const $ = load(res.data);
      const captchaKey = $('[data-recaptcha-key]').attr('data-recaptcha-key');

      if (!captchaKey) return [];

      const serverIds = $('a.dropdown-item')
        .map((_, el) => $(el).attr('data-id'))
        .get();

      const serverlist = await Promise.all(
        serverIds.map(async (serverId) => {
          try {
            const captchaToken = await getCaptchaToken(captchaKey, url);
            res = await axiosInstance.get(`${this.url}ajax/embed/play?id=${serverId}&_token=${captchaToken}`, {
              headers: {
                referer: url,
              },
            });
            return res.data.link;
          } catch (error) {
            return Promise.resolve();
          }
        })
      );

      const finalServerlist: (Source | undefined)[] = await Promise.all(
        serverlist.map(async (server: string) => {
          if (server.includes('streamlare')) {
            return this.streamlareExtractor.extractUrl(server);
          }
          if (server.includes('rabbitstream')) {
            return this.rabbitStreamExtractor.extractUrl(server);
          }
          return undefined;
        })
      );
      return finalServerlist.filter((server) => server !== undefined) as Source[];
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        this.logger.error(error.message);
      }
      return [];
    }
  }
}
