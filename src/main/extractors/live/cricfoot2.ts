import { load } from 'cheerio';
import log from 'electron-log';
import { LiveMainPage, LiveSourceUrl } from 'types/sources';
import vm, { runInContext } from 'vm';
import { axiosInstance } from '../../utils/axios';
import { ILiveExtractor } from '../types';

export class CricFoot2Extractor implements ILiveExtractor {
  name = 'CricFoot2';

  logger = log.scope(this.name);

  mainPageUrl = 'https://cricfoot2.com/';

  async getMainPage(): Promise<LiveMainPage[]> {
    const res = await axiosInstance.get(`${this.mainPageUrl}/sports_tv.php`);
    const $ = load(res.data);

    const items = $('.content_area .col-md-3')
      .map((i, el) => {
        const $1 = load(el);
        const title = $1('.b_box').text();
        const imgSrc = $1('img').attr('src')!;
        const url = $1('a').attr('href')!;
        return {
          title,
          imgSrc,
          url,
        };
      })
      .get();

    return items;
  }

  async extractUrl(url: string): Promise<LiveSourceUrl | undefined> {
    try {
      this.logger.debug(`extracting url: ${url}`);
      const res = await axiosInstance.get(url);
      const $ = load(res.data);
      const script = JSON.parse($("script[type='application/ld+json']").html()!);
      const liveUrl = script.itemListElement.find((item: any) => item.name === 'TV').item;

      const liveUrlRes = await axiosInstance.get(liveUrl);
      const $1 = load(liveUrlRes.data);
      const iframeUrl = $1('iframe').attr('src');
      if (!iframeUrl) throw new Error('No iframe url found');
      this.logger.debug(`iframeUrl: ${iframeUrl}`);

      let finalLiveUrl: LiveSourceUrl | undefined;
      if (iframeUrl.includes('tvpclive.com')) {
        finalLiveUrl = await this.extractTVpLiveUrl(iframeUrl);
      }
      if (iframeUrl.includes('crichd.vip')) {
        finalLiveUrl = await this.extractCrichdUrl(iframeUrl);
      }
      if (iframeUrl.includes('dlhd.sx')) {
        finalLiveUrl = await this.extractDlhd(iframeUrl);
      }
      if (iframeUrl.includes('daddylivehd.online')) {
        finalLiveUrl = await this.extractDaddyLiveHD(iframeUrl);
      }
      if (iframeUrl.includes('1stream.buzz')) {
        finalLiveUrl = await this.extract1StreamBuzz(iframeUrl);
      }

      if (!finalLiveUrl) throw new Error('No live url found');

      return finalLiveUrl;
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }

  private extractTVpLiveUrl = async (url: string): Promise<LiveSourceUrl | undefined> => {
    const res = await axiosInstance.get(url);
    const $ = load(res.data);
    const iframeUrl = $('iframe').attr('src');

    if (!iframeUrl) throw new Error('No iframe url found');
    const iframeRes = await axiosInstance.get(iframeUrl, {
      headers: {
        Referer: url,
      },
    });
    const regex = /source:'(.*?)'/g;
    const matches = [...iframeRes.data.matchAll(regex)];
    const finalLiveUrl = matches.map((match) => match[1])[1];

    return {
      name: this.name,
      url: finalLiveUrl,
      requiresProxy: true,
      referer: 'https://ddolahdplay.xyz/',
    };
  };

  private async extractCrichdUrl(url: string): Promise<LiveSourceUrl | undefined> {
    const res = await axiosInstance.get(url);
    const regex = /fid="([^"]+)"/;
    const fid = res.data.match(regex)[1];
    const res2 = await axiosInstance.get(`https://lovesomecommunity.com/crichdisi.php?player=desktop&live=${fid}`, {
      headers: {
        Referer: 'https://stream.crichd.vip/',
      },
    });
    const finalUrlRegex = /return\s*\(\s*\[([^\]]*)\]/;
    const finalUrl = JSON.parse(`[${res2.data.match(finalUrlRegex)[1]}]`)
      .join('')
      .replace('////', '//');

    return {
      name: this.name,
      url: finalUrl,
      requiresProxy: true,
      referer: 'https://lovesomecommunity.com/',
    };
  }

  private async extractDlhd(url: string): Promise<LiveSourceUrl | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: 'https://dlhd.sx/',
      },
    });
    const $ = load(res.data);
    const iframeUrl = $('iframe').attr('src');
    if (!iframeUrl) throw new Error('No iframe url found');
    const iframeRes = await axiosInstance.get(iframeUrl, {
      headers: {
        Referer: 'https://dlhd.sx/',
      },
    });
    const source = this.getNonCommentedSource(iframeRes.data);
    if (!source) throw new Error('No source url found');

    return {
      name: this.name,
      url: source,
      requiresProxy: true,
      referer: 'https://superntuplay.xyz/',
    };
  }

  private async extractOlaliveHdPlay(url: string) {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: 'https://daddylivehd.com/',
      },
    });
    const source = this.getNonCommentedSource(res.data);
    if (!source) throw new Error('No source url found');
    return source;
  }

  private async extractDaddyLiveHD(url: string): Promise<LiveSourceUrl | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: 'https://daddylivehd.com/',
      },
    });
    const $ = load(res.data);
    const iframeUrl = $('iframe').attr('src');
    if (!iframeUrl) throw new Error('No iframe url found');
    const source = await this.extractOlaliveHdPlay(iframeUrl);
    return {
      name: this.name,
      url: source,
      requiresProxy: true,
      referer: 'https://livehdplay.ru/',
    };
  }

  private async extract1StreamBuzz(url: string): Promise<LiveSourceUrl | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: this.mainPageUrl,
      },
    });
    const $ = load(res.data);
    const iframeUrl = $('iframe').attr('src');
    if (!iframeUrl) throw new Error('No iframe url found');
    const source = await this.extractAbolishStand(iframeUrl);
    return {
      name: this.name,
      url: source,
      requiresProxy: true,
      referer: 'https://abolishstand.net/',
    };
  }

  private async extractAbolishStand(url: string): Promise<string> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: 'https://1stream.buzz/',
      },
    });
    const $ = load(res.data);
    const script = $('script')
      .filter((_, el) => $(el).html()?.includes('eval') ?? false)
      .first()
      .html();

    this.logger.debug(script);
    if (!script) throw new Error('No script found');
    const sandbox = {
      src: '',
      $: () => {
        return {
          ready: () => {},
        };
      },
      document: {},
    };
    runInContext(script, vm.createContext(sandbox));

    return sandbox.src;
  }

  private getNonCommentedSource(data: string): string {
    const regex = /\/\/.*?(?=\n|$)|source\s*:\s*'([^']+)'/g;
    const matches = data.match(regex);
    const nonCommentedSources = matches?.filter((match: string) => !match.startsWith('//'));
    const firstNonCommentedSource = nonCommentedSources?.[0].match(/source\s*:\s*'([^']+)'/)?.[1];
    if (!firstNonCommentedSource) throw new Error('No source url found');
    return firstNonCommentedSource;
  }
}
