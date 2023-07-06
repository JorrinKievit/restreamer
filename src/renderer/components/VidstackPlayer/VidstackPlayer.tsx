import { FC, useEffect, useRef } from 'react';
import { MediaCommunitySkin, MediaOutlet, MediaPlayer } from '@vidstack/react';
import { Source } from 'types/sources';
import { LoginResponse } from 'main/api/opensubtitles/login.types';
import { client } from 'renderer/api/trpc';
import { PlayingData } from 'types/localstorage';
import { MediaPlayerElement } from 'vidstack';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { getProxyUrl } from 'renderer/lib/proxy';
import { SubtitleSelector } from '../SubtitleSelector';
import { SyncSubtitlesPopover } from '../SyncSubtitlesPopover';
import { getSubtitlePlayerLanguage, insertPlayerButtons } from './utils';

interface VidstackPlayerProps {
  selectedSource?: Source | null;
  title?: string;
  tmdbId: string;
  isLastEpisode: boolean;
  season?: number;
  episode?: number;
}

const VidstackPlayer: FC<VidstackPlayerProps> = ({ selectedSource, title, tmdbId, isLastEpisode, season, episode }) => {
  const languageCounts: { [key: string]: number } = {};

  const player = useRef<MediaPlayerElement>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const playerVolumeRef = useRef<number>(0);

  const [opensubtitlesData] = useLocalStorage<LoginResponse | null>('opensubtitles', null);
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>('playingData', {});

  const [playerVolume, setPlayerVolume] = useLocalStorage<number>('playerVolume', 1);

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();
  client.proxy.validate.useQuery(
    {
      url: selectedSource?.extractorData ?? '',
    },
    {
      enabled: !!(selectedSource?.extractorData && selectedSource.server === 'VidSrc Pro'),
      refetchInterval: 1000 * 60,
    }
  );

  const setupPlayer = () => {
    insertPlayerButtons(opensubtitlesData?.token !== undefined, !!season && !!episode && !isLastEpisode);
    if (!player.current) return;
    player.current.volume = playerVolume;

    if (playingData[tmdbId] === undefined) return;
    if (playingData[tmdbId].season !== season || playingData[tmdbId].episode !== episode) {
      player.current.currentTime = 0;
    } else {
      player.current.currentTime = playingData[tmdbId].playingTime ?? 0;
    }
  };

  const setPlayingDataOnUnmount = () => {
    const progress = Math.floor((currentTimeRef.current / durationRef.current) * 100);

    let updatedData = {};

    const playingTime = currentTimeRef.current;
    const duration = Math.round(durationRef.current / 60);

    if (!playingData[tmdbId] || progress <= 95) {
      updatedData = {
        ...playingData,
        [tmdbId]: {
          season,
          episode,
          playingTime,
          duration,
        },
      };
    } else if ((!season && !episode) || (season && episode && isLastEpisode)) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { [tmdbId]: _, ...data } = playingData;
      updatedData = data;
    } else {
      updatedData = {
        ...playingData,
        [tmdbId]: {
          season,
          episode,
          playingTime,
          duration,
        },
      };
    }
    setPlayingData(updatedData);
  };

  useEffect(() => {
    window.addEventListener('beforeunload', () => {
      setPlayingDataOnUnmount();
      setPlayerVolume(playerVolumeRef.current);
    });

    return () => {
      if (!selectedSource) return;
      setPlayingDataOnUnmount();
      setPlayerVolume(playerVolumeRef.current);

      window.removeEventListener('beforeunload', () => {
        setPlayingDataOnUnmount();
        setPlayerVolume(playerVolumeRef.current);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource?.requiresProxy && selectedSource.referer) {
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
  }, [selectedSource, startProxy, stopProxy]);

  return (
    <MediaPlayer
      ref={player}
      title={title}
      src={(selectedSource?.requiresProxy ? getProxyUrl(selectedSource.url, selectedSource.referer) : selectedSource?.url) ?? ''}
      thumbnails={selectedSource?.thumbnails}
      aspectRatio={16 / 9}
      crossorigin="anonymous"
      autoplay
      onCanPlay={setupPlayer}
      onFullscreenChange={() => {
        setTimeout(() => {
          insertPlayerButtons(opensubtitlesData?.token !== undefined, !!season && !!episode && !isLastEpisode);
        }, 100);
      }}
      onVolumeChange={(e) => {
        playerVolumeRef.current = e.target.volume;
      }}
      onTimeUpdate={(e) => {
        currentTimeRef.current = e.target.currentTime;
      }}
      onLoadedMetadata={(e) => {
        durationRef.current = e.target.state.duration;
      }}
    >
      <MediaOutlet>
        {selectedSource?.subtitles?.map((subtitle) => {
          const subtitleLanguage = getSubtitlePlayerLanguage(subtitle, languageCounts);
          return (
            <track
              src={subtitle.file}
              label={`${subtitleLanguage.name} ${subtitleLanguage.count}`}
              srcLang={`${subtitleLanguage.code}-${subtitleLanguage.count}`}
              kind="subtitles"
              default={subtitle.label === 'English' && subtitleLanguage.count === 1}
              key={subtitle.file}
              data-type={subtitle.file.endsWith('.vtt') ? 'vtt' : 'srt'}
            />
          );
        })}
      </MediaOutlet>
      <MediaCommunitySkin />
      {(selectedSource?.subtitles || opensubtitlesData?.token) && <SyncSubtitlesPopover />}
      {opensubtitlesData?.token && <SubtitleSelector tmdbId={tmdbId} season={season} episode={episode} />}
    </MediaPlayer>
  );
};

export default VidstackPlayer;
