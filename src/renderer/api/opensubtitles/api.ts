/* eslint-disable no-undef */
import { useMutation, useQuery } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { ApiError, DownloadApiError } from './api.error';
import { DownloadResponse } from './download.types';
import { LoginResponse } from './login.types';
import { LogoutResponse } from './logout.types';
import { Datum, SearchResponse } from './search.types';
import {
  OpenSubtitlesUser,
  UserInformationResponse,
} from './user-information.types';

const OPENSUBTITLES_API_URL = 'https://api.opensubtitles.com/api/v1/';

const baseApi = axios.create({
  baseURL: OPENSUBTITLES_API_URL,
  headers: {
    'Api-Key': OPENSUBTITLES_API_KEY,
    'Content-Type': 'application/json',
  },
});

const authenticatedApi = axios.create({
  baseURL: OPENSUBTITLES_API_URL,
  headers: {
    'Api-Key': OPENSUBTITLES_API_KEY,
    Authorization: `Bearer ${
      JSON.parse(localStorage.getItem('opensubtitles'))?.token
    }`,
    'Content-Type': 'application/json',
    accept: '*/*',
  },
});

export const useOpenSubtitlesLogin = () => {
  const { mutate, data, error, isLoading, isSuccess } = useMutation<
    OpenSubtitlesUser,
    AxiosError<ApiError>,
    { username: string; password: string }
  >({
    mutationKey: ['login'],
    mutationFn: async ({ username, password }) => {
      const loginResponse = await baseApi.post<LoginResponse>('login', {
        username,
        password,
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
    },
  });

  return { mutate, data, error, isLoading, isSuccess };
};

export const useOpenSubtitlesLogout = () => {
  const { mutate, data, error, isLoading } = useMutation<
    LogoutResponse,
    AxiosError<ApiError>
  >({
    mutationKey: ['logout'],
    mutationFn: () => authenticatedApi.delete('logout').then((res) => res.data),
  });

  return { mutate, data, error, isLoading };
};

export const useOpenSubtitlesUserInformation = () => {
  const { data, error, isLoading } = useQuery<
    UserInformationResponse,
    AxiosError<ApiError>
  >({
    queryKey: ['user-information'],
    queryFn: () => authenticatedApi.get('user').then((res) => res.data),
  });

  return { data, error, isLoading };
};

export const useSearchSubtitles = (
  tmdbId: string,
  season?: number,
  episode?: number
) => {
  const { data, error, isLoading } = useQuery<Datum[], AxiosError<ApiError>>({
    queryKey: ['search-subtitles', tmdbId, season, episode],
    queryFn: async () => {
      const res = await baseApi.get('subtitles', {
        params: {
          tmdb_id: tmdbId,
          season_number: season,
          episode_number: episode,
          page: 1,
        },
      });

      const promises = Array.from({ length: res.data.total_pages }, (_, i) => {
        if (i === 0) return null;
        return baseApi.get<SearchResponse>('subtitles', {
          params: {
            tmdb_id: tmdbId,
            season_number: season,
            episode_number: episode,
            page: i + 1,
          },
        });
      });
      const responseData = await Promise.all(promises);
      const finalData = responseData
        .filter((x) => x !== null)
        .map((r) => r.data.data)
        .flat()
        .concat(res.data.data);
      return finalData;
    },
  });

  return { data, error, isLoading };
};

export const useDownloadSubtitle = () => {
  const { mutate, data, error, isLoading } = useMutation<
    DownloadResponse,
    AxiosError<DownloadApiError>,
    { fileId: number }
  >({
    mutationKey: ['download-subtitle'],
    mutationFn: ({ fileId }) =>
      authenticatedApi
        .post('download', {
          file_id: fileId,
          sub_format: 'webvtt',
          force_download: 1,
        })
        .then((res) => res.data),
  });

  return { mutate, data, error, isLoading };
};
