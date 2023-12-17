import log from "electron-log";
import { Source } from "types/sources";
import { ContentType } from "types/tmbd";
import crypto from "crypto";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { getResolution, getResolutionFromM3u8 } from "./utils";

export class BlackvidExtractor implements IExtractor {
  name = "Blackvid";

  logger = log.scope(this.name);

  url = "https://prod.api.blackvid.space/v3";

  private apiKey = "b6055c533c19131a638c3d2299d525d5ec08a814";

  private decryptionKey = "2378f8e4e844f2dc839ab48f66e00acc2305a401";

  private getCurrentUTCDateString() {
    const dateFormat = new Date().toUTCString();
    return dateFormat;
  }

  private generateKeyAndIv() {
    const datePart = this.getCurrentUTCDateString().slice(0, 16);
    const hexString = datePart + this.decryptionKey;
    const byteArray = Buffer.from(hexString, "utf8");
    const digest = crypto.createHash("sha256").update(byteArray).digest();
    const key = digest.slice(0, digest.length / 2);
    const iv = digest.slice(-(digest.length / 2));
    return { key, iv };
  }

  private decrypt(byteArray: string) {
    const { key, iv } = this.generateKeyAndIv();
    const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
    let decrypted = cipher.update(byteArray);
    decrypted = Buffer.concat([decrypted, cipher.final()]);
    return decrypted.slice(0, -16).toString("utf8");
  }

  async extractUrls(
    tmdbId: string,
    type: ContentType,
    season?: number | undefined,
    episode?: number | undefined,
  ): Promise<Source[]> {
    try {
      const url =
        type === "movie"
          ? `${this.url}/movie/sources/${tmdbId}?key=${this.apiKey}`
          : `${this.url}/tv/sources/${tmdbId}/${season}/${episode}?key=${this.apiKey}`;
      const { data } = await axiosInstance.get(url, {
        responseType: "arraybuffer",
      });
      const decrypted = JSON.parse(this.decrypt(data));

      const subtitles: Source["subtitles"] = decrypted.subtitles.map(
        (s: any) => ({
          file: s.url,
          label: s.language,
          kind: "captions",
        }),
      );

      const sources: Source[] = decrypted.sources.map(
        async (s: any, index: number) => {
          const highestQualitySource = s.sources[0];
          // Same url as SuperStream or ShowbBox
          if (
            highestQualitySource.url.includes("shegu") ||
            highestQualitySource.url.includes("febbox")
          )
            return null;
          const quality =
            highestQualitySource?.quality !== "auto"
              ? getResolution(highestQualitySource.quality)
              : await getResolutionFromM3u8(highestQualitySource.url, true);

          return {
            server: `${this.name} ${index}`,
            quality,
            type: highestQualitySource.url.includes(".m3u8") ? "m3u8" : "mp4",
            source: {
              url: highestQualitySource.url,
            },
            subtitles,
          };
        },
      );

      const filteredSources = (await Promise.all(sources)).filter(
        (source) => source !== null,
      );
      return filteredSources;
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
