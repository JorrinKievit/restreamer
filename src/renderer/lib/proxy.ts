const PROXY_URL = 'http://127.0.0.1:7687';
const FILE_EXTENSION = '.m3u8';

export const getProxyUrl = (m3u8Link: string, referer?: string) => {
  const hlxProxyUrl = `${PROXY_URL}/${Buffer.from(`${m3u8Link}|${referer}`, 'binary').toString('base64')}${FILE_EXTENSION}`;

  return hlxProxyUrl;
};
