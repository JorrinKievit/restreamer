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
import { APITypes, PlyrInstance, PlyrProps, usePlyr } from 'plyr-react';
import { LoginResponse } from 'renderer/api/opensubtitles/login.types';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { InsertSubtitleButton, SubtitleSelector } from './SubtitlesPlayer';

interface VideoPlayerProps {
  source: {
    url: string;
    server: string;
    extractorData?: string;
  };
  tmdbId: string;
  season?: number;
  number?: number;
}

const useHls = (src: string, options: Options | null) => {
  const hls = useRef<Hls>(new Hls());
  const hasQuality = useRef<boolean>(false);
  const [plyrOptions, setPlyrOptions] = useState<Options | null>(options);

  useEffect(() => {
    hasQuality.current = false;
  }, [options]);

  useEffect(() => {
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
          console.log('changes', newQuality);
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
    console.log(current.plyr);
    if (current.plyr.source === null) return;

    const api = current as { plyr: PlyrInstance };
    api.plyr.on('loadeddata', () => {
      if (isLoggedIn) InsertSubtitleButton();
    });
  });

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video ref={raptorRef} className="plyr-react plyr" crossOrigin="anonymous">
      {/* empty track cuz otherwise captions button won't show */}
      {/* <track kind="subtitles" /> */}
    </video>
  );
});

const VideoPlayer: FC<VideoPlayerProps> = ({
  source,
  tmdbId,
  season,
  number,
}) => {
  const ref = useRef<APITypes>(null);
  const [opensubtitlesData] = useLocalStorage<LoginResponse>(
    'opensubtitles',
    null
  );

  useEffect(() => {
    let interval;
    if (source?.extractorData) {
      window.electron.ipcRenderer.validatePass(source?.extractorData);
      interval = setInterval(() => {
        window.electron.ipcRenderer.validatePass(source?.extractorData);
      }, 1000 * 60);
    }
    return () => {
      clearInterval(interval);
    };
  }, [source?.extractorData]);

  return source.url ? (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <div>
      <CustomPlyrInstance
        ref={ref}
        source={null}
        hlsSource={generateProxy(source.url)}
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
      {opensubtitlesData?.token && (
        <SubtitleSelector tmbdId={tmdbId} season={season} number={number} />
      )}
    </div>
  ) : (
    <div>No source found</div>
  );
};

export default VideoPlayer;
