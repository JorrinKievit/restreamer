export interface Uploader {
  uploader_id: number;
  name: string;
  rank: string;
}

export interface FeatureDetails {
  feature_id: number;
  feature_type: string;
  year: number;
  title: string;
  movie_name: string;
  imdb_id: number;
  tmdb_id: number;
}

export interface RelatedLink {
  label: string;
  url: string;
  img_url: string;
}

export interface File {
  file_id: number;
  cd_number: number;
  file_name: string;
}

export interface Attributes {
  subtitle_id: string;
  language: string;
  download_count: number;
  new_download_count: number;
  hearing_impaired: boolean;
  hd: boolean;
  fps: number;
  votes: number;
  points: number;
  ratings: number;
  from_trusted: boolean;
  foreign_parts_only: boolean;
  ai_translated: boolean;
  machine_translated: boolean;
  upload_date: Date;
  release: string;
  comments: string;
  legacy_subtitle_id: number;
  uploader: Uploader;
  feature_details: FeatureDetails;
  url: string;
  related_links: RelatedLink[];
  files: File[];
}

export interface Datum {
  id: string;
  type: string;
  attributes: Attributes;
}

export interface SearchResponse {
  total_pages: number;
  total_count: number;
  page: number;
  data: Datum[];
}
