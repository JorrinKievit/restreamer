import { Source } from 'types/sources';
import log from 'electron-log';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';

export class EmbedsitoExtractor implements IExtractor {
  logger = log.scope('Embedsito');

  url: string = 'https://embedsito.com/api/source/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.post(`https://embedsito.com/api/source/${url}`);

      const file = res.data.data[res.data.data.length - 1];
      const redirectUrl = file.file;
      const quality = file.label;
      const fileType = file.type;

      const finalUrl = await axiosInstance.get(redirectUrl, {
        maxRedirects: 0,
        validateStatus: (status) => {
          return status >= 200 && status < 400;
        },
      });
      return {
        server: 'Embedsito',
        source: {
          url: finalUrl.headers.location!,
        },
        type: fileType === 'mp4' ? 'mp4' : 'm3u8',
        quality,
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
