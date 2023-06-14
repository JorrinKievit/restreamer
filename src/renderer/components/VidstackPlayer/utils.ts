import { OPENSUBTITLES_LANGUAGES } from 'main/api/opensubtitles/languages';
import { randomString } from 'main/extractors/utils';
import { RefObject, MutableRefObject } from 'react';
import { PlayingData } from 'types/localstorage';
import { Subtitle } from 'types/sources';
import { MediaPlayerElement } from 'vidstack';

export const setPlayingDataOnTimeChange = (
  player: RefObject<MediaPlayerElement>,
  latestPlayingData: MutableRefObject<PlayingData>,
  tmdbId: string,
  season?: number,
  episode?: number,
  isLastEpisode?: boolean
) => {
  if (!player.current || !latestPlayingData.current) return;

  const progress = Math.floor((player.current.state.currentTime / player.current.state.duration) * 100);

  let updatedData = {};

  if (!latestPlayingData.current[tmdbId] || progress <= 95) {
    updatedData = {
      ...latestPlayingData.current,
      [tmdbId]: {
        season,
        episode,
        playingTime: player.current.state.currentTime,
      },
    };
  } else if ((!season && !episode) || (season && episode && isLastEpisode)) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { [tmdbId]: _, ...data } = latestPlayingData.current;
    updatedData = data;
  } else {
    updatedData = {
      ...latestPlayingData.current,
      [tmdbId]: {
        season,
        episode,
        playingTime: player.current.state.currentTime,
      },
    };
  }

  latestPlayingData.current = updatedData;
};

export const getSubtitlePlayerLanguage = (subtitle: Subtitle, languageCounts: { [key: string]: number }) => {
  let language = OPENSUBTITLES_LANGUAGES.find((lang) => lang.language_name.includes(subtitle.label.split(' ')[0].trim()));

  if (!language) {
    language = {
      language_name: subtitle.label,
      language_code: randomString(2),
    };
  }

  if (!languageCounts[language.language_name]) {
    languageCounts[language.language_name] = 0;
  }
  const count = languageCounts[language.language_name] + 1;
  languageCounts[language.language_name] = count;

  return {
    name: language.language_name,
    code: language.language_code,
    count,
  };
};
