import { Sources, Source } from 'types/sources';
import { ContentType } from 'types/tmbd';

export interface IExtractor {
  url: string;
  referer?: string;
  extractUrl?: (url: string) => Promise<Source | undefined>;
  extractUrls?: (imdbId: string, type: ContentType, season?: number, episode?: number) => Promise<Sources>;
}
