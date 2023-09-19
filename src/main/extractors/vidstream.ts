import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';
import { getResolutionFromM3u8 } from './utils';

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

      const quality = await getResolutionFromM3u8(source, true);

      const thumbnail = res.data.result?.tracks?.find((track: any) => track.kind === 'thumbnails');

      return {
        server: 'Vidstream',
        url: source,
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
