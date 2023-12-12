import log from "electron-log";
import { Source } from "types/sources";
import crypto from "crypto";
import { axiosInstance } from "../../utils/axios";
import { IExtractor } from "../types";

export class SmashyWatchXExtractor implements IExtractor {
  name = "Smashy (WX)";

  logger = log.scope(this.name);

  url = "https://embed.smashystream.com/watchx.php";

  // Stolen from https://github.com/hexated/cloudstream-extensions-hexated/blob/cb11c787df613d58bf20e259d933530879670137/Ngefilm/src/main/kotlin/com/hexated/Extractors.kt#L53C30-L53C46
  // Tried to deobfuscate https://bestx.stream/assets/js/master_v5.js and https://bestx.stream/assets/js/crypto-js.js but i gave up
  private KEY = "4VqE3#N7zt&HEP^a";

  async extractUrl(url: string): Promise<Source | undefined> {
    try {
      const res = await axiosInstance.get(url, {
        headers: {
          referer: url,
        },
      });

      const regex = /MasterJS\s*=\s*'([^']*)'/;
      const base64EncryptedData = regex.exec(res.data)![1];
      const base64DecryptedData = JSON.parse(
        Buffer.from(base64EncryptedData, "base64").toString("utf8"),
      );

      const derivedKey = crypto.pbkdf2Sync(
        this.KEY,
        Buffer.from(base64DecryptedData.salt, "hex"),
        base64DecryptedData.iterations,
        32,
        "sha512",
      );
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        derivedKey,
        Buffer.from(base64DecryptedData.iv, "hex"),
      );
      decipher.setEncoding("utf8");

      let decrypted = decipher.update(
        base64DecryptedData.ciphertext,
        "base64",
        "utf8",
      );
      decrypted += decipher.final("utf8");

      const sources = JSON.parse(decrypted.match(/sources: ([^\]]*\])/)![1]);
      const tracks = JSON.parse(decrypted.match(/tracks: ([^]*?\}\])/)![1]);

      const subtitles = tracks.filter((it: any) => it.kind === "captions");
      const thumbnails = tracks.filter((it: any) => it.kind === "thumbnails");

      return {
        server: this.name,
        source: {
          url: sources[0].file,
        },
        type: sources[0].type === "hls" ? "m3u8" : "mp4",
        quality: sources[0].label,
        subtitles: subtitles.map((it: any) => ({
          file: it.file,
          label: it.label,
          kind: it.kind,
        })),
        thumbnails: {
          url: thumbnails[0]?.file,
        },
      };
    } catch (err) {
      if (err instanceof Error) this.logger.error(err.message);
      return undefined;
    }
  }
}
