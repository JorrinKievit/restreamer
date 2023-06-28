import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../IExtractor';
import { SmashyCfExtractor } from './cf';
import { SmashyEeMovieExtractor } from './ee';
import { SmashyFFixExtractor } from './ffix';
import { SmashyFxExtractor } from './fx';
import { SmashyNFlimExtractor } from './nflim';
import { SmashyWatchXExtractor } from './watchx';

export class SmashyStreamExtractor implements IExtractor {
  logger = log.scope('SmashyStream');

  url = 'https://embed.smashystream.com/playere.php';

  referer = 'https://smashystream.com/';

  private ffixExtractor = new SmashyFFixExtractor();

  private watchXExtractor = new SmashyWatchXExtractor();

  private nflimExtractor = new SmashyNFlimExtractor();

  private fxExtractor = new SmashyFxExtractor();

  private cfExtractor = new SmashyCfExtractor();

  private eeMovieExtractor = new SmashyEeMovieExtractor();

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url = type === 'movie' ? `${this.url}?imdb=${imdbId}` : `${this.url}?imdb=${imdbId}&season=${season}&episode=${episode}`;

      const res = await axiosInstance.get(url, {
        headers: {
          referer: this.referer,
        },
      });
      const $ = load(res.data);

      const sourceUrls = $('.dropdown-menu a[data-id]')
        .map((_, el) => $(el).attr('data-id'))
        .get()
        .filter((it) => it !== '_default');

      const sourcesPromise = sourceUrls.map((sourceUrl) => {
        if (sourceUrl.includes('ffix')) {
          return this.ffixExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('watchx')) {
          return this.watchXExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('nflim')) {
          return this.nflimExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('fx')) {
          return this.fxExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('cf')) {
          return this.cfExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('eemovie')) {
          return this.eeMovieExtractor.extractUrl(sourceUrl);
        }

        return undefined;
      });

      const sources = await Promise.all(sourcesPromise);

      return sources.filter((it) => it !== undefined) as Source[];
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
