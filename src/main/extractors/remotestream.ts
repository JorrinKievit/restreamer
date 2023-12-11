import log from "electron-log";
import { Source } from "types/sources";
import { ContentType } from "types/tmbd";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { getResolutionFromM3u8 } from "./utils";

export class RemoteStreamExtractor implements IExtractor {
  name = "RemoteStream";

  logger = log.scope(this.name);

  url = "https://remotestream.cc/e/?";

  referer = "https://remotestream.cc/";

  private apiKey = "bRR3S48MbSnqjSaYNdCrBLfTIGQQNPRo";

  async extractUrls(
    imdbId: string,
    type: ContentType,
    season?: number | undefined,
    episode?: number | undefined,
  ): Promise<Source[]> {
    try {
      const url =
        type === "movie"
          ? `${this.url}imdb=${imdbId}&apikey=${this.apiKey}`
          : `${this.url}imdb=${imdbId}&s=${season}&e=${episode}&apikey=${this.apiKey}`;
      const res = await axiosInstance.get(url);

      const fileRegex = /"file":"(.*?)"/;
      const match = res.data.match(fileRegex);

      if (!match || !match[1]) throw new Error("No match found");

      this.logger.debug(match[1]);
      const quality = await getResolutionFromM3u8(match[1], true, {
        referer: this.referer,
      });

      return [
        {
          server: this.name,
          source: {
            url: match[1],
          },
          type: "m3u8",
          quality,
          proxySettings: {
            type: "m3u8",
            origin: this.referer,
            referer: this.referer,
            userAgent:
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          },
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
