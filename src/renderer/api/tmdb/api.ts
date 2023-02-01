/* eslint-disable no-undef */
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { FilterOptions } from 'renderer/components/ShowFilter';
import { PlayingData } from 'types/localstorage';
import { MovieDetailsResults } from './movie-details.types';
import { DiscoverMovieResults, DiscoverTvShowsResults } from './discover.types';
import { SearchResponse } from './search.types';
import { TvShowDetailsResults } from './tvshow-details.types';
import { MovieOrTvShowDetailsResults } from './details.types';

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
  const { data, error, isLoading } = useQuery<SearchResponse>({
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

export const useDiscoverTMDB = <T extends FilterOptions['type']>(
  options: Omit<FilterOptions, 'type'>,
  type: T
) => {
  const { data, error, isLoading } = useQuery<
    T extends 'movie' ? DiscoverMovieResults : DiscoverTvShowsResults
  >({
    queryKey: ['discover', options, type],
    queryFn: () =>
      axios
        .get(`${TMBD_API_ENDPOINT}/discover/${type}?api_key=${TMDB_API_KEY}`, {
          params: {
            with_genres:
              options.genres.length > 0 ? options.genres.join(',') : undefined,
            primary_release_year: options.year,
            sort_by: options.sortBy,
          },
        })
        .then((res) => res.data),
  });

  return { data, error, isLoading };
};

export const useGetShowsById = (playingData: PlayingData) => {
  const { data, error, isLoading, isInitialLoading } =
    useQuery<MovieOrTvShowDetailsResults>({
      queryKey: ['get-shows-by-id', playingData],
      enabled: playingData !== null,
      queryFn: async () => {
        const playingDataWithTypes = Object.entries(playingData).map(
          ([key, value]) => {
            return {
              id: key,
              showType: value.season ? ('tv' as const) : ('movie' as const),
            };
          }
        );
        const promises = playingDataWithTypes.map(async (show) => {
          const res = (await axios.get(
            `${TMBD_API_ENDPOINT}/${show.showType}/${show.id}?api_key=${TMDB_API_KEY}`
          )) as AxiosResponse<MovieDetailsResults | TvShowDetailsResults>;

          return {
            ...res.data,
            media_type: show.showType,
          };
        });

        return Promise.all(promises) as Promise<MovieOrTvShowDetailsResults>;
      },
    });
  return { data, error, isLoading, isInitialLoading };
};
