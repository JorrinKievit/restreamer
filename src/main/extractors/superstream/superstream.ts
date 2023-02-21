import axios from 'axios';
import crypto from 'crypto';
import { Source, Sources } from 'types/sources';
import { ContentType } from 'types/tmbd';
import { randomString } from '../utils';
import { DownloadResponse, SearchResponse, SubtitleResponse } from './types';

// This code is based on https://github.com/recloudstream/cloudstream-extensions/blob/master/SuperStream/src/main/kotlin/com/lagradost/SuperStream.kt
// Complies with the LGPL-3.0 License see: ./LICENSE and https://github.com/recloudstream/cloudstream-extensions/blob/master/LICENSE

export class SuperStreamExtractor {
  private static url: string = Buffer.from(
    'aHR0cHM6Ly9zaG93Ym94LnNoZWd1Lm5ldC9hcGkvYXBpX2NsaWVudC9pbmRleC8=',
    'base64'
  ).toString();

  private static secondUrl: string = Buffer.from(
    'aHR0cHM6Ly9tYnBhcGkuc2hlZ3UubmV0L2FwaS9hcGlfY2xpZW50L2luZGV4Lw==',
    'base64'
  ).toString();

  private static iv: string = Buffer.from('d0VpcGhUbiE=', 'base64').toString();

  private static key: string = Buffer.from(
    'MTIzZDZjZWRmNjI2ZHk1NDIzM2FhMXc2',
    'base64'
  ).toString();

  private static appKey: string = Buffer.from(
    'bW92aWVib3g=',
    'base64'
  ).toString();

  private static appid: string = Buffer.from(
    'Y29tLnRkby5zaG93Ym94',
    'base64'
  ).toString();

  private static secondAppid: string = Buffer.from(
    'Y29tLm1vdmllYm94cHJvLmFuZHJvaWQ=',
    'base64'
  ).toString();

  private static version: string = '14.7';

  private static versionCode: string = '160';

  private static baseData = {
    childmode: '0',
    app_version: this.version,
    appid: this.secondAppid,
    channel: 'Website',
    lang: 'en',
    platform: 'android',
  };

  private static baseHeaders = {
    platform: 'android',
    Accept: 'charset=utf-8',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  private static getExpireDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 12);
    return date.getTime();
  };

  private static md5 = (input: string) => {
    const hash = crypto.createHash('md5').update(input).digest();
    return hash.toString('hex').toLowerCase();
  };

  private static encryptQuery = (query: string) => {
    const cipher = crypto.createCipheriv('des-ede3-cbc', this.key, this.iv);
    cipher.setAutoPadding(true);
    const encrypted =
      cipher.update(query, 'utf-8', 'base64') + cipher.final('base64');

    return encrypted;
  };

  private static getVerify = (encryptedQuery: string) => {
    const md5Hash = crypto.createHash('md5');
    md5Hash.update(this.appKey);
    const hash1 = md5Hash.digest('hex');

    const hash2 = crypto.createHash('md5');
    hash2.update(hash1 + this.key + encryptedQuery);
    return hash2.digest('hex');
  };

  private static executeApiCall = async <T>(
    queryData: object,
    useSecondaryApi: boolean
  ): Promise<T> => {
    let apiUrl = this.url;
    if (useSecondaryApi) apiUrl = this.secondUrl;

    const encryptedQuery = this.encryptQuery(
      JSON.stringify({
        ...this.baseData,
        ...queryData,
      }).trim()
    );
    const appKeyHash = this.md5(this.appKey);

    const newBody = {
      app_key: appKeyHash,
      verify: this.getVerify(encryptedQuery),
      encrypt_data: encryptedQuery,
    };
    const base64Body = Buffer.from(JSON.stringify(newBody)).toString('base64');
    const data = {
      data: base64Body,
      appid: '27',
      version: this.versionCode,
      medium: `Website&token${randomString(32)}`,
    };

    const response = await axios.post(apiUrl, data, {
      headers: this.baseHeaders,
    });

    return response.data;
  };

  public static extractUrl = async (
    searchQuery: string,
    type: ContentType,
    season?: number,
    episode?: number
  ): Promise<Sources> => {
    try {
      const searchData = {
        ...this.baseData,
        appid: this.secondAppid,
        module: 'Search3',
        page: '1',
        keyword: searchQuery,
        pagelimit: '1',
        expired_date: this.getExpireDate(),
        type: 'all',
      };
      const searchDataResponse = await this.executeApiCall<SearchResponse>(
        searchData,
        false
      );
      const superStreamId = searchDataResponse.data[0].id;

      const linkData = {
        ...this.baseData,
        uid: '',
        app_version: '11.5',
        appid: this.appid,
        module: type === 'movie' ? 'Movie_downloadurl_v3' : 'TV_downloadurl_v3',
        ...(type === 'movie' ? { mid: superStreamId } : { tid: superStreamId }),
        ...(type === 'tv' && { season, episode }),
        expired_date: this.getExpireDate(),
        oss: '1',
        group: '1',
        type: 'all',
      };

      const linkDataResponse = await this.executeApiCall<DownloadResponse>(
        linkData,
        false
      );

      const link = linkDataResponse.data.list.find((item) => item.path !== '');

      if (!link) return [];

      const subtitleData = {
        ...this.baseData,
        uid: '',
        app_version: '11.5',
        appid: this.appid,
        module: type === 'movie' ? 'Movie_srt_list_v2' : 'TV_srt_list_v2',
        ...(type === 'movie' ? { mid: superStreamId } : { tid: superStreamId }),
        ...(type === 'tv' && { season, episode }),
        fid: link.fid,
        expired_date: this.getExpireDate(),
      };
      const subtitleDataResponse = await this.executeApiCall<SubtitleResponse>(
        subtitleData,
        false
      );

      return [
        {
          url: link.path,
          server: 'SuperStream',
          type: 'mp4',
          quality: link.quality as Source['quality'],
          requiresProxy: false,
          subtitles: subtitleDataResponse.data.list.flatMap((subtitleList) => {
            const subtitles = subtitleList.subtitles.slice(0, 3);
            return subtitles.map((superStreamSubtitle) => ({
              file: superStreamSubtitle.file_path,
              label: superStreamSubtitle.language,
              kind: 'captions',
            }));
          }),
        },
      ];
    } catch (e) {
      return Promise.resolve([]);
    }
  };
}
