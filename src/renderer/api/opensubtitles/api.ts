/* eslint-disable no-undef */
import { useMutation, useQuery } from '@tanstack/react-query';
import axios, { AxiosError, AxiosResponse } from 'axios';
import toWebVTT from 'srt-webvtt';
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
      JSON.parse(localStorage.getItem('opensubtitles')!)?.token
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
  isOpen: boolean,
  season?: number,
  episode?: number
) => {
  const { data, error, isLoading } = useQuery<Datum[], AxiosError<ApiError>>({
    queryKey: ['search-subtitles', tmdbId, season, episode, isOpen],
    enabled: isOpen,
    queryFn: async () => {
      const res = await baseApi.get<SearchResponse>('subtitles', {
        params: {
          page: 1,
          tmdb_id: tmdbId,
          season_number: season,
          episode_number: episode,
        },
      });

      const promises = Array.from({ length: res.data.total_pages }, (_, i) => {
        if (i === 0) return null;
        if (i % 2 === 0) {
          // avoid rate limit
          // eslint-disable-next-line no-promise-executor-return
          return new Promise((resolve) => setTimeout(resolve, 1000));
        }
        return baseApi.get<SearchResponse>('subtitles', {
          params: {
            page: i + 1,
            tmdb_id: tmdbId,
            season_number: season,
            episode_number: episode,
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

export const useSyncSubtitle = () => {
  const { mutate, data, error, isLoading } = useMutation({
    mutationKey: ['time-shift-subtitle'],
    mutationFn: async ({
      downloadUrl,
      timeShift,
    }: {
      downloadUrl: string;
      timeShift: number;
    }) => {
      const res = await axios.get(downloadUrl, {
        responseType: 'text',
      });
      const text = res.data;
      let newData = text;
      text.match(/(\d{2}:\d{2}:\d{2}\.\d{3})/g).forEach((match: string) => {
        let ms = Date.parse(`1970-01-01T${match}Z`);
        ms += Number(timeShift);
        const newTime = new Date(Number(ms)).toISOString().slice(11, -1);
        newData = newData.replace(match, newTime);
      });
      const newBlob = new Blob([newData], { type: 'text/vtt' });
      const url = URL.createObjectURL(newBlob);
      return url;
    },
  });

  return { mutate, data, error, isLoading };
};
