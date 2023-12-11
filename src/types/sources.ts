export interface Subtitle {
  file: string;
  label: string;
  kind: string;
}

export interface Source {
  source: {
    url: string;
    requiresBlob?: boolean;
  };
  server: string;
  type: "m3u8" | "mp4" | "mkv";
  quality:
    | "4k"
    | "1440p"
    | "1080p"
    | "808p"
    | "720p"
    | "480p"
    | "360p"
    | "240p"
    | "144p"
    | "720p/1080p"
    | "Unknown";
  proxySettings?: {
    type: "mp4" | "m3u8";
    referer?: string;
    origin?: string | null;
    userAgent?: string;
  };
  subtitles?: Subtitle[];
  thumbnails?: {
    url: string;
    requiresBlob?: boolean;
  };
  isVlc?: boolean;
}

export interface LiveMainPage {
  imgSrc: string;
  title: string;
  url: string;
}
