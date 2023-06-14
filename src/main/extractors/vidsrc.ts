import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { Source, Sources } from 'types/sources';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { EmbedsitoExtractor } from './embedsito';

export class VidSrcExtractor implements IExtractor {
  url: string = 'https://v2.vidsrc.me/';

  referer: string = 'https://vidsrc.stream/';

  origin: string = 'https://vidsrc.stream';

  private embedUrl: string = `${this.url}embed/`;

  private embedsitoExtractor = new EmbedsitoExtractor();

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Sources> {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie' ? `${this.embedUrl}${imdbId}/` : type === 'tv' ? `${this.embedUrl}${imdbId}/${season}-${episode}/` : '';
      let res = await axiosInstance.get(url);

      const $ = load(res.data);
      const hashes = $('div.source')
        // Fembed is not working, timeout
        .map((_, el) => {
          const childDiv = $(el).find('div#name');
          const text = childDiv.text();
          if (text.includes('VidSrc Fembed')) return undefined;
          return el;
        })
        .map((_, el) => $(el).attr('data-hash'))
        .get();

      const serverlist = await Promise.all(
        hashes.map(async (hash) => {
          try {
            res = await axiosInstance.get(`${this.url}srcrcp/${hash}`, {
              headers: {
                referer: this.url,
              },
            });
            return res.request.res.responseUrl;
          } catch (error) {
            if (isAxiosError(error) || error instanceof Error) {
              console.log('VidSrc rcp: ', error.message);
            }
            return Promise.resolve(undefined);
          }
        })
      );
      const finalServerlist = await Promise.all(
        serverlist
          .filter((x) => x !== undefined)
          .map(async (server) => {
            const linkfixed = server.replace('https://vidsrc.xyz/', 'https://embedsito.com/');
            if (linkfixed.includes('/pro')) {
              res = await axiosInstance.get(server, {
                headers: {
                  referer: this.url,
                },
              });
              const m3u8Regex = /((https:|http:)\/\/.*\.m3u8)/g;
              const srcm3u8 = m3u8Regex.exec(res.data)![0];
              const extractorDataRegex = /['"](.*set_pass[^"']*)/;
              const extractorData = extractorDataRegex.exec(res.data)![1].replace('//', 'https://');

              return {
                server: 'pro',
                url: srcm3u8,
                extractorData,
              };
            }
            return {
              server: linkfixed.split('/')[2].split('.')[0],
              url: linkfixed,
            };
          })
      );
      const sourceURLS: (Source | undefined)[] = await Promise.all(
        finalServerlist.map(async (server) => {
          if (server.server === 'pro') {
            try {
              res = await axiosInstance.get(server.url, {
                method: 'GET',
                headers: {
                  referer: this.referer,
                },
              });
              if (res.request.res.responseUrl.includes('m3u8')) {
                return {
                  server: 'VidSrc Pro',
                  url: res.request.res.responseUrl as string,
                  type: 'm3u8',
                  quality: 'Unknown',
                  referer: this.referer,
                  origin: this.origin,
                  extractorData: server.extractorData,
                  requiresProxy: true,
                };
              }
            } catch (error) {
              if (isAxiosError(error) || error instanceof Error) {
                console.log('VidSrc Pro: ', error.message);
              }
              return undefined;
            }
          }
          if (server.server === 'embedsito') {
            const source = await this.embedsitoExtractor.extractUrl(server.url.split('/').pop()!);

            return source;
          }
          // mixdrop doesn't work yet, HTTP 509
          // if (server.server === 'mixdrop') {
          //   res = await axios.get(server.url);
          //   $ = load(res.data);
          //   const result = $('script')
          //     .map((_, el) => $(el).html())
          //     .get()
          //     .filter((el) => el.includes('MDCore.ref'))[0];

          //   const unpackedContext = runInContext(result, {
          //     MDCore: { wurl: '' },
          //   });
          //   const mixdropSourceUrl = unpackedContext.MDCore.wurl;

          //   if (!mixdropSourceUrl) {
          //     return null;
          //   }
          //   return {
          //     server: 'Mixdrop',
          //     url: mixdropSourceUrl.replace('//', 'https://'),
          //     referer: 'https://mixdrop.co/',
          //     origin: 'https://mixdrop.co',
          //     type: 'mp4',
          //   };
          // }
          return undefined;
        })
      );
      const sources = sourceURLS.filter((el) => el !== undefined) as Sources;
      return sources;
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        console.log('VidSrc: ', error.message);
      }
      return [];
    }
  }
}
