import { LogFunctions } from 'electron-log';
import { Source } from 'types/sources';
import { ContentType } from 'types/tmbd';

export interface IExtractor {
  name?: string;
  logger: LogFunctions;
  url: string;
  referer?: string;
  extractUrl?: (url: string) => Promise<Source | undefined>;
  extractUrls?: (imdbId: string, type: ContentType, season?: number, episode?: number) => Promise<Source[]>;
}
