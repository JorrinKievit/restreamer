import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import vm, { Context, runInContext } from 'vm';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { getResolutionName } from './utils';

export class GoMoviesExtractor implements IExtractor {
  logger = log.scope('GoMovies');

  url = 'https://gomovies-online.com';

  private qualities = [2160, 1080, 720, 480, 360];

  private base64Decode(str: string) {
    return Buffer.from(str, 'base64').toString('utf8');
  }

  private decryptXORCypher(data: string, key: string) {
    let decrypted = '';
    for (let i = 0; i < data.length; i += 1) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }

  private async getWorkingLink(links: string[]): Promise<{
    url: string;
    quality: Source['quality'];
  }> {
    const promises = links.map(async (link) => {
      try {
        const response = await axiosInstance.head(link);
        if (response.status === 200) {
          return link;
        }
      } catch (error) {
        if (isAxiosError(error)) this.logger.error(error.message);
      }
      return null;
    });

    const results = await Promise.all(promises);
    const workingLink = results.find((link) => link !== null) || null;
    if (!workingLink) throw new Error('No links found');
    return {
      url: workingLink,
      quality: getResolutionName(parseInt(workingLink.match(/\/(\d+)\?/)?.[1] || '0', 10)),
    };
  }

  async extractUrls(contentTitle: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      let episodeID: number | string = 0;
      const searchDocument = await axiosInstance.get(`${this.url}/search/${encodeURIComponent(contentTitle)}`);
      const $ = load(searchDocument.data);
      const contentName = type === 'movie' ? contentTitle : `${contentTitle} - Season ${season}`;
      let contentPageUrl = $(`[data-filmname*="${contentName}"] a`).attr('href');
      if (!contentPageUrl) throw new Error('ContentPage not found');
      let contentPageDocument = await axiosInstance.get(`${this.url}${contentPageUrl}`);
      let contentPage$ = load(contentPageDocument.data);

      if (type === 'tv') {
        const episodeUrl = contentPage$(`a[title^="Episode ${episode! < 10 ? `0${episode}` : episode}:"]`);
        if (!episodeUrl) throw new Error('Episode not found');

        const episodeAbsoluteUrl = `${this.url}${episodeUrl.attr('href')}`;
        contentPageUrl = episodeAbsoluteUrl;
        episodeID = episodeUrl.attr('data-ep-id') || 0;
        contentPageDocument = await axiosInstance.get(episodeAbsoluteUrl);
        contentPage$ = load(contentPageDocument.data);
      }

      const serverCodeRegex = contentPageDocument.data.match(/var url = '\/user\/servers\/(.*?)\?ep=.*?';/);
      const serverCode = serverCodeRegex ? serverCodeRegex[1] : null;
      const url = contentPage$("meta[property='og:url']").attr('content');
      const cookies = contentPageDocument.headers['set-cookie']?.map((cookie) => cookie.split(';')[0]);
      const serversPage = await axiosInstance.get(`${this.url}/user/servers/${serverCode}?ep=${type === 'tv' ? episodeID : 0}`, {
        headers: {
          Referer: url,
          cookie: cookies?.join('; '),
        },
      });
      const serversPage$ = load(serversPage.data);
      const regex = /eval\((.*)\)/g;
      const evalCode = serversPage.data.match(regex)?.[0];
      if (!evalCode) throw new Error('Eval code not found');
      const sandbox: Context = {
        startPlayer: () => {},
      };
      runInContext(evalCode, vm.createContext(sandbox));
      const decryptedCode = sandbox.startPlayer.toString();
      const keyRegex = /key=(\d+)/g;
      const key = decryptedCode.match(keyRegex)?.[0].split('=')[1];

      const servers: unknown[] = [];
      serversPage$('ul li').each((_, el) => {
        const liElement = serversPage$(el);
        const server = liElement.attr('data-value');
        servers.push(server);
      });

      const serverUrls = await Promise.all(
        servers.map(async (server) => {
          const encryptedDataResponse = await axiosInstance.get(`${url}?server=${server}&_=${Date.now()}`, {
            headers: {
              cookies,
              Referer: url,
              'X-Requested-With': 'XMLHttpRequest',
            },
          });
          return JSON.parse(this.decryptXORCypher(this.base64Decode(encryptedDataResponse.data), key));
        })
      );

      const firstServer = serverUrls[0][0];
      const maxQuality = parseInt(firstServer.max, 10);

      const updatedLinks = this.qualities.slice(this.qualities.indexOf(maxQuality)).map((quality) => firstServer.src.replace(firstServer.label, quality));

      const workingLink = await this.getWorkingLink(updatedLinks);
      if (!workingLink) throw new Error('No links found');

      const subitlesRegex = /window\.subtitles\s*=\s*([^<]+)/g;
      const subtitles = contentPageDocument.data.match(subitlesRegex)?.[0];
      const subtitlesJson = JSON.parse(subtitles.replace('window.subtitles = ', ''));

      return [
        {
          url: workingLink.url,
          server: 'GoMovies',
          type: firstServer.type,
          quality: workingLink.quality,
          subtitles: subtitlesJson.map((subtitle: any) => ({
            file: subtitle.src,
            label: subtitle.label,
            kind: 'captions',
          })),
          requiresProxy: false,
        },
      ];
    } catch (e) {
      if (isAxiosError(e) || e instanceof Error) this.logger.error(e.message);

      return [];
    }
  }
}
