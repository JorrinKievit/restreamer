export interface Subtitle {
  file: string;
  label: string;
  kind: string;
}

export interface Source {
  url: string;
  server: string;
  type: 'm3u8' | 'mp4';
  quality: '4K' | '1440p' | '1080p' | '808p' | '720p' | '480p' | '360p' | '240p' | '144p' | '720p/1080p' | 'Unknown';
  proxyType: 'mp4' | 'm3u8' | 'none';
  origin?: string;
  referer?: string;
  extractorData?: {
    url: string;
    hash?: string;
  };
  subtitles?: Subtitle[];
  thumbnails?: string;
  isVlc?: boolean;
}

export interface LiveSource {
  title: string;
  imgSrc: string;
  url: string;
}

export interface LiveSourceUrl {
  name: string;
  url: string;
  requiresProxy: boolean;
  referer?: string;
}

export interface LiveMainPage {
  imgSrc: string;
  title: string;
  url: string;
}
