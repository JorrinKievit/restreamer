import {
  FC,
  forwardRef,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { generateProxy } from 'hlsd/proxy';
import { Options } from 'plyr';

import Hls from 'hls.js';
import { APITypes, PlyrInstance, PlyrProps, usePlyr } from 'plyr-react';
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
  number?: number;
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
    /**
     * You can all your custom event listener here
     * For this example we iterate over the qualities and pass them to plyr player
     * ref.current.plyr.play() ❌
     * console.log.bind(console, 'MANIFEST_PARSED') ✅
     * NOTE: you can only start play the audio here
     * Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first.
     */
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
  PlyrProps & { hlsSource: string; isLoggedIn: boolean }
>((props, ref) => {
  const { source, options = null, hlsSource, isLoggedIn } = props;

  const raptorRef = usePlyr(ref, {
    ...useHls(hlsSource, options),
    source,
  }) as MutableRefObject<HTMLVideoElement>;

  useEffect(() => {
    const { current } = ref as MutableRefObject<APITypes>;
    if (current.plyr.source === null) return;

    const api = current as { plyr: PlyrInstance };
    api.plyr.on('loadeddata', () => {
      if (isLoggedIn) InsertSubtitleButton();
    });
  });

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
  number,
}) => {
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const ref = useRef<APITypes>(null);
  const [opensubtitlesData] = useLocalStorage<LoginResponse>(
    'opensubtitles',
    null
  );

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

  return (
    <Box gap={4}>
      <CustomPlyrInstance
        ref={ref}
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
        isLoggedIn={!!opensubtitlesData?.token}
      />
      <SourceSelector
        sources={sources}
        activeSource={selectedSource}
        selectSource={setSelectedSource}
      />
      {opensubtitlesData?.token && (
        <SubtitleSelector tmbdId={tmdbId} season={season} number={number} />
      )}
    </Box>
  );
};

export default VideoPlayer;
