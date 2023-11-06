import { load } from 'cheerio';
import { ContentType } from 'types/tmbd';
import { Source, Subtitle } from 'types/sources';
import log from 'electron-log';
import fs from 'fs';
import { axiosInstance } from '../utils/axios';
import { IExtractor } from './types';

export class VidSrcExtractor implements IExtractor {
  logger = log.scope('VidSrc');

  url = 'https://vidsrc.me/';

  referer = 'https://vidsrc.stream/';

  origin = 'https://vidsrc.stream';

  private embedUrl = `${this.url}embed/`;

  private subtitleUrl = 'https://rest.opensubtitles.org/search/imdbid-';

  private getHashBasedOnIndex(hash: string, index: string) {
    let result = '';
    for (let i = 0; i < hash.length; i += 2) {
      const j = hash.substring(i, i + 2);
      result += String.fromCharCode(parseInt(j, 16) ^ index.charCodeAt((i / 2) % index.length));
    }
    return result;
  }

  async extractUrls(imdbId: string, type: ContentType, season?: number, episode?: number): Promise<Source[]> {
    try {
      const url = type === 'movie' ? `${this.embedUrl}movie?imdb=${imdbId}` : `${this.embedUrl}tv?imdb=${imdbId}&season=${season}&episode=${episode}`;
      const res = await axiosInstance.get(url);
      const $ = load(res.data);

      const activeSourceUrl = `https:${$('#player_iframe').attr('src')}`;
      const srcRcpRes = await axiosInstance.get(activeSourceUrl, {
        headers: {
          referer: url,
        },
      });
      const srcRcpRes$ = load(srcRcpRes.data);
      const id = srcRcpRes$('body').attr('data-i');
      const hash = srcRcpRes$('#hidden').attr('data-h');
      if (!id || !hash) throw new Error('No id or hash found');
      const sourceUrl = this.getHashBasedOnIndex(hash, id);
      const script = await axiosInstance.get(`https:${sourceUrl}`, {
        headers: {
          referer: url,
        },
      });
      const match = script.data
        .match(/file:"(.*?)"/)[1]
        .replace(/(\/\/\S+?=)/g, '')
        .replace('#2', '');
      const finalUrl = Buffer.from(match, 'base64').toString();
      this.logger.debug(finalUrl);

      if (!finalUrl.includes('list.m3u8')) throw new Error('Something went wrong during url decoding');

      const subtitleData = await axiosInstance.get(`${this.subtitleUrl}${imdbId}`, {
        headers: {
          'X-User-Agent': 'trailers.to-UA',
        },
      });

      const reducedSubtitles = subtitleData.data.reduce((accumulator: any, subtitle: any) => {
        const languageName = subtitle.LanguageName;
        accumulator[languageName] = accumulator[languageName] || [];
        if (accumulator[languageName].length < 5) {
          accumulator[languageName].push({
            file: subtitle.SubDownloadLink,
            label: subtitle.LanguageName,
            kind: 'captions',
          });
        }
        return accumulator;
      }, {});

      const finalSubtitles = Object.values(reducedSubtitles).flat() as Subtitle[];

      return [
        {
          server: 'VidSrc Pro',
          url: finalUrl,
          type: 'm3u8',
          quality: 'Unknown',
          subtitles: finalSubtitles,
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
