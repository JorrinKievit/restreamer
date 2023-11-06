export interface Subtitle {
  file: string;
  label: string;
  kind: string;
}

export interface Source {
  url: string;
  server: string;
  type: 'm3u8' | 'mp4' | 'mkv';
  quality: '4K' | '1440p' | '1080p' | '808p' | '720p' | '480p' | '360p' | '240p' | '144p' | '720p/1080p' | 'Unknown';
  extractorData?: {
    url: string;
    hash?: string;
  };
  proxySettings?: {
    type: 'mp4' | 'm3u8';
    referer?: string;
    origin?: string | null;
    userAgent?: string;
  };
  subtitles?: Subtitle[];
  thumbnails?: string;
  isVlc?: boolean;
}

export interface LiveMainPage {
  imgSrc: string;
  title: string;
  url: string;
}
