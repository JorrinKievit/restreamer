const PROXY_URL = 'http://127.0.0.1:7687';
const REFERER_URL = 'https://vidsrc.stream/';
const FILE_EXTENSION = '.m3u8';

export const getProxyUrl = (m3u8Link: string) => {
  if (!m3u8Link) return;
  const hlxProxyUrl = `${PROXY_URL}/${Buffer.from(`${m3u8Link}|${REFERER_URL}`, 'binary').toString('base64')}${FILE_EXTENSION}`;

  return hlxProxyUrl;
};
