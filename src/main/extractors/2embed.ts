import axios from 'axios';
import { load } from 'cheerio';
import { Source, Sources } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { RabbitStreamExtractor } from './rabbitstream';
import { StreamlareExtractor } from './streamlare';
import { getCaptchaToken } from './utils';

export class TwoEmbedExtractor {
  private static url: string = 'https://www.2embed.to/';

  private static referer: string = 'https://www.2embed.to/';

  public static extractUrls = async (
    imdbId: string,
    type: ContentType,
    season?: number,
    episode?: number
  ): Promise<Sources> => {
    const url =
      // eslint-disable-next-line no-nested-ternary
      type === 'movie'
        ? `${this.url}embed/imdb/movie?id=${imdbId}`
        : type === 'tv'
        ? `${this.url}embed/imdb/tv?id=${imdbId}&s=${season}&e=${episode}/`
        : '';

    let res = await axios.get(url);
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
          res = await axios.get(
            `${this.url}ajax/embed/play?id=${serverId}&_token=${captchaToken}`,
            {
              headers: {
                referer: url,
              },
            }
          );
          return res.data.link;
        } catch (error) {
          return Promise.resolve();
        }
      })
    );

    const finalServerlist: (Source | undefined)[] = await Promise.all(
      serverlist.map(async (server: string) => {
        if (server.includes('streamlare')) {
          return StreamlareExtractor.extractUrl(server);
        }
        if (server.includes('rabbitstream')) {
          return RabbitStreamExtractor.extractUrl(server);
        }
        return undefined;
      })
    );
    return finalServerlist.filter((server) => server !== undefined) as Sources;
  };
}
