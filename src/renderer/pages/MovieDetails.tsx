/* eslint-disable camelcase */
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VidSrcResponse } from 'types/vidsrc';

import VideoPlayer from 'renderer/components/VideoPlayer';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import TvShowDetails from 'renderer/components/TvShowDetails';

const MovieDetails: FC = () => {
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

    getSources();
  }, [id, mediaType, showDetails]);

  return (
    <div>
      <VideoPlayer
        source={
          sources && sources[0]
            ? sources[0]
            : {
                url: '',
                server: '',
              }
        }
        tmdbId={id}
        season={mediaType === 'tv' ? showDetails.season : undefined}
        number={mediaType === 'tv' ? showDetails.episode : undefined}
        key="video"
      />
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
