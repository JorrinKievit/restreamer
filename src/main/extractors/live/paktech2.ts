import { load } from 'cheerio';
import log from 'electron-log';
import { LiveSourceUrl } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { ILiveExtractor } from '../types';

export class PakTech2Extractor implements ILiveExtractor {
  name = 'PakTech2';

  logger = log.scope('PakTech2');

  mainPageUrl = 'https://paktech2.com/';

  referer = 'https://ddolahdplay.xyz/';

  async getMainPage() {
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

  async extractUrl(url: string): Promise<LiveSourceUrl> {
    const res = await axiosInstance.get(url);
    const $ = load(res.data);
    const script = JSON.parse($("script[type='application/ld+json']").html()!);
    const liveUrl = script.itemListElement.find((item: any) => item.item.name === 'Live').item['@id'];

    const liveUrlRes = await axiosInstance.get(liveUrl);
    const $1 = load(liveUrlRes.data);
    const iframeUrl = $1('iframe').attr('src');

    if (!iframeUrl) throw new Error('No iframe url found');

    const iframeRes = await axiosInstance.get(iframeUrl);
    const $2 = load(iframeRes.data);
    const iframeUrl2 = $2('iframe').attr('src');

    if (!iframeUrl2) throw new Error('No iframe url found');

    const iframeRes2 = await axiosInstance.get(iframeUrl2, {
      headers: {
        Referer: iframeUrl,
      },
    });

    const regex = /source:'(.*?)'/g;
    const matches = [...iframeRes2.data.matchAll(regex)];
    const finalLiveUrl = matches.map((match) => match[1])[1];

    return {
      name: 'PakTech2',
      url: finalLiveUrl,
      requiresProxy: true,
      referer: this.referer,
    };
  }
}
