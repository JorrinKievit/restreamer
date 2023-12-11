import { load } from "cheerio";
import log from "electron-log";
import { LiveMainPage, Source } from "types/sources";
import vm, { runInContext } from "vm";
import { axiosInstance } from "../../utils/axios";
import { ILiveExtractor } from "../types";
import { getResolutionFromM3u8 } from "../utils";

export class CricFoot2Extractor implements ILiveExtractor {
  name = "CricFoot2";

  logger = log.scope(this.name);

  mainPageUrl = "https://cricfoot2.com/";

  referer = "https://paktech2.com/";

  async getMainPage(): Promise<LiveMainPage[]> {
    const res = await axiosInstance.get(`${this.mainPageUrl}/sports_tv.php`);
    const $ = load(res.data);

    const items = $(".content_area .col-md-3")
      .map((i, el) => {
        const $1 = load(el);
        const title = $1(".b_box").text();
        const imgSrc = $1("img").attr("src")!;
        const url = $1("a").attr("href")!;
        return {
          title,
          imgSrc,
          url,
        };
      })
      .get();

    return items;
  }

  async extractUrls(url: string): Promise<Source[]> {
    try {
      this.logger.debug(`extracting url: ${url}`);
      const res = await axiosInstance.get(url);
      const $ = load(res.data);
      const link = $("a:contains('Go Watch Links')").attr("href");
      if (!link) throw new Error("No link found");
      const watchLinksPage = await axiosInstance.get(link);
      const watchLInksPage$ = load(watchLinksPage.data);
      const streamLinks = watchLInksPage$("a:contains('Stream')")
        .map((i, el) => watchLInksPage$(el).attr("href"))
        .get();
      this.logger.debug(`streamLinks: ${streamLinks}`);
      const streamLinkPromises = streamLinks.map(async (streamLink) => {
        const streamPage = await axiosInstance.get(streamLink);
        const streamPage$ = load(streamPage.data);
        return streamPage$("iframe").attr("src");
      });
      const streamPageLinks = [
        ...new Set(
          (await Promise.all(streamLinkPromises)).filter(
            (l): l is string => l !== undefined,
          ),
        ),
      ];
      this.logger.debug(`streamPageLinks: ${streamPageLinks}`);
      const streamPageLinkPromises = streamPageLinks.map(
        async (streamPageLink) => {
          if (streamPageLink.includes("tvpclive.com")) {
            return this.extractTVpLiveUrl(streamPageLink);
          }
          if (streamPageLink.includes("crichd.vip")) {
            return this.extractCrichdUrl(streamPageLink);
          }
          if (streamPageLink.includes("dlhd.sx")) {
            return this.extractDlhd(streamPageLink);
          }
          if (streamPageLink.includes("daddylivehd.online")) {
            return this.extractDaddyLiveHD(streamPageLink);
          }
          if (streamPageLink.includes("1stream.buzz")) {
            return this.extract1StreamBuzz(streamPageLink);
          }
        },
      );
      const streamPageLinkResults = (
        await Promise.all(streamPageLinkPromises)
      ).filter((l): l is Source => l !== undefined);
      this.logger.debug(streamPageLinkResults);

      return streamPageLinkResults;
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return [];
    }
  }

  private extractTVpLiveUrl = async (
    url: string,
  ): Promise<Source | undefined> => {
    const res = await axiosInstance.get(url);
    const $ = load(res.data);
    const iframeUrl = $("iframe").attr("src");

    if (!iframeUrl) throw new Error("No iframe url found");
    const iframeRes = await axiosInstance.get(iframeUrl, {
      headers: {
        Referer: url,
      },
    });
    const regex = /source:'(.*?)'/g;
    const matches = [...iframeRes.data.matchAll(regex)];
    const finalLiveUrl = matches.map((match) => match[1])[1];

    const quality = await getResolutionFromM3u8(finalLiveUrl, true);

    return {
      server: "TVPLive",
      source: {
        url: finalLiveUrl,
      },
      quality,
      type: "m3u8",
      proxySettings: {
        type: "m3u8",
        referer: "https://ddolahdplay.xyz/",
      },
    };
  };

  private async extractCrichdUrl(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url);
    const regex = /fid="([^"]+)"/;
    const fid = res.data.match(regex)[1];
    const res2 = await axiosInstance.get(
      `https://lovesomecommunity.com/crichdisi.php?player=desktop&live=${fid}`,
      {
        headers: {
          Referer: "https://stream.crichd.vip/",
        },
      },
    );
    const finalUrlRegex = /return\s*\(\s*\[([^\]]*)\]/;
    const finalUrl = JSON.parse(`[${res2.data.match(finalUrlRegex)[1]}]`)
      .join("")
      .replace("////", "//");

    const quality = await getResolutionFromM3u8(finalUrl, true);

    return {
      server: "Crichd",
      source: {
        url: finalUrl,
      },
      quality,
      type: "m3u8",
      proxySettings: {
        type: "m3u8",
        referer: "https://lovesomecommunity.com/",
      },
    };
  }

  private async extractDlhd(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: this.referer,
      },
    });
    const $ = load(res.data);
    const iframeUrl = $("iframe").attr("src");
    this.logger.debug(iframeUrl);
    if (!iframeUrl) throw new Error("No iframe url found");
    const iframeRes = await axiosInstance.get(iframeUrl, {
      headers: {
        Referer: "https://dlhd.sx/",
      },
    });
    const source = this.getNonCommentedSource(iframeRes.data);
    this.logger.debug(source);
    if (!source) throw new Error("No source url found");

    const m3u8File = await axiosInstance.get(source, {
      headers: {
        Referer: "https://weblivehdplay.ru/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0",
      },
    });
    this.logger.debug(m3u8File.data);
    if (m3u8File.data.includes("Unable to find the specified"))
      throw new Error("Unable to find the specified");
    const quality = await getResolutionFromM3u8(m3u8File.data, false);

    return {
      server: "Dlhd",
      source: {
        url: m3u8File.request.res.responseUrl,
      },
      quality,
      type: "m3u8",
      proxySettings: {
        type: "m3u8",
        origin: "https://weblivehdplay.ru",
        referer: "https://weblivehdplay.ru/",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      },
    };
  }

  private async extractOlaliveHdPlay(url: string) {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: "https://daddylivehd.com/",
      },
    });
    const source = this.getNonCommentedSource(res.data);
    if (!source) throw new Error("No source url found");
    return source;
  }

  private async extractDaddyLiveHD(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: "https://daddylivehd.com/",
      },
    });
    const $ = load(res.data);
    const iframeUrl = $("iframe").attr("src");
    if (!iframeUrl) throw new Error("No iframe url found");
    const source = await this.extractOlaliveHdPlay(iframeUrl);
    const quality = await getResolutionFromM3u8(source, true);

    return {
      server: "DaddyLiveHD",
      source: {
        url: source,
      },
      quality,
      type: "m3u8",
      proxySettings: {
        type: "m3u8",
        referer: "https://livehdplay.ru/",
      },
    };
  }

  private async extract1StreamBuzz(url: string): Promise<Source | undefined> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: this.mainPageUrl,
      },
    });
    const $ = load(res.data);
    const iframeUrl = $("iframe").attr("src");
    if (!iframeUrl) throw new Error("No iframe url found");
    const source = await this.extractAbolishStand(iframeUrl);
    const quality = await getResolutionFromM3u8(source, true);
    return {
      server: "1StreamBuzz",
      source: {
        url: source,
      },
      quality,
      type: "m3u8",
      proxySettings: {
        type: "m3u8",
        referer: "https://abolishstand.net/",
      },
    };
  }

  private async extractAbolishStand(url: string): Promise<string> {
    const res = await axiosInstance.get(url, {
      headers: {
        Referer: "https://1stream.buzz/",
      },
    });
    const $ = load(res.data);
    const script = $("script")
      .filter((_, el) => $(el).html()?.includes("eval") ?? false)
      .first()
      .html();

    this.logger.debug(script);
    if (!script) throw new Error("No script found");
    const sandbox = {
      src: "",
      $: () => {
        return {
          ready: () => {},
        };
      },
      document: {},
    };
    runInContext(script, vm.createContext(sandbox));

    return sandbox.src;
  }

  private getNonCommentedSource(data: string): string {
    const regex = /\/\/.*?(?=\n|$)|source\s*:\s*'([^']+)'/g;
    const matches = data.match(regex);
    const nonCommentedSources = matches?.filter(
      (match: string) => !match.startsWith("//"),
    );
    const firstNonCommentedSource = nonCommentedSources?.[0].match(
      /source\s*:\s*'([^']+)'/,
    )?.[1];
    if (!firstNonCommentedSource) throw new Error("No source url found");
    return firstNonCommentedSource;
  }
}
