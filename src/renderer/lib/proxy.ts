const M3U8_PROXY_URL = "http://127.0.0.1:7687";
const MP4_PROXY_URL = "http://127.0.0.1:7688/proxy";
const FILE_EXTENSION = ".m3u8";

export const getM3U8ProxyUrl = (m3u8Link: string, referer?: string) => {
  const hlsProxyUrl = `${M3U8_PROXY_URL}/${Buffer.from(
    `${m3u8Link}|${referer}`,
    "binary",
  ).toString("base64")}${FILE_EXTENSION}`;

  return hlsProxyUrl;
};

export const getMP4ProxyUrl = (mp4Link: string, referer?: string) => {
  let mp4ProxyUrl = `${MP4_PROXY_URL}/${encodeURIComponent(mp4Link)}`;
  if (referer) {
    mp4ProxyUrl += `?referer=${encodeURIComponent(referer)}`;
  }

  return mp4ProxyUrl;
};
