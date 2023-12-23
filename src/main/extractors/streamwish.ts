import { Source } from "types/sources";
import log from "electron-log";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { getResolutionFromM3u8 } from "./utils";

export class StreamWishExtractor implements IExtractor {
  name = "StreamWish";

  logger = log.scope(this.name);

  url: string = "https://streamwish.com";

  async extractUrl(
    url: string,
    serverName?: string,
  ): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url);
      const regex = /sources: \[\s*{[^}]*file:\s*"([^"]+)"/;
      const file = regex.exec(res.data)?.[1];
      if (!file) throw new Error("No file found");
      return {
        server: serverName ?? this.name,
        source: {
          url: file,
        },
        quality: await getResolutionFromM3u8(file, true),
        type: file.includes(".m3u8") ? "m3u8" : "mp4",
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
