/* eslint-disable no-undef */
import axios, { AxiosResponse, isAxiosError } from 'axios';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import { t } from '../trpc-client';
import { DownloadResponse } from './download.types';
import { LoginResponse } from './login.types';
import { SearchResponse } from './search.types';
import {
  OpenSubtitlesUser,
  UserInformationResponse,
} from './user-information.types';

const OPENSUBTITLES_API_URL = 'https://api.opensubtitles.com/api/v1/';

const API_KEY =
  process.env.NODE_ENV === 'development'
    ? process.env.OPENSUBTITLES_API_KEY
    : OPENSUBTITLES_API_KEY;

const baseApi = axios.create({
  baseURL: OPENSUBTITLES_API_URL,
  headers: {
    'Api-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export const openSubtitlesRouter = t.router({
  login: t.procedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const loginResponse = await baseApi.post<LoginResponse>('login', {
          username: input.username,
          password: input.password,
        });

        const userInformationResponse =
          await baseApi.get<UserInformationResponse>('infos/user', {
            headers: {
              Authorization: `Bearer ${loginResponse.data.token}`,
            },
          });

        const user: OpenSubtitlesUser = {
          user: {
            ...loginResponse.data.user,
            ...userInformationResponse.data.data,
          },
          token: loginResponse.data.token,
        };

        return user;
      } catch (error) {
        if (isAxiosError(error)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.response?.data.message,
          });
        }

        throw error;
      }
    }),
  logout: t.procedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await baseApi.delete('logout', {
        headers: {
          Authorization: `Bearer ${input.token}`,
        },
      });
      return res.data;
    }),
  user: t.procedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const res = await baseApi.get('user', {
        headers: {
          Authorization: `Bearer ${input.token}`,
        },
      });
      return res.data;
    }),
  search: t.procedure
    .input(
      z.object({
        tmdbId: z.string(),
        season: z.number().optional(),
        episode: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const res = await baseApi.get<SearchResponse>('subtitles', {
        params: {
          page: 1,
          tmdb_id: input.tmdbId,
          season_number: input.season,
          episode_number: input.episode,
        },
      });

      const promises = Array.from({ length: res.data.total_pages }, (_, i) => {
        if (i === 0) return null;
        if (i % 2 === 0) {
          // avoid rate limit
          // eslint-disable-next-line no-promise-executor-return
          return new Promise((resolve) => setTimeout(resolve, 1500));
        }
        return baseApi.get<SearchResponse>('subtitles', {
          params: {
            page: i + 1,
            tmdb_id: input.tmdbId,
            season_number: input.season,
            episode_number: input.episode,
          },
        });
      });
      const responseData = (await Promise.all(
        promises
      )) as AxiosResponse<SearchResponse>[];

      const finalData = responseData
        .filter((x) => x !== null)
        .filter((x) => x !== undefined)
        .map((r) => r.data.data)
        .flat()
        .concat(res.data.data);
      return finalData;
    }),
  download: t.procedure
    .input(
      z.object({
        fileId: z.number(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await baseApi.post<DownloadResponse>(
        'download',
        {
          file_id: input.fileId,
          sub_format: 'webvtt',
          force_download: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${input.token}`,
            Accept: '*/*',
          },
        }
      );
      return res.data;
    }),
});
