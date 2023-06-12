import { FC, useEffect, useRef } from 'react';
import { MediaCommunitySkin, MediaOutlet, MediaPlayer } from '@vidstack/react';
import { Source } from 'types/sources';
import { LoginResponse } from 'main/api/opensubtitles/login.types';
import { client } from 'renderer/api/trpc';
import { PlayingData } from 'types/localstorage';
import { MediaPlayerElement } from 'vidstack';
import { insertPlayerButtons } from 'renderer/utils/player';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { getProxyUrl } from 'renderer/lib/proxy';
import { SubtitleSelector } from '../SubtitleSelector';
import { SyncSubtitlesPopover } from '../SyncSubtitlesPopover';
import { getSubtitlePlayerLanguage, setPlayingDataOnTimeChange } from './utils';

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
  const currentVolume = useRef<number>(playerVolume);

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();
  const { data: proxyData } = client.proxy.validate.useQuery(
    {
      url: selectedSource.extractorData!,
    },
    {
      enabled: !!(
        selectedSource.extractorData && selectedSource.server === 'VidSrc Pro'
      ),
      refetchInterval: 1000 * 60,
    }
  );

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
  }, [selectedSource, startProxy, stopProxy]);

  useEffect(() => {
    if (!player.current) return;

    window.addEventListener('beforeunload', () => {
      setPlayingData(latestPlayingData.current);
      setPlayerVolume(currentVolume.current);
    });

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPlayingData(latestPlayingData.current);
      setPlayerVolume(currentVolume.current);
    };
  }, [setPlayerVolume, setPlayingData]);

  useEffect(() => {
    setPlayingData(latestPlayingData.current);
    setPlayerVolume(currentVolume.current);
  }, [selectedSource, setPlayerVolume, setPlayingData]);

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
      onTimeUpdate={() =>
        setPlayingDataOnTimeChange(
          player,
          latestPlayingData,
          tmdbId,
          season,
          episode,
          isLastEpisode
        )
      }
      onFullscreenChange={() => {
        setTimeout(() => {
          insertPlayerButtons(
            opensubtitlesData?.token !== undefined,
            !!season && !!episode && !isLastEpisode
          );
        }, 100);
      }}
      onVolumeChange={(data) => {
        currentVolume.current = data.detail.volume;
      }}
    >
      <MediaOutlet>
        {selectedSource.subtitles?.map((subtitle) => {
          const subtitleLanguage = getSubtitlePlayerLanguage(
            subtitle,
            languageCounts
          );
          return (
            <track
              src={subtitle.file}
              label={`${subtitleLanguage.name} ${subtitleLanguage.count}`}
              srcLang={`${subtitleLanguage.code}-${subtitleLanguage.count}`}
              kind="subtitles"
              default={
                subtitle.label === 'English' && subtitleLanguage.count === 1
              }
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
