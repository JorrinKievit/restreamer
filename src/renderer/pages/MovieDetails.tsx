/* eslint-disable camelcase */
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VidSrcResponse } from 'types/vidsrc';

import VideoPlayer from 'renderer/components/VideoPlayer';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import TvShowDetails from 'renderer/components/TvShowDetails';
import { Spinner, useBoolean } from '@chakra-ui/react';

const MovieDetails: FC = () => {
  const [isLoading, setIsLoading] = useBoolean(false);
  const [sources, setSources] = useState<VidSrcResponse>([]);
  const [showDetails, setShowDetails] = useState<{
    season: number;
    episode: number;
  }>({
    season: 1,
    episode: 1,
  });
  const { id } = useParams();
  const query = useQuery();

  const mediaType = query.get('media_type') as ContentType;

  useEffect(() => {
    const getSources = async () => {
      const vidSrcSources = await window.electron.ipcRenderer.getVidSrc(
        id,
        mediaType,
        mediaType === 'tv' ? showDetails.season : undefined,
        mediaType === 'tv' ? showDetails.episode : undefined
      );
      setSources(vidSrcSources);
    };
    setIsLoading.toggle();
    // eslint-disable-next-line promise/catch-or-return
    getSources().then(() => setIsLoading.toggle());
  }, [id, mediaType, showDetails, setIsLoading]);

  if (isLoading) return <Spinner />;

  console.log(sources);

  return (
    <div>
      {sources && sources[0] ? (
        <VideoPlayer
          sources={sources}
          tmdbId={id}
          season={mediaType === 'tv' ? showDetails.season : undefined}
          number={mediaType === 'tv' ? showDetails.episode : undefined}
          key="video"
        />
      ) : (
        <div>No sources found</div>
      )}
      {mediaType === 'tv' && (
        <TvShowDetails
          id={id}
          showDetails={setShowDetails}
          activeEpisode={showDetails}
        />
      )}
    </div>
  );
};

export default MovieDetails;
