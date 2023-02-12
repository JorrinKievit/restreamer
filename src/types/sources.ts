export interface Subtitle {
  file: string;
  label: string;
  kind: string;
}

export interface Source {
  url: string;
  server: string;
  type: 'm3u8' | 'mp4';
  requiresProxy: boolean;
  origin?: string;
  referer?: string;
  extractorData?: string;
  subtitles?: Subtitle[];
}

export type Sources = Source[];
