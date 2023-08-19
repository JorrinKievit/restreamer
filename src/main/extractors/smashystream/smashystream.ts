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
import { SmashyImExtractor } from './im';
import { SmashyNFlimExtractor } from './nflim';
import { SmashyWatchXExtractor } from './watchx';

export class SmashyStreamExtractor implements IExtractor {
  logger = log.scope('SmashyStream');

  url = 'https://embed.smashystream.com/playere.php';

  referer = 'https://smashystream.com/';

  private imExtractor = new SmashyImExtractor();

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
        if (sourceUrl.includes('im.php')) {
          return this.imExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('ffix1.php')) {
          return this.ffixExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('watchx.php')) {
          return this.watchXExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('nflim.php')) {
          return this.nflimExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('fx1.php')) {
          return this.fxExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('cf.php')) {
          return this.cfExtractor.extractUrl(sourceUrl);
        }
        // Almost never works or really slow
        // if (sourceUrl.includes('eemovie.php')) {
        //   return this.eeMovieExtractor.extractUrl(sourceUrl);
        // }

        return undefined;
      });

      const sources = await Promise.all(sourcesPromise.filter((it) => it !== undefined));

      return sources.filter((it) => it !== undefined) as Source[];
    } catch (err) {
      if (isAxiosError(err) || err instanceof Error) this.logger.error(err);
      return [];
    }
  }
}
