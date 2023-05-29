import { isAxiosError } from 'axios';
import { Source } from 'types/sources';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './IExtractor';

export class EmbedsitoExtractor implements IExtractor {
  url: string = 'https://embedsito.com/api/source/';

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.post(
        `https://embedsito.com/api/source/${url}`
      );

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
        url: finalUrl.headers.location!,
        type: fileType === 'mp4' ? 'mp4' : 'm3u8',
        quality,
        requiresProxy: false,
      };
    } catch (error) {
      if (isAxiosError(error) || error instanceof Error) {
        console.log('Embedsito: ', error.message);
      }
      return undefined;
    }
  }
}
