import { load } from 'cheerio';
import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { getResolution } from '../utils';
import { GoFileExtractor } from './gofile';
import { extractAioTechnical } from './aiotechnical';

export class VegaMoviesExtractor implements IExtractor {
  name = 'VegaMovies';

  url = 'https://vegamovies.dad/';

  logger = log.scope(this.name);

  private goFileExtractor = new GoFileExtractor();

  private async getTitleUrl(title: string) {
    const res = await axiosInstance.get(`${this.url}search/${encodeURIComponent(title)}`);
    const $ = load(res.data);
    const pageTitle = $('head title').text();
    if (pageTitle.includes('Download')) {
      return res.request.res.responseUrl;
    }
    const pageUrl = $(`.blog-items article`).first().find('a').attr('href');
    return pageUrl;
  }

  private mapWrongShowTitles(title: string) {
    if (title.includes('Guardians of the Galaxy Vol. 3')) title.replace('Vol.', 'Volume');
    return title;
  }

  private async extractVCloud(url: string): Promise<Source> {
    const vcloudPage = await axiosInstance.get(url, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.35.0',
      },
    });
    const vCloudPage$ = load(vcloudPage.data);
    const vCloudPageCookies = vcloudPage.headers['set-cookie'];

    let vCloudDownloadLink = vCloudPage$('a.btn.btn-primary.h6').attr('href');
    if (!vCloudDownloadLink) {
      const redirectLinkRegex = /var\s+url\s*=\s*'([^']+)'/;
      const redirectLinkData = vcloudPage.data.match(redirectLinkRegex)[1];
      this.logger.debug(redirectLinkData, vCloudPageCookies);
      const responseUrl = await axiosInstance.get(redirectLinkData, {
        headers: {
          cookie: vCloudPageCookies,
          'User-Agent': 'PostmanRuntime/7.35.0',
        },
        validateStatus: () => true,
      });
      this.logger.debug(responseUrl.data.request.res.responseUrl);
      vCloudDownloadLink = Buffer.from(responseUrl.data.request.res.responseUrl.split('r=')[1], 'base64').toString();
    }
    const redirectLinkData = await axiosInstance.get(vCloudDownloadLink, {
      headers: {
        cookie: vCloudPageCookies,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Mobile Safari/537.36',
      },
    });
    const $redirectLinkData = load(redirectLinkData.data);
    let finalDownloadLink = $redirectLinkData('a.btn-success.btn-lg.h6').attr('href');
    if (!finalDownloadLink) {
      finalDownloadLink = $redirectLinkData('.btn.btn-success.btn-lg.h6').attr('href');
    }
    this.logger.debug(finalDownloadLink);
    if (!finalDownloadLink) throw new Error('No download link found');
    if (finalDownloadLink.includes('gofile')) {
      const source = await this.goFileExtractor.extractUrl(finalDownloadLink);
      if (!source) throw new Error('Invalid gofile link');
      return source;
    }

    return {
      server: this.name,
      source: {
        url: finalDownloadLink,
      },
      type: 'mkv',
      quality: getResolution(finalDownloadLink),
      isVlc: true,
    };
  }

  private async extractFastDl(url: string): Promise<Source> {
    const redirectPage = await axiosInstance.get(url);

    let fastDlUrl = '';
    if (redirectPage.data.includes('aiotechnical.com')) {
      fastDlUrl = await extractAioTechnical(redirectPage.data);
    }
    if (!fastDlUrl) throw new Error('FastDL link was not redirected through aiotechnical');
    const fastDlPage = await axiosInstance.get(fastDlUrl);
    throw new Error('FastDL link not implemented yet');

    return {
      server: this.name,
      source: {
        url: '',
      },
      type: 'mp4',
      quality: getResolution(''),
      isVlc: true,
    };
  }

  public async extractUrls(title: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const findMovieUrl = await this.getTitleUrl(this.mapWrongShowTitles(title));
      if (!findMovieUrl) throw new Error('Movie not found');
      const moviePage = await axiosInstance.get(findMovieUrl);
      const moviePage$ = load(moviePage.data);

      let downloadLink = moviePage$('.dwd-button').last().parent().attr('href');
      if (type === 'tv') {
        const seasonTitleContainer = moviePage$('h3:has(span) span')
          .filter((_, el) => moviePage$(el).text().includes(`Season ${season}`))
          .last();
        const seasonButtonContainer = seasonTitleContainer.parentsUntil('h3').parent().next();
        const vCloudUrl = seasonButtonContainer
          .find('button')
          .filter((_, el) => moviePage$(el).text().includes('V-Cloud') || moviePage$(el).text().includes('Episode Links') || moviePage$(el).text().includes('Single Episode'))
          .parent()
          .attr('href');
        downloadLink = vCloudUrl;
      }
      this.logger.debug(downloadLink);
      const formData = new URLSearchParams();
      formData.append('link', downloadLink!);
      const downloadLinkWithToken = await axiosInstance.post(`${new URL(downloadLink!).origin}/red.php`, formData.toString(), {
        headers: {
          referer: this.url,
        },
      });
      const urlRegex = /window\.location\.href\s*=\s*"([^"]+)"/;
      const downloadPageUrl = downloadLinkWithToken.data.match(urlRegex)![1];
      const downloadPage = await axiosInstance.get(downloadPageUrl);
      const downloadPage$ = load(downloadPage.data);
      let vcloudUrl = downloadPage$('a')
        .toArray()
        .find((a) => downloadPage$(a).attr('href')?.includes('v-cloud.bio') || downloadPage$(a).attr('href')?.includes('fast-dl.pro'));

      if (type === 'tv') {
        const episodesContainer = downloadPage$('h4 > span strong span').filter((_, el) => downloadPage$(el).text().includes(`-:Episodes: ${episode}:-`));
        const episodeButtonContainer = episodesContainer.parent().parent().parent().next();
        vcloudUrl = episodeButtonContainer
          .find('a')
          .toArray()
          .find((a) => downloadPage$(a).attr('href')?.includes('v-cloud.bio') || downloadPage$(a).attr('href')?.includes('fast-dl.pro'));
      }
      this.logger.debug('vCloudUrl', vcloudUrl?.attribs.href);

      if (vcloudUrl?.attribs.href.includes('v-cloud.bio')) {
        return [await this.extractVCloud(vcloudUrl.attribs.href)];
      }
      if (vcloudUrl?.attribs.href.includes('fast-dl.pro')) {
        return [await this.extractFastDl(vcloudUrl.attribs.href)];
      }

      throw new Error('No download link found');
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
