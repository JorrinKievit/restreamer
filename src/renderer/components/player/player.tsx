import { FC, useEffect, useRef, useState } from "react";
import {
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import { Source } from "types/sources";
import { LoginResponse } from "main/api/opensubtitles/login.types";
import { client } from "renderer/api/trpc";
import { PlayingData } from "types/localstorage";
import { useLocalStorage } from "renderer/hooks/useLocalStorage";
import { getM3U8ProxyUrl, getMP4ProxyUrl } from "renderer/lib/proxy";
import { SubtitleSelector } from "./subtitle-selector";
import { SyncSubtitlesPopover } from "./sync-subtitles";
import { getSubtitlePlayerLanguage, insertPlayerButtons } from "./utils";

interface PlayerProps {
  selectedSource?: Source | null;
  title?: string;
  tmdbId: string;
  isLastEpisode: boolean;
  season?: number;
  episode?: number;
}

const Player: FC<PlayerProps> = ({
  selectedSource,
  title,
  tmdbId,
  isLastEpisode,
  season,
  episode,
}) => {
  const languageCounts: { [key: string]: number } = {};

  const [subtitles, setSubtitles] = useState(selectedSource?.subtitles);

  const player = useRef<MediaPlayerInstance>(null);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const playerVolumeRef = useRef<number>(0);
  const selectedSubtitleLabel = useRef<string | null>(null);

  const [opensubtitlesData] = useLocalStorage<LoginResponse | null>(
    "opensubtitles",
    null,
  );
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    "playingData",
    {},
  );

  const [playerVolume, setPlayerVolume] = useLocalStorage<number>(
    "playerVolume",
    1,
  );

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();
  const { mutate: getSubUrl } = client.vidsrc.getSubUrl.useMutation();

  const setupPlayer = () => {
    setTimeout(() => {
      insertPlayerButtons(
        opensubtitlesData?.token !== undefined,
        !!season && !!episode && !isLastEpisode,
      );
    }, 1000);
    if (!player.current) return;
    player.current.volume = playerVolume;

    if (playingData[tmdbId] === undefined) return;
    if (
      playingData[tmdbId].season !== season ||
      playingData[tmdbId].episode !== episode
    ) {
      player.current.currentTime = 0;
    } else {
      player.current.currentTime = playingData[tmdbId].playingTime ?? 0;
    }
  };

  const setPlayingDataOnUnmount = () => {
    const progress = Math.floor(
      (currentTimeRef.current / durationRef.current) * 100,
    );

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
    window.addEventListener("beforeunload", () => {
      setPlayingDataOnUnmount();
      setPlayerVolume(playerVolumeRef.current);
    });

    return () => {
      if (!selectedSource) return;

      setPlayingDataOnUnmount();
      setPlayerVolume(playerVolumeRef.current);

      window.removeEventListener("beforeunload", () => {
        setPlayingDataOnUnmount();
        setPlayerVolume(playerVolumeRef.current);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource && selectedSource?.proxySettings) {
      startProxy(selectedSource.proxySettings);
    } else {
      stopProxy();
    }
    return () => {
      stopProxy();
    };
  }, [selectedSource, startProxy, stopProxy]);

  useEffect(() => {
    selectedSubtitleLabel.current = "English 1";
    setSubtitles(selectedSource?.subtitles);
  }, [selectedSource?.subtitles]);

  const getSourceUrl = () => {
    if (!selectedSource) return "";
    let url = selectedSource.source.url;
    if (selectedSource.source.requiresBlob) {
      url = URL.createObjectURL(new Blob([url]));
    }
    if (selectedSource.proxySettings?.type === "m3u8") {
      return getM3U8ProxyUrl(url, selectedSource.proxySettings.referer);
    }
    if (selectedSource.proxySettings?.type === "mp4") {
      return getMP4ProxyUrl(url, selectedSource.proxySettings.referer);
    }
    return url;
  };

  const getThumbnails = () => {
    if (!selectedSource) return "";
    if (!selectedSource.thumbnails) return "";

    let url = selectedSource.thumbnails.url;
    if (selectedSource.thumbnails.requiresBlob) {
      url = URL.createObjectURL(new Blob([url]));
    }
    return url;
  };

  return (
    <MediaPlayer
      ref={player}
      title={title}
      // eslint-disable-next-line no-nested-ternary
      src={{
        src: getSourceUrl() ?? "",
        type:
          selectedSource?.type === "mp4"
            ? "video/mp4"
            : "application/x-mpegurl",
      }}
      crossorigin="anonymous"
      aspectRatio="16/9"
      autoplay
      onCanPlay={setupPlayer}
      onVolumeChange={(e) => {
        playerVolumeRef.current = e.volume;
      }}
      onTimeUpdate={(e) => {
        currentTimeRef.current = e.currentTime;
      }}
      onLoadedMetadata={(e) => {
        durationRef.current = e.target.state.duration;
      }}
      onTextTrackChange={async (e) => {
        if (!e?.src) return;
        if (selectedSource?.server !== "VidSrc Pro") return;

        const [language, count] = e?.label.split(" ") ?? [];
        const selectedCount = Number(count);
        if (!language || Number.isNaN(selectedCount)) return;

        const currentTrack = selectedSource.subtitles?.find((subtitle) => {
          return subtitle.label === language;
        });
        if (!currentTrack) return;

        getSubUrl(
          {
            url: currentTrack.file!,
          },
          {
            onSuccess: (res) => {
              const updatedTrack = { ...currentTrack, file: res };

              selectedSubtitleLabel.current = `${language} ${count}`;
              setSubtitles((prev) => {
                if (!prev) return [];
                const indexToUpdate = prev.findIndex((subtitle) => {
                  return subtitle.label === language;
                });
                if (indexToUpdate === -1) return prev;

                const updatedSubtitles = [...prev];
                updatedSubtitles[indexToUpdate] = updatedTrack;
                return updatedSubtitles;
              });
            },
          },
        );
      }}
    >
      <MediaProvider>
        {subtitles?.map((subtitle) => {
          const subtitleLanguage = getSubtitlePlayerLanguage(
            subtitle,
            languageCounts,
          );
          const labelName = `${subtitleLanguage.name} ${subtitleLanguage.count}`;
          return (
            <track
              src={subtitle.file}
              label={labelName}
              srcLang={`${subtitleLanguage.code}-${subtitleLanguage.count}`}
              kind="subtitles"
              default={labelName === selectedSubtitleLabel.current}
              key={subtitle.file}
              data-type={subtitle.file.endsWith(".vtt") ? "vtt" : "srt"}
            />
          );
        })}
      </MediaProvider>
      <DefaultVideoLayout
        thumbnails={getThumbnails()}
        icons={defaultLayoutIcons}
      />
      {(selectedSource?.subtitles || opensubtitlesData?.token) && (
        <SyncSubtitlesPopover />
      )}
      {opensubtitlesData?.token && (
        <SubtitleSelector tmdbId={tmdbId} season={season} episode={episode} />
      )}
    </MediaPlayer>
  );
};

export default Player;
