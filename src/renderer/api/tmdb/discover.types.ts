export interface MovieResults {
  backdrop_path: string;
  first_air_date: string;
  genre_ids: number[];
  id: number;
  media_type: string;
  name: string;
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  adult?: boolean;
  original_title: string;
  release_date: string;
  title: string;
  video?: boolean;
}

export interface DiscoverMovieResults {
  page: number;
  results: MovieResults[];
  total_pages: number;
  total_results: number;
}

export interface TvShowResults {
  poster_path: string;
  popularity: number;
  id: number;
  backdrop_path: string;
  vote_average: number;
  overview: string;
  first_air_date: string;
  origin_country: string[];
  genre_ids: number[];
  original_language: string;
  vote_count: number;
  name: string;
  original_name: string;
}

export interface DiscoverTvShowsResults {
  page: number;
  results: MovieResults[];
  total_pages: number;
  total_results: number;
}
