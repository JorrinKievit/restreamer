import { MovieDetailsResults } from './movie-details.types';
import { TvShowDetailsResults } from './tvshow-details.types';

type MovieDetailsResultWithMediaType = MovieDetailsResults & {
  media_type: 'movie';
};

type TvShowDetailsResultWithMediaType = TvShowDetailsResults & {
  media_type: 'tv';
};

export type MovieOrTvShowDetailsResult = MovieDetailsResultWithMediaType | TvShowDetailsResultWithMediaType;

export type MovieOrTvShowDetailsResults = MovieOrTvShowDetailsResult[];
