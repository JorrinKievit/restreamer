import { isAxiosError } from 'axios';
import { app } from 'electron';
import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';

export class StreamlareExtractor implements IExtractor {
  logger = log.scope('Streamlare');

  url: string = 'https://streamlare.com/';

  referer: string = 'https://sltube.org/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const id = url.split('/').pop();
      // Streamlare endpoint requires the same userAgent that is used in the API request
      const userAgent = app.userAgentFallback;

      const res = await axiosInstance.post(
        `${this.url}api/video/stream/get`,
        {
          id,
        },
        {
          headers: {
            'User-Agent': userAgent,
          },
        }
      );

      if (res.data.result?.Original?.file) {
        return {
          server: 'Streamlare',
          url: res.data.result.Original.file,
          type: res.data.type.includes('mp4') ? 'mp4' : 'm3u8',
          quality: 'Unknown',
          requiresProxy: false,
        };
      }
      return undefined;
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        this.logger.error(error.message);
      }
      return undefined;
    }
  }
}
