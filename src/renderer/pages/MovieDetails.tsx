/* eslint-disable camelcase */
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VidSrcResponse } from 'types/vidsrc';

import VideoPlayer from 'renderer/components/VideoPlayer';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import TvShowDetails from 'renderer/components/TvShowDetails';
import { Spinner, useBoolean } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { useTvShowDetails } from 'renderer/api/tmdb/api';

const MovieDetails: FC = () => {
  const { id } = useParams();

  const query = useQuery();
  const mediaType = query.get('media_type') as ContentType;

  const { data, isLoading, error } = useTvShowDetails(id);

  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    'playingData',
    {}
  );

  const [sourcesLoading, setSourcesLoading] = useBoolean(false);
  const [sources, setSources] = useState<VidSrcResponse>([]);
  const [showDetails, setShowDetails] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id!]?.season || 1,
    episode: playingData[id!]?.episode || 1,
  });

  useEffect(() => {
    const getSources = async () => {
      const vidSrcSources = await window.electron.ipcRenderer.getVidSrc(
        id!,
        mediaType,
        mediaType === 'tv' ? showDetails.season : undefined,
        mediaType === 'tv' ? showDetails.episode : undefined
      );
      setSources(vidSrcSources);
    };
    setSourcesLoading.toggle();
    // eslint-disable-next-line promise/catch-or-return
    getSources().then(() => setSourcesLoading.toggle());

    setPlayingData({
      ...playingData,
      [id!]: {
        season: mediaType === 'tv' ? showDetails.season : undefined,
        episode: mediaType === 'tv' ? showDetails.episode : undefined,
        playingTime: playingData[id!]?.playingTime,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mediaType, showDetails, setSourcesLoading]);

  if (isLoading || sourcesLoading) return <Spinner />;

  console.log(data);

  return (
    <div>
      {sources && sources[0] ? (
        <VideoPlayer
          sources={sources}
          tmdbId={id!}
          season={mediaType === 'tv' ? showDetails.season : undefined}
          episode={mediaType === 'tv' ? showDetails.episode : undefined}
          key="video"
          isLastEpisode={
            data?.seasons.find(
              (s) => s.season_number === data.number_of_seasons
            )?.episode_count === showDetails.episode
          }
        />
      ) : (
        <div>No sources found</div>
      )}
      {mediaType === 'tv' && data && (
        <TvShowDetails
          showData={data}
          showDetails={setShowDetails}
          activeEpisode={showDetails}
        />
      )}
    </div>
  );
};

export default MovieDetails;
