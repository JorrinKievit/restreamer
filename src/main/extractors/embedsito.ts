import axios from 'axios';
import { Source } from 'types/sources';
import { IExtractor } from './IExtractor';

export class EmbedsitoExtractor implements IExtractor {
  url: string = 'https://embedsito.com/api/source/';

  extractUrl = async (url: string): Promise<Source | undefined> => {
    const res = await axios.post(`https://embedsito.com/api/source/${url}`);

    const file = res.data.data[res.data.data.length - 1];
    const redirectUrl = file.file;
    const quality = file.label;
    const fileType = file.type;

    const finalUrl = await axios.get(redirectUrl, {
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
  };
}
