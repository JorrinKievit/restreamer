import { load } from 'cheerio';
import log from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { addLeadingZero, getResolutionFromM3u8 } from './utils';

export class ShowBoxExtractor implements IExtractor {
  name = 'ShowBox';

  logger = log.scope(this.name);

  url = 'https://showbox.media/';

  referer = 'https://showbox.media/';

  private async extractFebBox(
    url: string,
    contentType: ContentType,
    season?: number,
    episode?: number
  ): Promise<
    | {
        url: string;
        subtitles: Source['subtitles'];
      }
    | undefined
  > {
    const shareKey = url.split('share/')[1];
    const streams = await axiosInstance.get(`https://febbox.com/file/file_share_list?share_key=${shareKey}&pwd=''`);

    let showData = streams.data.data.file_list.reduce((prev: any, curr: any) => (prev.file_size > curr.file_size ? prev : curr));
    if (contentType === 'tv' && season && episode) {
      const seasonFid = streams.data.data.file_list.find((file: any) => file.file_name.includes(`season ${season}`))?.fid;
      const fileShareListResponse = await axiosInstance.get(`https://febbox.com/file/file_share_list?share_key=${shareKey}&pwd=''&parent_id=${seasonFid}`);
      showData = fileShareListResponse.data.data.file_list.find((file: any) => file.file_name.includes(`e${addLeadingZero(episode)}`) || file.file_name.includes(`episode ${episode}`));
    }

    const playerResponse = await axiosInstance.post('https://www.febbox.com/file/player', `fid=${showData.fid}&share_key=${shareKey}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    const subtitleRegex = /var\s+srt\s+=\s+(\[[^\]]*\])/;
    const subtitles = JSON.parse(playerResponse.data.match(subtitleRegex)[1]);

    const qualityMap = ['4k', '1080p%252B'];

    for (const quality of qualityMap) {
      const streamUrl = `https://febbox.com/hls/main/${showData.oss_fid}.m3u8?q=${quality}`;
      // eslint-disable-next-line no-await-in-loop
      const m3u8Response = await axiosInstance.get(streamUrl);
      if (m3u8Response.data) {
        return {
          url: streamUrl,
          subtitles: subtitles.map((subtitle: any) => ({
            file: subtitle.file,
            kind: subtitle.kind,
            label: subtitle.label,
          })),
        };
      }
    }
  }

  async extractUrls(showName: string, contentType: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const searchResult = await axiosInstance.get(`${this.url}/search?keyword=${encodeURIComponent(showName)}`);
      const searchResult$ = load(searchResult.data);
      const showLink = searchResult$('.film-name a').attr('href');

      const showId = showLink?.split('/')[3];
      const febBoxResult = await axiosInstance.get(`${this.url}/index/share_link?id=${showId}&type=${contentType === 'movie' ? '1' : '2'}`);
      if (febBoxResult.data.msg === 'success') {
        const febBoxData = await this.extractFebBox(febBoxResult.data.data.link, contentType, season, episode);
        if (!febBoxData) return [];

        const quality = await getResolutionFromM3u8(febBoxData.url, true, {
          referer: this.referer,
        });
        if (quality === 'Unknown') throw new Error('No quality found, so the stream is probably invalid');
        this.logger.debug(febBoxData);
        return [
          {
            server: this.name,
            source: {
              url: febBoxData.url,
            },
            quality,
            type: 'm3u8',
            subtitles: febBoxData.subtitles,
          },
        ];
      }
      return [];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
