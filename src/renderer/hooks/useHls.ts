import Hls from 'hls.js';
import { Options } from 'plyr';
import { useRef, useState, useEffect } from 'react';

export const useHls = (src?: string, options?: Options | null) => {
  const hls = useRef<Hls>(new Hls());
  const hasQuality = useRef<boolean>(false);
  const [plyrOptions, setPlyrOptions] = useState<Options | null | undefined>(
    options
  );

  useEffect(() => {
    hasQuality.current = false;
  }, [options]);

  useEffect(() => {
    if (options === null) return;
    if (!src) {
      setPlyrOptions(options || undefined);
      return;
    }
    const currentHls = new Hls();
    hls.current = currentHls;
    currentHls.loadSource(src);
    currentHls.attachMedia(document.querySelector('.plyr-react')!);

    currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (hasQuality.current) return; // early quit if already set

      const { levels } = currentHls;
      const quality: Options['quality'] = {
        default: levels[levels.length - 1].height,
        options: levels.map((level) => level.height),
        forced: true,
        onChange: (newQuality: number) => {
          levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
              currentHls.currentLevel = levelIndex;
            }
          });
        },
      };
      setPlyrOptions({ ...plyrOptions, quality });
      hasQuality.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, options, plyrOptions]);

  return { options: plyrOptions };
};
