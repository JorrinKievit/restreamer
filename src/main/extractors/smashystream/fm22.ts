import log from "electron-log";
import { Source } from "types/sources";
import { axiosInstance } from "../../utils/axios";
import { IExtractor } from "../types";
import { getResolutionFromM3u8 } from "../utils";

export class SmashyFm22Extractor implements IExtractor {
  name = "Smashy (FM22)";

  logger = log.scope(this.name);

  url = "https://embed.smashystream.com/fm22.php";

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });
      const config = JSON.parse(
        res.data
          .match(/new\s+Playerjs\((\{[^]*?\})\);/)[1]
          .replace("id", '"id"')
          .replace("file", '"file"')
          .replace("subtitle", '"subtitle"')
          .replace(/,([^,]*)$/, "$1"),
      );
      const fileUrl = config.file;

      const subtitleArray = config.subtitle
        .split(",")
        .map((entry: any) => {
          const nameRegex = /\[([^\]]*)\]/;
          const urlRegex = /https:\/\/s3\.bunnycdn\.ru\/[^\s,]+/g;
          const nameMatch = nameRegex.exec(entry);
          const urlMatch = urlRegex.exec(entry);
          const name =
            nameMatch && nameMatch[1].trim()
              ? nameMatch[1].trim()
              : urlMatch && urlMatch[1];
          const subtitleUrl = urlMatch && urlMatch[0].trim();
          return {
            file: subtitleUrl,
            label: name,
            kind: "captions",
          };
        })
        .filter((subtitle: any) => subtitle.file !== null);

      const quality = await getResolutionFromM3u8(fileUrl, true);
      return {
        server: this.name,
        source: {
          url: fileUrl,
        },
        type: fileUrl.includes(".m3u8") ? "m3u8" : "mp4",
        quality,
        subtitles: subtitleArray,
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
