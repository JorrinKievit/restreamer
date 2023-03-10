import axios from 'axios';
import { app } from 'electron';
import { Source } from 'types/sources';

export class StreamlareExtractor {
  private static url: string = 'https://streamlare.com/';

  private static referer: string = 'https://sltube.org/';

  public static extractUrl = async (
    url: string
  ): Promise<Source | undefined> => {
    try {
      const id = url.split('/').pop();
      // Streamlare endpoint requires the same userAgent that is used in the API request
      const userAgent = app.userAgentFallback;

      const res = await axios.post(
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
          type: 'mp4',
          quality: '720p/1080p',
          requiresProxy: false,
        };
      }
      return undefined;
    } catch (error) {
      return Promise.resolve(undefined);
    }
  };
}
