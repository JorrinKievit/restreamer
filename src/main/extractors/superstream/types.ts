export interface TrailerUrlArr {
  url: string;
  img: string;
}

export interface SearchDataResponse {
  id: number;
  box_type: number;
  title: string;
  actors: string;
  description: string;
  poster_min: string;
  poster_org: string;
  poster: string;
  banner_mini: string;
  cats: string;
  content_rating: number;
  runtime: number;
  year: number;
  collect: number;
  view: number;
  download: number;
  imdb_rating: string;
  is_collect: number;
  '3d': number;
  audio_lang: string;
  quality_tag: string;
  lang: string;
  trailer_url_arr: TrailerUrlArr[];
  trailer_url: string;
}

export interface SearchResponse {
  code: number;
  msg: string;
  data: SearchDataResponse[];
}

export interface List {
  path: string;
  quality: string;
  real_quality: string;
  format: string;
  size: string;
  size_bytes: any;
  count: number;
  dateline: number;
  fid: number;
  mmfid: number;
  h265: number;
  hdr: number;
  filename: string;
  original: number;
  colorbit: number;
  success: number;
  timeout: number;
  vip_link: number;
  fps: number;
  bitstream: string;
  width: number;
  height: number;
}

export interface Names {
  de: string;
  en: string;
  es: string;
  fr: string;
  ja: string;
  'pt-BR': string;
  ru: string;
  'zh-CN': string;
}

export interface Continent {
  code: string;
  geoname_id: number;
  names: Names;
}

export interface Names2 {
  de: string;
  en: string;
  es: string;
  fr: string;
  ja: string;
  'pt-BR': string;
  ru: string;
  'zh-CN': string;
}

export interface Country {
  geoname_id: number;
  is_in_european_union: boolean;
  iso_code: string;
  names: Names2;
}

export interface Names3 {
  de: string;
  en: string;
  es: string;
  fr: string;
  ja: string;
  'pt-BR': string;
  ru: string;
  'zh-CN': string;
}

export interface RegisteredCountry {
  geoname_id: number;
  is_in_european_union: boolean;
  iso_code: string;
  names: Names3;
}

export interface IpInfo {
  continent: Continent;
  country: Country;
  registered_country: RegisteredCountry;
}

export interface DownloadDataResponse {
  seconds: number;
  quality: string[];
  list: List[];
  ip: string;
  ip_info: IpInfo;
}

export interface DownloadResponse {
  code: number;
  msg: string;
  data: DownloadDataResponse;
}

export interface SuperStreamSubtitle {
  sid: number;
  mid: number;
  file_path: string;
  lang: string;
  language: string;
  delay: number;
  point: any;
  order: number;
  admin_order: number;
  myselect: number;
  add_time: number;
  count: number;
}

export interface SubtitleList {
  language: string;
  subtitles: SuperStreamSubtitle[];
}

export interface SubtitleData {
  select: any[];
  list: SubtitleList[];
}

export interface SubtitleResponse {
  code: number;
  msg: string;
  data: SubtitleData;
}
