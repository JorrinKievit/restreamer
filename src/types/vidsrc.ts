export type VidSrcResponse = {
  url: string;
  server: string;
  origin?: string;
  referer?: string;
  type: 'm3u8' | 'mp4';
  extractorData?: string;
}[];
