import { Source } from "types/sources";
import log from "electron-log";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { ContentType } from "types/tmbd";
import { load } from "cheerio";
import { StreamWishExtractor } from "./streamwish";

export class MultiMoviesExtractor implements IExtractor {
  name = "MultiMovies";

  logger = log.scope(this.name);

  url = "https://multinews.tech";

  private streamWishExtractor = new StreamWishExtractor();

  async extractUrls(
    showName: string,
    type: ContentType,
    season?: number,
    episode?: number,
  ): Promise<Source[]> {
    try {
      const searchResult = await axiosInstance.get(
        `${this.url}/wp-json/dooplay/search?keyword=${encodeURIComponent(
          showName,
        )}&nonce=6fffa73dee`,
      );
      const show = searchResult.data[Object.keys(searchResult.data)[0]];
      let showUrl = show.url;
      if (!show) throw new Error("No show found");
      if (type === "tv") {
        this.logger.debug(show.url);
        const slug = show.url.split("/tvshows/")[1].split("/")[0];
        showUrl = `${this.url}/episodes/${slug}-${season}x${episode}`;
      }

      const showPageResult = await axiosInstance.get(showUrl);
      const showPageResult$ = load(showPageResult.data);
      const iframeUrl = showPageResult$("#source-player-1")
        .children()
        .find("iframe")
        .attr("src");
      const sourceUrl = await this.streamWishExtractor.extractUrl(
        iframeUrl!,
        this.name,
      );
      if (!sourceUrl) throw new Error("No source found");
      return [sourceUrl];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
