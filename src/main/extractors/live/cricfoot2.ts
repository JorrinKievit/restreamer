import { isAxiosError } from 'axios';
import { load } from 'cheerio';
import log from 'electron-log';
import { LiveMainPage, LiveSourceUrl } from 'types/sources';
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
      const res = await axiosInstance.get(url);
      const $ = load(res.data);
      const script = JSON.parse($("script[type='application/ld+json']").html()!);
      const liveUrl = script.itemListElement.find((item: any) => item.name === 'TV').item;

      const liveUrlRes = await axiosInstance.get(liveUrl);
      const $1 = load(liveUrlRes.data);
      const iframeUrl = $1('iframe').attr('src');

      if (!iframeUrl) throw new Error('No iframe url found');

      let finalLiveUrl: LiveSourceUrl | undefined;
      if (iframeUrl.includes('tvpclive.com')) {
        finalLiveUrl = await this.extractTVpLiveUrl(iframeUrl);
      }
      if (iframeUrl.includes('crichd.vip')) {
        finalLiveUrl = await this.extractCrichdUrl(iframeUrl);
      }

      if (!finalLiveUrl) throw new Error('No live url found');

      return finalLiveUrl;
    } catch (err) {
      if (err instanceof Error || isAxiosError(err)) this.logger.error(err.message);
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

  private extractCrichdUrl = async (url: string): Promise<LiveSourceUrl | undefined> => {
    const res = await axiosInstance.get(url);

    const regex = /fid="([^"]+)"/;
    const fid = res.data.match(regex)[1];
    const res2 = await axiosInstance.get(`https://lovesomecommunity.com/crichd.php?player=desktop&live=${fid}`, {
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
  };
}
