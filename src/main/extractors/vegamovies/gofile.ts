import axios from 'axios';
import log from 'electron-log';
import { Source } from 'types/sources';
import { axiosInstance } from '../../utils/axios';
import { IExtractor } from '../types';
import { findResolutionBasedOnFileName } from '../utils';

export class GoFileExtractor implements IExtractor {
  name = 'GoFile';

  url = 'https://gofile.io';

  apiUrl = 'https://api.gofile.io';

  logger = log.scope(this.name);

  private async getGoFileWebsiteToken() {
    const res = await axiosInstance.get(`${this.url}/dist/js/alljs.js`);
    const regex = /fetchData.websiteToken\s*=\s*"([^']+)"/;
    const websiteToken = res.data.match(regex)[1];
    return websiteToken;
  }

  private async getGoFileAccountToken() {
    const res = await axios.get(`${this.apiUrl}/createAccount`);
    if (res.data.status === 'ok') {
      return res.data.data.token as string;
    }
  }

  public async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const linkData = await axiosInstance.get(url);
      const contentId = linkData.request.res.responseUrl.split('/d')[1];
      const websiteToken = await this.getGoFileWebsiteToken();
      const accountToken = await this.getGoFileAccountToken();

      const goFileDownloadLink = await axiosInstance.get(`${this.apiUrl}/getContent?contentId=${contentId}&token=${websiteToken}&websiteToken=${accountToken}`);
      if (goFileDownloadLink.data.status === 'ok') {
        return {
          server: 'VegaMovies',
          url: `${goFileDownloadLink.data.data.contents[goFileDownloadLink.data.data.childs[0]].link}?accountToken=${accountToken}`,
          type: 'mp4',
          proxyType: 'mp4',
          quality: findResolutionBasedOnFileName(goFileDownloadLink.data.data.contents[goFileDownloadLink.data.data.childs[0]].name),
          isVlc: true,
        };
      }
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
