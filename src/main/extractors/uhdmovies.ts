import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import log from 'electron-log';
import { load } from 'cheerio';
import FormData from 'form-data';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';

export class UHDMoviesExtractor implements IExtractor {
  public name = 'UHDMovies';

  public url = 'https://uhdmovies.store';

  public logger = log.scope(this.name);

  private async extractDriveLeech(url: string) {
    const driveResult = await axiosInstance.get(url);
    const regex = /window\.location\.replace\("([^"]+)"\)/;
    const driveLeechPath = driveResult.data.match(regex)![1];
    const driveLeechResult = await axiosInstance.get(new URL(url).origin + driveLeechPath, {
      headers: {
        cookie: driveResult.headers['set-cookie'],
      },
    });
    const driveLeechResult$ = load(driveLeechResult.data);
    const instantDownload = driveLeechResult$('a:contains("Instant Download")').attr('href');
    if (!instantDownload) throw new Error('Instant download link not found');
    return instantDownload;
  }

  private async extractVideoCdn(url: string) {
    const formData = new FormData();
    formData.append('keys', url.split('url=')[1]);
    const apiData = await axiosInstance.post(`${new URL(url).origin}/api`, formData, {
      headers: {
        'x-token': new URL(url).hostname,
      },
    });
    if (apiData.data.error) throw new Error(apiData.data.error);
    return apiData.data.url;
  }

  public async extractUrls(showName: string, type: ContentType): Promise<Source[]> {
    try {
      if (type === 'tv') throw new Error('TV Shows are not supported');
      const searchResult = await axiosInstance.get(`${this.url}?s=${encodeURIComponent(showName)}`);
      const searchResult$ = load(searchResult.data);
      const detailLink = searchResult$('.row.gridlove-posts .layout-masonry article:first-child .box-inner-p a').attr('href');
      if (!detailLink) throw new Error('Movie not found');
      const detailResult = await axiosInstance.get(detailLink);
      const detailResult$ = load(detailResult.data);
      const driveLink = detailResult$(`a[title="Download From Google Drive"]`).attr('href');
      if (!driveLink) throw new Error('Google Drive link not found');
      const videoCdnLink = await this.extractDriveLeech(driveLink);
      const finalUrl = await this.extractVideoCdn(videoCdnLink);

      return [
        {
          server: this.name,
          url: finalUrl,
          quality: '4K',
          type: 'mkv',
          proxyType: 'none',
          isVlc: true,
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
