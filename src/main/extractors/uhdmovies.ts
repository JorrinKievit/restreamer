import { Source } from "types/sources";
import { ContentType } from "types/tmbd";
import log from "electron-log";
import { load } from "cheerio";
import FormData from "form-data";
import { axiosInstance } from "../utils/axios";
import { IExtractor } from "./types";

export class UHDMoviesExtractor implements IExtractor {
  public name = "UHDMovies";

  public url = "https://uhdmovies.zip";

  public logger = log.scope(this.name);

  private async extractOddFirmDriveLeechUrl(url: string) {
    const result = await axiosInstance.get(url);
    const result$ = load(result.data);
    const continuePage = await axiosInstance.post(
      result$("form").attr("action")!,
      new URLSearchParams({
        _wp_http: result$('input[name="_wp_http"]').attr("value")!,
      }),
    );
    const continuePage$ = load(continuePage.data);
    const goToDownloadPage = await axiosInstance.post(
      continuePage$("form").attr("action")!,
      new URLSearchParams({
        _wp_http2: continuePage$('input[name="_wp_http2"]').attr("value")!,
        token: continuePage$('input[name="token"]').attr("value")!,
      }),
    );
    const regex = /s_343\(([^,]+),\s*([^,]+)/g;
    let match;
    let redirectId;
    let token;

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(goToDownloadPage.data)) !== null) {
      redirectId = match[1].trim();
      token = match[2].trim();
    }
    const driveLeechUrl = await axiosInstance.get(
      `https://oddfirm.com/?go=${redirectId
        ?.replace("'", "")
        .replace("'", "")}`,
      {
        headers: {
          cookie: `${redirectId
            ?.replace("'", "")
            .replace("'", "")}=${token?.replace("'", "")};path=/`,
        },
      },
    );
    const driveLeechUrl$ = load(driveLeechUrl.data);
    const finalUrl = driveLeechUrl$("meta[http-equiv=refresh]").attr("content");
    return finalUrl;
  }

  private async extractDriveLeech(url: string) {
    const driveResult = await axiosInstance.get(url);
    const regex = /window\.location\.replace\("([^"]+)"\)/;
    const driveLeechPath = driveResult.data.match(regex)![1];
    const driveLeechResult = await axiosInstance.get(
      new URL(url).origin + driveLeechPath,
      {
        headers: {
          cookie: driveResult.headers["set-cookie"],
        },
      },
    );
    const driveLeechResult$ = load(driveLeechResult.data);
    const instantDownload = driveLeechResult$(
      'a:contains("Instant Download")',
    ).attr("href");
    if (!instantDownload) throw new Error("Instant download link not found");
    return instantDownload;
  }

  private async extractVideoCdn(url: string) {
    const formData = new FormData();
    formData.append("keys", url.split("url=")[1]);
    const apiData = await axiosInstance.post(
      `${new URL(url).origin}/api`,
      formData,
      {
        headers: {
          "x-token": new URL(url).hostname,
        },
      },
    );
    if (apiData.data.error) throw new Error(apiData.data.message);
    return apiData.data.url;
  }

  public async extractUrls(
    showName: string,
    type: ContentType,
    season?: number,
    episode?: number,
  ): Promise<Source[]> {
    try {
      const searchResult = await axiosInstance.get(
        `${this.url}?s=${encodeURIComponent(showName)}`,
      );
      const searchResult$ = load(searchResult.data);
      const detailLink = searchResult$(
        ".row.gridlove-posts .layout-masonry article:first-child .box-inner-p a",
      ).attr("href");
      if (!detailLink) throw new Error("Show page not found");
      const detailResult = await axiosInstance.get(detailLink);
      const detailResult$ = load(detailResult.data);

      let driveLink = detailResult$(
        `a[title="Download From Google Drive"]`,
      ).attr("href");
      if (type === "tv" && season && episode) {
        // TODO: Extract tv show
      }
      if (!driveLink) throw new Error("Drive link not found");
      if (
        driveLink.includes("oddfirm") ||
        driveLink.includes("unblockedgames")
      ) {
        const driveLeechUrl = await this.extractOddFirmDriveLeechUrl(driveLink);
        if (!driveLeechUrl)
          throw new Error("Drive leech link not found in oddfirm");
        driveLink = driveLeechUrl.split("url=")[1];
      }

      const videoCdnLink = await this.extractDriveLeech(driveLink);
      const finalUrl = await this.extractVideoCdn(videoCdnLink);

      return [
        {
          server: this.name,
          source: {
            url: finalUrl,
          },
          quality: "4K",
          type: "mkv",
          isVlc: true,
        },
      ];
    } catch (error) {
      if (error instanceof Error) this.logger.error(error.message);
      return [];
    }
  }
}
