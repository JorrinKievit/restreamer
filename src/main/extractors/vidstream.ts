import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';
import { findHighestResolutionStream, getResolutionFromM3u8, resolveRelativePaths } from './utils';

export class VidstreamExtractor implements IExtractor {
  logger = log.scope('Vidstream');

  url = 'https://vidstream.pro/';

  referer = 'https://vidstream.pro/';

  private eltikUrl = 'https://9anime.eltik.net/';

  private async getFuToken(referer: string) {
    const res = await axiosInstance.get(`${this.url}futoken`, {
      headers: {
        referer: encodeURIComponent(referer),
      },
    });
    const fuTokenWithoutComments = res.data.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');
    return fuTokenWithoutComments;
  }

  private async getFileUrl(sourceUrl: string) {
    const futoken = await this.getFuToken(sourceUrl);
    const id = sourceUrl.split('e/')[1].split('?')[0];

    const res = await axiosInstance.post(`${this.eltikUrl}rawVizcloud?query=${id}&apikey=lagrapps`, {
      query: id,
      futoken,
    });
    return `${res.data.rawURL}?${sourceUrl.split('?')[1]}`;
  }

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const fileUrl = await this.getFileUrl(`${url}&autostart=true`);
      const res = await axiosInstance.get(fileUrl, {
        headers: {
          referer: url,
        },
      });
      const source = res.data.result.sources[0].file;
      const mainM3U8Url = `${res.data.result.sources[0].file.split('br/')[0]}br/`;

      const m3u8Content = await axiosInstance.get(source);
      const highestResolutionStream = findHighestResolutionStream(m3u8Content.data);

      const mainM3U8Content = await axiosInstance.get(mainM3U8Url + highestResolutionStream);
      const resolvedM3U8Content = resolveRelativePaths(mainM3U8Content.data, `${mainM3U8Url + highestResolutionStream.split('/')[0]}/`);

      const quality = await getResolutionFromM3u8(m3u8Content.data, false);

      const thumbnail = res.data.result?.tracks?.find((track: any) => track.kind === 'thumbnails');

      return {
        server: 'Vidstream',
        url: resolvedM3U8Content,
        type: 'm3u8',
        quality,
        thumbnails: thumbnail?.file,
        requiresProxy: false,
        referer: this.referer,
        origin: this.referer,
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
