import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { SmashyCfExtractor } from './cf';
import { SmashyDudMovieExtractor } from './dudmovie';
import { SmashyEeMovieExtractor } from './ee';
import { SmashyEmsExtractor } from './ems';
import { SmashyFFixExtractor } from './ffix';
import { SmashyFizzzzExtractor } from './fizzzz';
import { SmashyFm22Extractor } from './fm22';
import { SmashyFxExtractor } from './fx';
import { SmashyImExtractor } from './im';
import { SmashyNFlimExtractor } from './nflim';
import { SmashySeguExtractor } from './segu';
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

  private fizzzzExtractor = new SmashyFizzzzExtractor();

  private fm22Extractor = new SmashyFm22Extractor();

  private dudMovieExtractor = new SmashyDudMovieExtractor();

  private seguExtractor = new SmashySeguExtractor();

  private emsExtractor = new SmashyEmsExtractor();

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

      const sourcesPromise = sourceUrls.map(async (sourceUrl, index) => {
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (sourceUrl.includes('fizzzz1.php')) {
          return this.fizzzzExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('fm22.php')) {
          return this.fm22Extractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('lk08.php')) {
          return this.seguExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('dud_movie.php')) {
          return this.dudMovieExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('segu.php')) {
          return this.seguExtractor.extractUrl(sourceUrl);
        }

        if (sourceUrl.includes('ems.php')) {
          return this.emsExtractor.extractUrl(sourceUrl);
        }
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
        if (sourceUrl.includes('fx555.php')) {
          return this.fxExtractor.extractUrl(sourceUrl);
        }
        if (sourceUrl.includes('cf.php')) {
          return this.cfExtractor.extractUrl(sourceUrl);
        }

        if (sourceUrl.includes('eemovie.php')) {
          return this.eeMovieExtractor.extractUrl(sourceUrl);
        }

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
