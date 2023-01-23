/* eslint-disable no-undef */
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MovieDetails as MovieDetailsResults } from './details.types';
import { SearchResults } from './search.types';
import { TvShowDetailsResults } from './tvshow-details.types';

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMBD_API_ENDPOINT = 'https://api.themoviedb.org/3';

export const usePopularMovies = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () =>
      axios
        .get(`${TMBD_API_ENDPOINT}/movie/popular?api_key=${TMDB_API_KEY}`)
        .then((res) => res.data),
  });

  return { data, error, isLoading };
};

export const useMovieDetails = (movieId: string | undefined) => {
  const { data, error, isLoading } = useQuery<MovieDetailsResults>({
    queryKey: ['movie', movieId],
    queryFn: () =>
      axios
        .get(`${TMBD_API_ENDPOINT}/movie/${movieId}?api_key=${TMDB_API_KEY}`)
        .then((res) => res.data),
    enabled: !!movieId,
  });

  return { data, error, isLoading };
};

export const useSearchMoviesAndShows = (query: string | undefined) => {
  const { data, error, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', query],
    queryFn: () =>
      axios
        .get(
          `${TMBD_API_ENDPOINT}/search/multi?api_key=${TMDB_API_KEY}&query=${query}`
        )
        .then((res) => res.data),
    enabled: !!query,
  });

  return { data, error, isLoading };
};

export const useTvShowDetails = (tvShowId: string | undefined) => {
  const { data, error, isLoading } = useQuery<TvShowDetailsResults>({
    queryKey: ['tv-show', tvShowId],
    queryFn: () =>
      axios
        .get(`${TMBD_API_ENDPOINT}/tv/${tvShowId}?api_key=${TMDB_API_KEY}`)
        .then((res) => res.data),
    enabled: !!tvShowId,
  });

  return { data, error, isLoading };
};
