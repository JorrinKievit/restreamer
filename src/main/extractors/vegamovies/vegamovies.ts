import { load } from 'cheerio';
import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import fs from 'fs';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { findResolutionBasedOnFileName } from '../utils';
import { GoFileExtractor } from './gofile';

export class VegaMoviesExtractor implements IExtractor {
  name = 'VegaMovies';

  url = 'https://m.vegamovies.sx/';

  logger = log.scope(this.name);

  private goFileExtractor = new GoFileExtractor();

  private async getTitleUrl(title: string) {
    const res = await axiosInstance.get(`${this.url}search/${encodeURIComponent(title)}`);
    const $ = load(res.data);

    const pageUrl = $(`.blog-items article`).first().find('a').attr('href');
    return pageUrl;
  }

  private mapWrongShowTitles(title: string) {
    if (title.includes('Guardians of the Galaxy Vol. 3')) return title.replace('Vol.', 'Volume');
    return title;
  }

  public async extractUrls(title: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      if (type === 'tv') throw new Error('TV Shows not supported');
      const findMovieUrl = await this.getTitleUrl(this.mapWrongShowTitles(title));
      if (!findMovieUrl) throw new Error('Movie not found');
      const moviePage = await axiosInstance.get(findMovieUrl);
      const moviePage$ = load(moviePage.data);
      const downloadLink = moviePage$('.dwd-button').last().parent().attr('href');
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
      const vcloudUrl = downloadPage$('a')
        .toArray()
        .find((a) => downloadPage$(a).attr('href')?.includes('v-cloud.bio'));

      let redirectLinkData = '';
      const vcloudPage = await axiosInstance.get(vcloudUrl!.attribs.href!);
      const vCloudPageCookies = vcloudPage.headers['set-cookie'];
      const vCloudDownloadLinkRegex = /var\s+url\s*=\s*'([^']+)'/;

      const isResumable = vcloudUrl?.attribs.href.includes('v-cloud.bio/api/index');

      if (!isResumable) {
        const vCloudDownloadLink = vcloudPage.data.match(vCloudDownloadLinkRegex)[1];
        const redirectLink = Buffer.from(vCloudDownloadLink.split('r=')[1], 'base64').toString();
        const data = await axiosInstance.get(redirectLink, {
          headers: {
            cookie: vCloudPageCookies,
          },
        });
        redirectLinkData = data.data;
      } else {
        const $ = load(vcloudPage.data);
        const d = $('.btn.btn-success.btn-lg.h6').attr('href');
        const redirectDownloadData = await axiosInstance.get(d!, {
          headers: {
            cookie: vCloudPageCookies,
          },
        });
        const vCloudDownloadLink = redirectDownloadData.data.match(vCloudDownloadLinkRegex)[1];
        const redirectLink = Buffer.from(vCloudDownloadLink.split('r=')[1], 'base64').toString();
        console.log(redirectLink, redirectDownloadData.headers['set-cookie']);
        const data = await axiosInstance.get(redirectLink, {
          headers: {
            cookie: redirectDownloadData.headers['set-cookie'],
          },
        });
        redirectLinkData = data.data;
      }
      const $redirectLinkData = load(redirectLinkData);
      const finalDownloadLink = $redirectLinkData('.btn.btn-success.btn-lg.h6').attr('href');
      if (!finalDownloadLink) throw new Error('No download link found');
      if (finalDownloadLink.includes('gofile')) {
        const source = await this.goFileExtractor.extractUrl(finalDownloadLink);
        return source ? [source] : [];
      }
      return [
        {
          server: this.name,
          url: finalDownloadLink,
          type: 'mp4',
          proxyType: 'none',
          quality: findResolutionBasedOnFileName(finalDownloadLink),
          isVlc: true,
        },
      ];
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
