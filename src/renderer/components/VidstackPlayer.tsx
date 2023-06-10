import { FC, useEffect, useRef } from 'react';

import { MediaCommunitySkin, MediaOutlet, MediaPlayer } from '@vidstack/react';
import { Source } from 'types/sources';
import { LoginResponse } from 'main/api/opensubtitles/login.types';
import { client } from 'renderer/api/trpc';
import { PlayingData } from 'types/localstorage';
import { OPENSUBTITLES_LANGUAGES } from 'main/api/opensubtitles/languages';
import { randomString } from 'renderer/utils/string';
import { MediaPlayerElement } from 'vidstack';
import { insertPlayerButtons } from 'renderer/utils/player';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { getProxyUrl } from 'renderer/lib/proxy';
import { SyncSubtitlesPopover } from './SyncSubtitlesPopover';
import { SubtitleSelector } from './SubtitleSelector';

interface VidstackPlayerProps {
  selectedSource: Source;
  title?: string;
  tmdbId: string;
  isLastEpisode: boolean;
  season?: number;
  episode?: number;
}

const VidstackPlayer: FC<VidstackPlayerProps> = ({
  selectedSource,
  title,
  tmdbId,
  isLastEpisode,
  season,
  episode,
}) => {
  const languageCounts: { [key: string]: number } = {};

  const player = useRef<MediaPlayerElement>(null);

  const [opensubtitlesData] = useLocalStorage<LoginResponse | null>(
    'opensubtitles',
    null
  );
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    'playingData',
    {}
  );
  const [playerVolume, setPlayerVolume] = useLocalStorage<number>(
    'playerVolume',
    1
  );

  const latestPlayingData = useRef<PlayingData>(playingData);

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();
  const { data: proxyData } = client.proxy.validate.useQuery(
    {
      url: selectedSource!.extractorData!,
    },
    {
      enabled: !!(
        selectedSource.extractorData && selectedSource.server === 'VidSrc Pro'
      ),
      refetchInterval: 1000 * 60,
    }
  );

  const setPlayingDataOnTimeChange = () => {
    if (!player.current || !latestPlayingData.current) return;

    const progress = Math.floor(
      (player.current.state.currentTime / player.current.state.duration) * 100
    );

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

  const setupPlayer = () => {
    insertPlayerButtons(
      opensubtitlesData?.token !== undefined,
      !!season && !!episode && !isLastEpisode
    );
    if (!player.current) return;
    player.current.volume = playerVolume;
    if (playingData[tmdbId]) {
      if (player.current.state.currentTime !== 0) {
        player.current.currentTime = player.current.state.currentTime;
      } else if (
        (playingData[tmdbId].season === season &&
          playingData[tmdbId].episode === episode) ||
        (!playingData[tmdbId].season && !playingData[tmdbId].episode)
      ) {
        player.current.currentTime = playingData[tmdbId].playingTime;
      }
    }
  };

  useEffect(() => {
    if (
      selectedSource.requiresProxy &&
      selectedSource.referer &&
      selectedSource.origin
    ) {
      startProxy({
        referer: selectedSource.referer,
        origin: selectedSource.origin,
      });
    } else {
      stopProxy();
    }
    return () => {
      stopProxy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  useEffect(() => {
    if (!player.current) return;
    window.addEventListener('beforeunload', () => {
      setPlayingData(latestPlayingData.current);
    });

    return () => {
      setPlayingData(latestPlayingData.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPlayingData(latestPlayingData.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  return (
    <MediaPlayer
      ref={player}
      title={title}
      src={
        selectedSource.requiresProxy
          ? getProxyUrl(selectedSource.url)
          : selectedSource.url
      }
      aspectRatio={16 / 9}
      crossorigin="anonymous"
      autoplay
      onCanPlay={setupPlayer}
      onTimeUpdate={setPlayingDataOnTimeChange}
      onFullscreenChange={() => {
        setTimeout(() => {
          insertPlayerButtons(
            opensubtitlesData?.token !== undefined,
            !!season && !!episode && !isLastEpisode
          );
        }, 100);
      }}
      onVolumeChange={(data) => {
        setPlayerVolume(data.detail.volume);
      }}
    >
      <MediaOutlet>
        {selectedSource.subtitles?.map((subtitle) => {
          let language = OPENSUBTITLES_LANGUAGES.find((lang) =>
            lang.language_name.includes(subtitle.label.split(' ')[0].trim())
          );

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

          return (
            <track
              src={subtitle.file}
              label={`${language.language_name} ${count}`}
              srcLang={`${language.language_code}-${count}`}
              kind="subtitles"
              default={subtitle.label === 'English' && count === 1}
              key={subtitle.file}
              data-type={subtitle.file.endsWith('.vtt') ? 'vtt' : 'srt'}
            />
          );
        })}
      </MediaOutlet>
      <MediaCommunitySkin />
      {(selectedSource.subtitles || opensubtitlesData?.token) && (
        <SyncSubtitlesPopover />
      )}
      {opensubtitlesData?.token && (
        <SubtitleSelector tmdbId={tmdbId} season={season} episode={episode} />
      )}
    </MediaPlayer>
  );
};

export default VidstackPlayer;
