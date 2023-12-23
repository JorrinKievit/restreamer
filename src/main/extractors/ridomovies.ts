import { Source } from "types/sources";
import log from "electron-log";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { ContentType } from "types/tmbd";
import { load } from "cheerio";
import { CloseloadExtractor } from "./closeload";
import vm from "vm";
import { getResolutionFromM3u8, hasSubtitlesInM3u8 } from "./utils";

export class RidoMoviesExtractor implements IExtractor {
  name = "RidoMovies";

  logger = log.scope(this.name);

  url = "https://ridomovies.tv";

  referer = "https://ridomovies.tv/";

  private apiUrl = `${this.url}/core/api`;

  private closeLoadExtractor = new CloseloadExtractor();

  async extractUrls(
    showName: string,
    type: ContentType,
    season?: number,
    episode?: number,
  ): Promise<Source[]> {
    try {
      const searchResult = await axiosInstance.get(
        `${this.apiUrl}/search?q=${encodeURIComponent(showName)}`,
      );
      const show = searchResult.data.data.items[0];

      let iframeSourceUrl = `${this.apiUrl}/${show.fullSlug}/videos`;

      if (type === "tv") {
        const showPageResult = await axiosInstance.get(
          `${this.url}/${show.fullSlug}`,
        );
        const fullEpisodeSlug = `${show.fullSlug}/season-${season}/episode-${episode}`;
        const regexPattern = new RegExp(
          `\\\\"id\\\\":\\\\"(\\d+)\\\\"(?=.*?\\\\\\"fullSlug\\\\\\":\\\\\\"${fullEpisodeSlug}\\\\\\")`,
          "g",
        );
        const matches = [...showPageResult.data.matchAll(regexPattern)];
        const episodeIds = matches.map((match) => match[1]);
        if (!episodeIds.length) throw new Error("No episode ids found");
        const episodeId = episodeIds.at(-1);
        iframeSourceUrl = `${this.apiUrl}/episodes/${episodeId}/videos`;
      }

      const iframeSource = await axiosInstance.get(iframeSourceUrl);
      const iframeSource$ = load(iframeSource.data.data[0].url);
      const iframeUrl = iframeSource$("iframe").attr("data-src");
      if (!iframeUrl) throw new Error("No iframe found");

      if (iframeUrl.includes("closeload")) {
        const source = await this.closeLoadExtractor.extractUrl(iframeUrl);
        if (!source) throw new Error("No source found");
        return [source];
      }
      if (iframeUrl.includes("ridoo")) {
        const source = await this.extractUrl(iframeUrl);
        if (!source) throw new Error("No source found");
        return [source];
      }
      throw new Error("No extractor found");
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }

  async extractUrl(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        referer: this.referer,
      },
    });
    const $ = load(res.data);
    const evalCode = $("script")
      .filter((_, el) => {
        const script = $(el);
        return (script.attr("type") === "text/javascript" &&
          script.html()?.includes("eval"))!;
      })
      .html();

    const extractSource = async (file: string): Promise<Source> => {
      const quality = await getResolutionFromM3u8(file, true);
      const hasSubtitles = await hasSubtitlesInM3u8(file, true);

      return {
        server: "Ridoo",
        source: {
          url: file,
        },
        type: file.includes(".m3u8") ? "m3u8" : "mp4",
        quality,
        labels: {
          hasSubtitles,
        },
      };
    };

    const extractionPromise = new Promise<Source>((resolve, reject) => {
      const sandbox = {
        jwplayer: () => ({
          setup: async (config: any) => {
            if (config.sources && Array.isArray(config.sources)) {
              const firstSource = config.sources[0];
              if (firstSource && firstSource.file) {
                resolve(extractSource(firstSource.file));
              } else {
                reject(new Error("No file found"));
              }
            } else {
              reject(new Error("No sources found"));
            }
          },
          on: () => {},
          addButton: () => {},
          getButton: () => {},
          seek: () => {},
          getPosition: () => {},
          addEventListener: () => {},
          setCurrentCaptions: () => {},
          pause: () => {},
        }),
        $: () => ({
          hide: () => {},
          get: () => {},
          detach: () => ({
            insertAfter: () => {},
          }),
        }),
      };

      vm.createContext(sandbox);
      vm.runInContext(evalCode!, sandbox);
    });

    return await extractionPromise;
  }
}
