import {
  FC,
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { APITypes, PlyrProps, usePlyr } from 'plyr-react';
import { LoginResponse } from 'main/api/opensubtitles/login.types';
import { Source } from 'types/sources';
import { AspectRatio, Box } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { useHls } from 'renderer/hooks/useHls';
import { SourceInfo } from 'plyr';
import { randomString } from 'renderer/utils/string';
import { OPENSUBTITLES_LANGUAGES } from 'main/api/opensubtitles/languages';
import { convertSrtToWebVTT } from 'renderer/utils/subtitles';
import { insertPlayerButtons } from 'renderer/utils/player';
import { getProxyUrl } from 'renderer/lib/proxy';
import { client } from 'renderer/api/trpc';
import { SubtitleSelector } from './SubtitleSelector';
import SyncSubtitlesModal from './SyncSubtitlesModal';

interface VideoPlayerProps {
  selectedSource: Source;
  tmdbId: string;
  isLastEpisode: boolean;
  season?: number;
  episode?: number;
}

const CustomPlyrInstance = forwardRef<
  APITypes,
  PlyrProps & {
    hlsSource?: string;
  }
>((props, ref) => {
  const { options = null } = props;

  const [source, setSource] = useState<SourceInfo | null>(props.source);
  const [hlsSource, setHlsSource] = useState<string | undefined>(
    props.hlsSource
  );

  useEffect(() => {
    setSource(props.source);
  }, [props.source]);

  useEffect(() => {
    setHlsSource(props.hlsSource);
  }, [props.hlsSource]);

  const raptorRef = usePlyr(ref, {
    ...useHls(hlsSource, options),
    source,
  }) as MutableRefObject<HTMLVideoElement>;

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={raptorRef}
      className="plyr-react plyr"
      crossOrigin="anonymous"
      tabIndex={-1}
      // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
      role="application"
    />
  );
});

const VideoPlayer: FC<VideoPlayerProps> = ({
  selectedSource,
  tmdbId,
  season,
  episode,
  isLastEpisode,
}) => {
  const ref = useRef<APITypes | null>(null);
  const [opensubtitlesData] = useLocalStorage<LoginResponse | null>(
    'opensubtitles',
    null
  );
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    'playingData',
    {}
  );
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

  const currentTime = useRef(0);
  const duration = useRef(0);

  const setPlayingDataOnUnmount = () => {
    if (!ref.current?.plyr && !ref.current?.plyr.source) return;

    const data = playingData;
    const progress = Math.floor((currentTime.current / duration.current) * 100);

    let newPlayingData = {};

    if (!playingData[tmdbId] || progress <= 95) {
      newPlayingData = {
        ...playingData,
        [tmdbId]: {
          season,
          episode,
          playingTime: currentTime.current,
        },
      };
    } else if ((!season && !episode) || (season && episode && isLastEpisode)) {
      delete data[tmdbId];
      newPlayingData = data;
    } else {
      newPlayingData = {
        ...data,
        [tmdbId]: {
          season,
          episode,
          playingTime: currentTime.current,
        },
      };
    }

    setPlayingData(newPlayingData);
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
    if (ref.current?.plyr?.source) return;

    window.addEventListener('beforeunload', setPlayingDataOnUnmount);

    return () => {
      setPlayingDataOnUnmount();
      window.removeEventListener('beforeunload', setPlayingDataOnUnmount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ref.current?.plyr?.source) return;

    setPlayingDataOnUnmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  const onRefChange = useCallback(
    (newRef: APITypes) => {
      if (newRef && newRef?.plyr?.source) {
        let initialLoad = true;
        ref.current = newRef;

        const onLanguageChange = () => {
          const tracks = document.querySelectorAll('track');
          const plyrData = localStorage.getItem('plyr')
            ? JSON.parse(localStorage.getItem('plyr') as string)
            : null;

          const selectedTrack: HTMLTrackElement | null =
            (ref.current?.plyr.currentTrack === -1
              ? document.querySelector(`track[srclang=${plyrData?.language}]`)
              : tracks[ref.current?.plyr.currentTrack!]) ??
            document.querySelector('track[default]');

          if (!selectedTrack) return;

          if (selectedTrack.src.includes('.srt')) {
            convertSrtToWebVTT(selectedTrack.src).then((vtt) => {
              selectedTrack.setAttribute('src', vtt);
            });
          }
        };

        const onTimeUpdate = () => {
          currentTime.current = ref.current!.plyr.currentTime;
          duration.current = ref.current!.plyr.duration;
        };

        const onLoadData = () => {
          if (initialLoad) {
            initialLoad = false;
            if (selectedSource.type === 'mp4') return;
          }

          insertPlayerButtons(
            ref.current!,
            season && episode ? 'tv' : 'movie',
            !!opensubtitlesData?.token,
            !!selectedSource.subtitles,
            isLastEpisode
          );

          if (selectedSource.subtitles) {
            if (document.querySelectorAll('track').length > 0) return;

            const video = document.querySelector('video');

            const languageCounts: { [key: string]: number } = {};

            selectedSource.subtitles.forEach((subtitle) => {
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

              const track = document.createElement('track');
              Object.assign(track, {
                kind: 'captions',
                label: subtitle.label,
                srclang: `${language.language_code}-${count}`,
                default: subtitle.label === 'English' && count === 1,
                src: subtitle.file,
              });
              video?.appendChild(track);
            });

            onLanguageChange();
          }
          ref.current!.plyr.elements?.container?.focus();

          if (playingData[tmdbId]) {
            if (currentTime.current !== 0) {
              ref.current!.plyr.currentTime = currentTime.current;
            } else if (
              (playingData[tmdbId].season === season &&
                playingData[tmdbId].episode === episode) ||
              (!playingData[tmdbId].season && !playingData[tmdbId].episode)
            ) {
              ref.current!.plyr.currentTime = playingData[tmdbId].playingTime;
            }
          }
        };

        ref.current.plyr.on('loadeddata', onLoadData);
        ref.current.plyr.on('languagechange', onLanguageChange);
        ref.current.plyr.on('timeupdate', onTimeUpdate);

        return () => {
          ref.current!.plyr.off('loadeddata', onLoadData);
          ref.current!.plyr.off('languagechange', onLanguageChange);
          ref.current!.plyr.off('timeupdate', onTimeUpdate);
        };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opensubtitlesData?.token, playingData, tmdbId, selectedSource]
  );

  return (
    <Box gap={4}>
      <AspectRatio ratio={16 / 9}>
        <CustomPlyrInstance
          ref={onRefChange}
          source={
            selectedSource.type === 'mp4'
              ? {
                  type: 'video',
                  sources: [
                    {
                      src: selectedSource.url,
                      type: 'video/mp4',
                    },
                  ],
                }
              : null
          }
          hlsSource={
            // eslint-disable-next-line no-nested-ternary
            selectedSource.type === 'm3u8'
              ? selectedSource.requiresProxy
                ? getProxyUrl(selectedSource.url)
                : selectedSource.url
              : undefined
          }
          options={{
            captions: { active: true, update: true, language: 'auto' },
            keyboard: { focused: true, global: true },
            autoplay: true,
            tooltips: {
              controls: true,
              seek: true,
            },
            controls: [
              'play-large',
              'play',
              'progress',
              'current-time',
              'mute',
              'volume',
              'captions',
              'settings',
              'fullscreen',
            ],
          }}
        />
      </AspectRatio>
      {opensubtitlesData?.token && (
        <SubtitleSelector tmdbId={tmdbId} season={season} episode={episode} />
      )}
      {(selectedSource.subtitles || opensubtitlesData?.token) && (
        <SyncSubtitlesModal />
      )}
    </Box>
  );
};

export default VideoPlayer;
