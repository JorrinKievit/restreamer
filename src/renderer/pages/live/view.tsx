import {
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import React, { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "renderer/api/trpc";
import { SourceSelector } from "renderer/components/player/source-selector";
import { useToast } from "renderer/components/ui/use-toast";
import { useQuery } from "renderer/hooks/useQuery";
import { getM3U8ProxyUrl } from "renderer/lib/proxy";
import { Source } from "types/sources";
import { useLocalStorage } from "usehooks-ts";

const LiveViewPage: FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const player = useRef<MediaPlayerInstance>(null);
  const query = useQuery();
  const url = decodeURIComponent(query.get<string>("url"));

  const [playerVolume, setPlayerVolume] = useLocalStorage<number>(
    "playerVolume",
    1,
  );

  const { data, isLoading } = client.live.getLiveUrl.useQuery(
    { url },
    {
      enabled: !!url,
    },
  );

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();

  const [sources, setSources] = useState<Source[]>(data ?? []);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  useEffect(() => {
    if (data && (!sources || sources.length === 0)) setSources(data);

    if (sources && sources.length > 0 && !selectedSource) {
      setSelectedSource(sources[0]);
    }
  }, [data, sources, selectedSource]);

  useEffect(() => {
    if (!isLoading && data && data.length === 0) {
      toast({
        title: "No sources found",
        description: "No sources found for this video",
        variant: "destructive",
      });

      navigate(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, data]);

  useEffect(() => {
    if (selectedSource && selectedSource.proxySettings) {
      startProxy(selectedSource.proxySettings);
    } else {
      stopProxy();
    }
    return () => {
      stopProxy();
    };
  }, [selectedSource, startProxy, stopProxy]);

  useEffect(() => {
    return () => {
      setSelectedSource(null);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {selectedSource && (
        <MediaPlayer
          ref={player}
          src={{
            src: selectedSource.proxySettings
              ? getM3U8ProxyUrl(
                  selectedSource.source.url,
                  selectedSource.proxySettings?.referer,
                )
              : selectedSource.source.url,
            type: "application/x-mpegurl",
          }}
          aspectRatio="16/9"
          crossorigin="anonymous"
          autoplay
          streamType="live"
          // volume={playerVolume}
          // onVolumeChange={(e) => {
          //   if (!e.volume) return;
          //   setPlayerVolume(e.volume);
          // }}
        >
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      )}
      {selectedSource && (
        <SourceSelector
          sources={sources}
          activeSource={selectedSource}
          selectSource={setSelectedSource}
        />
      )}
    </div>
  );
};

export default LiveViewPage;
