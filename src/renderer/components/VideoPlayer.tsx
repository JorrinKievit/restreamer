import {
  FC,
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { generateProxy } from 'hlsd/proxy';
import { Options } from 'plyr';

import Hls from 'hls.js';
import { APITypes, PlyrProps, usePlyr } from 'plyr-react';
import { LoginResponse } from 'renderer/api/opensubtitles/login.types';
import { VidSrcResponse } from 'types/vidsrc';
import { Box } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { InsertSubtitleButton, SubtitleSelector } from './SubtitleSelector';
import SourceSelector from './SourceSelector';
import SyncSubtitlesModal from './SyncSubtitlesModal';

interface VideoPlayerProps {
  sources: VidSrcResponse;
  tmdbId: string;
  isLastEpisode: boolean;
  season?: number;
  episode?: number;
}

const useHls = (src?: string, options?: Options | null) => {
  const hls = useRef<Hls>(new Hls());
  const hasQuality = useRef<boolean>(false);
  const [plyrOptions, setPlyrOptions] = useState<Options | null | undefined>(
    options
  );

  useEffect(() => {
    hasQuality.current = false;
  }, [options]);

  useEffect(() => {
    if (!src) return;
    hls.current.loadSource(src);
    hls.current.attachMedia(document.querySelector('.plyr-react')!);

    hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
      if (hasQuality.current) return; // early quit if already set

      const { levels } = hls.current;
      const quality: Options['quality'] = {
        default: levels[levels.length - 1].height,
        options: levels.map((level) => level.height),
        forced: true,
        onChange: (newQuality: number) => {
          levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
              hls.current.currentLevel = levelIndex;
            }
          });
        },
      };
      setPlyrOptions({ ...plyrOptions, quality });
      hasQuality.current = true;
    });
  });

  return { options: plyrOptions };
};

const CustomPlyrInstance = forwardRef<
  APITypes,
  PlyrProps & {
    hlsSource?: string;
  }
>((props, ref) => {
  const { source, options = null, hlsSource } = props;

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
    />
  );
});

const VideoPlayer: FC<VideoPlayerProps> = ({
  sources,
  tmdbId,
  season,
  episode,
  isLastEpisode,
}) => {
  const ref = useRef<APITypes | null>(null);
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [opensubtitlesData] = useLocalStorage<LoginResponse | null>(
    'opensubtitles',
    null
  );
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    'playingData',
    {}
  );

  const setPlayingDataOnUnmount = () => {
    if (!ref.current?.plyr?.source) return;

    const data = playingData;
    const progress = Math.floor(
      (ref.current.plyr.currentTime / ref.current.plyr.duration) * 100
    );

    let newPlayingData = {};

    if (!playingData[tmdbId] || progress <= 95) {
      newPlayingData = {
        ...playingData,
        [tmdbId]: {
          season,
          episode,
          playingTime: ref.current.plyr.currentTime,
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
          playingTime: ref.current.plyr.currentTime,
        },
      };
    }

    setPlayingData(newPlayingData);
  };

  useEffect(() => {
    if (selectedSource.referer || selectedSource.origin) {
      window.electron.ipcRenderer.startProxy(
        selectedSource.referer,
        selectedSource.origin
      );
    } else {
      window.electron.ipcRenderer.stopProxy();
    }
    return () => {
      window.electron.ipcRenderer.stopProxy();
    };
  }, [selectedSource]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (selectedSource.extractorData) {
      window.electron.ipcRenderer.validatePass(selectedSource.extractorData);
      interval = setInterval(() => {
        window.electron.ipcRenderer.validatePass(selectedSource.extractorData!);
      }, 1000 * 60);
    }
    return () => {
      clearInterval(interval);
    };
  }, [selectedSource?.extractorData]);

  useEffect(() => {
    if (ref.current?.plyr?.source) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.key === ' ') {
        if (
          ref.current?.plyr.elements.container?.contains(
            e.target as unknown as Node
          )
        ) {
          e.preventDefault();
          if (ref.current.plyr.playing) {
            ref.current.plyr.pause();
          } else {
            ref.current.plyr.play();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', setPlayingDataOnUnmount);

    // eslint-disable-next-line consistent-return
    return () => {
      setPlayingDataOnUnmount();
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', setPlayingDataOnUnmount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefChange = useCallback(
    (newRef: APITypes) => {
      if (newRef && newRef.plyr.source) {
        ref.current = newRef;
        newRef.plyr.on('loadeddata', () => {
          if (opensubtitlesData?.token) InsertSubtitleButton();
          if (playingData[tmdbId]) {
            newRef.plyr.currentTime = playingData[tmdbId].playingTime;
          }
          newRef.plyr.elements.container?.focus();
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opensubtitlesData?.token, playingData, tmdbId]
  );

  return (
    <Box gap={4}>
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
          selectedSource.type === 'm3u8'
            ? generateProxy(selectedSource.url)
            : undefined
        }
        options={{
          captions: {
            active: true,
            update: true,
            language: 'auto',
          },
          keyboard: {
            focused: true,
            global: true,
          },
          autoplay: true,
        }}
      />
      <SourceSelector
        sources={sources}
        activeSource={selectedSource}
        selectSource={setSelectedSource}
      />
      {opensubtitlesData?.token && (
        <>
          <SubtitleSelector tmbdId={tmdbId} season={season} episode={episode} />
          <SyncSubtitlesModal />
        </>
      )}
    </Box>
  );
};

export default VideoPlayer;
