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
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { VidSrcResponse } from 'types/vidsrc';
import { Box } from '@chakra-ui/react';
import { InsertSubtitleButton, SubtitleSelector } from './SubtitlesPlayer';
import SourceSelector from './SourceSelector';

interface VideoPlayerProps {
  sources: VidSrcResponse;
  tmdbId: string;
  season?: number;
  episode?: number;
}

const useHls = (src?: string, options?: Options | null) => {
  const hls = useRef<Hls>(new Hls());
  const hasQuality = useRef<boolean>(false);
  const [plyrOptions, setPlyrOptions] = useState<Options | null>(options);

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
    hlsSource: string;
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
    />
  );
});

const VideoPlayer: FC<VideoPlayerProps> = ({
  sources,
  tmdbId,
  season,
  episode,
}) => {
  const ref = useRef<APITypes>(null);
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [opensubtitlesData] = useLocalStorage<LoginResponse>(
    'opensubtitles',
    null
  );
  const [playingData, setPlayingData] = useLocalStorage('playingData', {
    [tmdbId]: {
      season,
      episode,
      playingTime: 0,
    },
  });

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
    let interval;
    if (selectedSource?.extractorData) {
      window.electron.ipcRenderer.validatePass(selectedSource?.extractorData);
      interval = setInterval(() => {
        window.electron.ipcRenderer.validatePass(selectedSource?.extractorData);
      }, 1000 * 60);
    }
    return () => {
      clearInterval(interval);
    };
  }, [selectedSource?.extractorData]);

  const onRefChange = useCallback(
    (newRef: APITypes) => {
      if (newRef && newRef.plyr.source) {
        ref.current = newRef;
        newRef.plyr.on('loadeddata', () => {
          if (opensubtitlesData?.token) InsertSubtitleButton();
          if (playingData[tmdbId]) {
            newRef.plyr.currentTime = playingData[tmdbId].playingTime;
          }
        });
      }
    },
    [opensubtitlesData?.token, playingData, tmdbId]
  );

  useEffect(() => {
    return () => {
      setPlayingData({
        ...playingData,
        [tmdbId]: {
          season,
          episode,
          playingTime: ref.current.plyr.currentTime,
        },
      });
    };
  }, [episode, playingData, season, setPlayingData, tmdbId]);

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
            : null
        }
        options={{
          captions: {
            active: true,
            update: true,
            language: 'auto',
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
        <SubtitleSelector tmbdId={tmdbId} season={season} episode={episode} />
      )}
    </Box>
  );
};

export default VideoPlayer;
