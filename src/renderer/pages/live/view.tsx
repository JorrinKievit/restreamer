import { MediaCommunitySkin, MediaOutlet, MediaPlayer } from '@vidstack/react';
import React, { FC, useEffect } from 'react';
import { client } from 'renderer/api/trpc';
import { useQuery } from 'renderer/hooks/useQuery';
import { getProxyUrl } from 'renderer/lib/proxy';

const LiveViewPage: FC = () => {
  const query = useQuery();
  const url = decodeURIComponent(query.get<string>('url'));

  const liveUrl = client.live.getLiveUrl.useQuery(
    { url },
    {
      enabled: !!url,
    }
  );

  const { mutate: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();

  useEffect(() => {
    if (liveUrl.data?.requiresProxy && liveUrl.data?.referer) {
      startProxy({ referer: liveUrl.data.referer });
    } else {
      stopProxy();
    }
    return () => {
      stopProxy();
    };
  }, [liveUrl.data, startProxy, stopProxy]);

  return liveUrl.data?.url ? (
    <MediaPlayer src={{ src: getProxyUrl(liveUrl.data.url, liveUrl.data.referer), type: 'application/x-mpegurl' }} aspectRatio={16 / 9} crossorigin="anonymous" autoplay streamType="live">
      <MediaOutlet />
      <MediaCommunitySkin />
    </MediaPlayer>
  ) : null;
};

export default LiveViewPage;
