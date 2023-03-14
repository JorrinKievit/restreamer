import axios from 'axios';
import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { Source, Sources } from 'types/sources';

export class VidSrcExtractor {
  private static mainUrl: string = 'https://v2.vidsrc.me/';

  private static embedUrl: string = 'https://v2.vidsrc.me/embed/';

  public static extractUrls = async (
    imdbId: string,
    type: ContentType,
    season?: number,
    episode?: number
  ): Promise<Sources> => {
    try {
      const url =
        // eslint-disable-next-line no-nested-ternary
        type === 'movie'
          ? `${this.embedUrl}${imdbId}/`
          : type === 'tv'
          ? `${this.embedUrl}${imdbId}/${season}-${episode}/`
          : '';
      let res = await axios.get(url);

      const $ = load(res.data);
      const hashes = $('div.source')
        .map((_, el) => $(el).attr('data-hash'))
        .get();

      const serverlist = await Promise.all(
        hashes.map(async (hash) => {
          res = await axios.get(`${this.mainUrl}srcrcp/${hash}`, {
            headers: {
              referer: this.mainUrl,
            },
          });
          return res.request.res.responseUrl;
        })
      );
      const finalServerlist = await Promise.all(
        serverlist.map(async (server) => {
          const linkfixed = server.replace(
            'https://vidsrc.xyz/',
            'https://embedsito.com/'
          );
          if (linkfixed.includes('/pro')) {
            res = await axios.get(server, {
              headers: {
                referer: this.mainUrl,
              },
            });
            const m3u8Regex = /((https:|http:)\/\/.*\.m3u8)/g;
            const srcm3u8 = m3u8Regex.exec(res.data)![0];
            const extractorDataRegex = /['"](.*set_pass[^"']*)/;
            const extractorData = extractorDataRegex
              .exec(res.data)![1]
              .replace('//', 'https://');

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
            res = await axios.get(server.url, {
              method: 'GET',
              headers: {
                referer: 'https://vidsrc.stream/',
              },
            });
            if (res.request.res.responseUrl.includes('m3u8')) {
              return {
                server: 'VidSrc Pro',
                url: res.request.res.responseUrl as string,
                type: 'm3u8',
                quality: 'Unknown',
                referer: 'https://vidsrc.stream/',
                origin: 'https://vidsrc.stream',
                extractorData: server.extractorData,
                requiresProxy: true,
              } as Source;
            }
          }
          if (server.server === 'embedsito') {
            res = await axios.post(
              `https://embedsito.com/api/source/${server.url.split('/').pop()}`
            );

            const file = res.data.data[res.data.data.length - 1];
            const redirectUrl = file.file;
            const quality = file.label;
            const fileType = file.type;

            const finalUrl = await axios.get(redirectUrl, {
              maxRedirects: 0,
              validateStatus: (status) => {
                return status >= 200 && status < 400;
              },
            });
            return {
              server: 'Embedsito',
              url: finalUrl.headers.location!,
              type: fileType === 'mp4' ? 'mp4' : 'm3u8',
              quality,
              requiresProxy: false,
            } as Source;
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
      return [];
    }
  };
}
