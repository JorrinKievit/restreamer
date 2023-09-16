import { LogFunctions } from 'electron-log';
import { LiveSource, LiveSourceUrl, Source } from 'types/sources';
import { ContentType } from 'types/tmbd';

export interface IExtractor {
  name?: string;
  logger: LogFunctions;
  url: string;
  referer?: string;
  extractUrl?: (url: string) => Promise<Source | undefined>;
  extractUrls?: (imdbId: string, type: ContentType, season?: number, episode?: number) => Promise<Source[]>;
}

export interface ILiveExtractor {
  name?: string;
  logger: LogFunctions;
  mainPageUrl: string;
  referer?: string;
  getMainPage: () => Promise<LiveSource[]>;
  extractUrl: (url: string) => Promise<LiveSourceUrl>;
}
