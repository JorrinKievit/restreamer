import { load } from "cheerio";
import log from "electron-log";
import { ContentType } from "types/tmbd";
import crypto from "crypto";
import { Source } from "types/sources";
import vm from "vm";
import { IExtractor } from "./types";
import { getResolutionFromM3u8 } from "./utils";
import { axiosInstance } from "../utils/axios";
import { CryptoJSAesJson } from "../utils/crypto";

export class MoviesApiExtractor implements IExtractor {
  name = "MoviesApi";

  logger = log.scope(this.name);

  url = "https://moviesapi.club/";

  referer = "https://w1.moviesapi.club/";

  private getKey(stringData: string) {
    const sandbox = {
      JScripts: "",
      CryptoJSAesJson: {
        decrypt: (data: string, key: string) => {
          return JSON.stringify(key);
        },
      },
    };
    vm.createContext(sandbox);
    const key = vm.runInContext(stringData, sandbox);
    return key;
  }

  async extractUrls(
    tmdbId: string,
    type: ContentType,
    season?: number,
    episode?: number,
  ): Promise<Source[]> {
    try {
      const url =
        type === "movie"
          ? `${this.url}movie/${tmdbId}`
          : `${this.url}tv/${tmdbId}-${season}-${episode}`;

      const res = await axiosInstance.get(url, {
        headers: {
          referer: this.referer,
        },
      });
      const res$ = load(res.data);
      const iframeUrl = res$("iframe").attr("src");
      this.logger.debug(iframeUrl);

      if (!iframeUrl) throw new Error("No iframe url found");

      const res2 = await axiosInstance.get(iframeUrl, {
        headers: {
          referer: this.referer,
        },
      });
      const res2$ = load(res2.data);
      const stringData = res2$("body script").eq(2).html();
      if (!stringData) throw new Error("No script found");
      const key = this.getKey(stringData);
      this.logger.debug(key);

      const regex = /JScripts\s*=\s*'([^']*)'/;
      const base64EncryptedData = regex.exec(res2.data)![1];

      const decryptedString = CryptoJSAesJson.decrypt(base64EncryptedData, key);

      const sources = JSON.parse(
        decryptedString.match(/sources: ([^\]]*\])/)![1],
      );
      const tracks = JSON.parse(
        decryptedString.match(/tracks: ([^]*?\}\])/)![1],
      );

      const subtitles = tracks.filter((it: any) => it.kind === "captions");
      const thumbnails = tracks.filter((it: any) => it.kind === "thumbnails");

      const highestQuality = await getResolutionFromM3u8(sources[0].file, true);

      return [
        {
          server: this.name,
          source: {
            url: sources[0].file,
          },
          type: sources[0].type === "hls" ? "m3u8" : "mp4",
          quality: highestQuality,
          subtitles: subtitles.map((it: any) => ({
            file: it.file,
            label: it.label,
            kind: it.kind,
          })),
          thumbnails: {
            url: thumbnails[0]?.file,
          },
          proxySettings: {
            type: "m3u8",
            referer: this.referer,
          },
        },
      ];
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }
}
