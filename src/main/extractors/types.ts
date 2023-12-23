import { LogFunctions } from "electron-log";
import { LiveMainPage, Source } from "types/sources";
import { ContentType } from "types/tmbd";

export interface IExtractor {
  name?: string;
  logger: LogFunctions;
  url: string;
  referer?: string;
  extractUrl?: (
    url: string,
    serverName?: string,
  ) => Promise<Source | undefined>;
  extractUrls?: (
    imdbId: string,
    type: ContentType,
    season?: number,
    episode?: number,
  ) => Promise<Source[]>;
}

export interface ILiveExtractor {
  name?: string;
  logger: LogFunctions;
  mainPageUrl: string;
  referer?: string;
  getMainPage: () => Promise<LiveMainPage[]>;
  extractUrls: (url: string) => Promise<Source[]>;
}
