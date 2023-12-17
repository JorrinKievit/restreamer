import { load } from "cheerio";
import log from "electron-log";
import { Source } from "types/sources";
import { axiosInstance } from "../../utils/axios";
import { IExtractor } from "../types";
import { getResolutionFromM3u8 } from "../utils";

export class SmashyDuedExtractor implements IExtractor {
  name = "Smashy (D)";

  logger = log.scope(this.name);

  url = "https://embed.smashystream.com/dued.php";

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const res$ = load(res.data);
      const iframeUrl = res$("iframe").attr("src");
      if (!iframeUrl) throw new Error("No iframe found");
      const mainUrl = new URL(iframeUrl);
      const iframeRes = await axiosInstance.get(iframeUrl!, {
        headers: {
          referer: url,
        },
      });
      const urlTextFile = `${mainUrl.origin}${
        iframeRes.data.match(/"file":"([^"]+)"/)[1]
      }`;
      const csrfToken = iframeRes.data.match(/"key":"([^"]+)"/)[1];
      const textRes = await axiosInstance.post(urlTextFile, null, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-TOKEN": csrfToken,
          Referer: iframeUrl,
        },
      });
      const textFilePlaylist = textRes.data.find(
        (item: any) => item.title === "English",
      ).file;
      const textFilePlaylistRes = await axiosInstance.post(
        `${mainUrl.origin}/playlist/${textFilePlaylist.slice(1)}.txt`,
        null,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRF-TOKEN": csrfToken,
            Referer: iframeUrl,
          },
        },
      );
      const quality = await getResolutionFromM3u8(
        textFilePlaylistRes.data,
        true,
      );
      return {
        server: this.name,
        source: {
          url: textFilePlaylistRes.data,
        },
        quality,
        type: "m3u8",
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
