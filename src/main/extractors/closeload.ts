import { Source, Subtitle } from "types/sources";
import log from "electron-log";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";
import { load } from "cheerio";
import { getResolutionFromM3u8 } from "./utils";
import vm from "vm";

export class CloseloadExtractor implements IExtractor {
  name = "Closeload";

  logger = log.scope(this.name);

  url = "https://closeload.top";

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const baseUrl = new URL(url).origin;
      const iframeRes = await axiosInstance.get(url, {
        headers: {
          Referer: "https://ridomovies.tv/",
        },
      });
      const iframeRes$ = load(iframeRes.data);
      const subtitles: Subtitle[] = iframeRes$("track")
        .map((_, el) => {
          const track = iframeRes$(el);
          return {
            file: `${baseUrl}${track.attr("src")}`,
            label: track.attr("label")!,
            kind: "subtitles",
          };
        })
        .get();

      const evalCode = iframeRes$("script")
        .filter((_, el) => {
          const script = iframeRes$(el);
          return (script.attr("type") === "text/javascript" &&
            script.html()?.includes("eval"))!;
        })
        .html();
      if (!evalCode) throw new Error("No eval code found");

      let sourceUrl = "";

      const sandbox = {
        $: () => ({
          ready: (callback: any) => callback(),
          text: () => {},
          on: () => {},
          attr: () => {},
          prepend: () => {},
        }),
        videojs: () => {
          const player = {
            src: () => {},
            ready: (readyCallback: any) => readyCallback(),
            hotkeys: (config: any) => {},
            one: () => {},
            on: () => {},
            getChild: () => ({
              addChild: () => {},
            }),
            textTracks: () => ({
              on: () => {},
            }),
          };
          return player;
        },
        atob: (input: string) => {
          sourceUrl = Buffer.from(input, "base64").toString("utf-8");
          return sourceUrl;
        },
        document: {
          ready: (callback: any) => callback(),
        },
        console,
        hotkeys: () => {},
      } as any;

      sandbox.videojs.Vhs = {
        GOAL_BUFFER_LENGTH: 0,
        MAX_GOAL_BUFFER_LENGTH: 0,
      };
      sandbox.videojs.getComponent = () => {};
      sandbox.videojs.registerComponent = () => {};
      sandbox.videojs.extend = () => {};
      sandbox.videojs.getChild = () => {};

      const context = vm.createContext(sandbox);
      vm.runInContext(evalCode, context);

      if (!sourceUrl) throw new Error("No source found");

      const quality = await getResolutionFromM3u8(sourceUrl, true, {
        Referer: this.url,
      });
      return {
        server: this.name,
        quality,
        type: "m3u8",
        source: {
          url: sourceUrl,
        },
        subtitles,
        proxySettings: {
          type: "m3u8",
          referer: this.url + "/",
          origin: this.url,
        },
      };
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return undefined;
    }
  }
}
