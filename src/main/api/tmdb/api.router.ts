/* eslint-disable no-undef */
import axios, { AxiosResponse } from 'axios';
import z from 'zod';
import { MovieDetailsResults } from './movie-details.types';
import { DiscoverMovieResults, DiscoverTvShowsResults } from './discover.types';
import { SearchResponse } from './search.types';
import { TvShowDetailsResults } from './tvshow-details.types';
import { MovieOrTvShowDetailsResults } from './details.types';
import { t } from '../trpc-client';

const TMBD_API_ENDPOINT = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NODE_ENV === 'development' ? process.env.TMDB_API_KEY : TMDB_API_KEY;

export const tmdbRouter = t.router({
  movieDetails: t.procedure
    .input(
      z.object({
        movieId: z.string().nullish(),
      })
    )
    .query<MovieDetailsResults>(async ({ input }) => {
      const res = await axios.get(`${TMBD_API_ENDPOINT}/movie/${input.movieId}?api_key=${API_KEY}&append_to_response=credits`);
      return res.data;
    }),
  tvShowDetails: t.procedure
    .input(
      z.object({
        tvShowId: z.string().nullish(),
      })
    )
    .query<TvShowDetailsResults & { episodeNames: string[][] }>(async ({ input }) => {
      const res = await axios.get<TvShowDetailsResults>(`${TMBD_API_ENDPOINT}/tv/${input.tvShowId}?api_key=${API_KEY}&append_to_response=external_ids,credits`);

      const episodeNames = await Promise.all(
        res.data.seasons.map(async (season) => {
          await Promise.resolve(1000);
          return Promise.all(
            Array.from({ length: season.episode_count }).map(async (_, index) => {
              try {
                const episodeDetails = await axios.get(`${TMBD_API_ENDPOINT}/tv/${input.tvShowId}/season/${season.season_number}/episode/${index + 1}?api_key=${API_KEY}`);
                return episodeDetails.data.name;
              } catch (e) {
                return '';
              }
            })
          );
        })
      );

      return {
        ...res.data,
        episodeNames,
      };
    }),
  search: t.procedure
    .input(
      z.object({
        query: z.string().nullish(),
      })
    )
    .query<SearchResponse>(async ({ input }) => {
      const res = await axios.get(`${TMBD_API_ENDPOINT}/search/multi?api_key=${API_KEY}&query=${input.query}`);
      return res.data;
    }),
  discover: t.procedure
    .input(
      z.object({
        options: z.object({
          genres: z.array(z.number()),
          year: z.number().nullish(),
          sortBy: z.string(),
          page: z.number(),
        }),
        type: z.union([z.literal('movie'), z.literal('tv')]),
      })
    )
    .query<DiscoverMovieResults | DiscoverTvShowsResults>(async ({ input }) => {
      const res = await axios.get(`${TMBD_API_ENDPOINT}/discover/${input.type}?api_key=${API_KEY}`, {
        params: {
          with_genres: input.options.genres.length > 0 ? input.options.genres.join(',') : undefined,
          primary_release_year: input.options.year,
          sort_by: input.options.sortBy,
          page: input.options.page,
        },
      });
      return res.data;
    }),
  getShowsById: t.procedure
    .input(
      z.object({
        playingData: z.record(
          z.object({
            episode: z.number().nullish(),
            movie: z.number().nullish(),
            playingTime: z.number(),
          })
        ),
      })
    )
    .query<MovieOrTvShowDetailsResults>(async ({ input }) => {
      const playingDataWithTypes = Object.entries(input.playingData).map(([key, value]) => {
        return {
          id: key,
          showType: value.episode ? ('tv' as const) : ('movie' as const),
        };
      });
      const promises = playingDataWithTypes.map(async (show) => {
        const res = await axios.get<MovieDetailsResults | TvShowDetailsResults>(`${TMBD_API_ENDPOINT}/${show.showType}/${show.id}?api_key=${API_KEY}`);

        return {
          ...res.data,
          media_type: show.showType,
        };
      });

      return Promise.all(promises) as Promise<MovieOrTvShowDetailsResults>;
    }),
});
