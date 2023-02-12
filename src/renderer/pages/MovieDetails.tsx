/* eslint-disable camelcase */
import React, { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sources } from 'types/sources';
import VideoPlayer from 'renderer/components/VideoPlayer';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import TvShowDetails from 'renderer/components/TvShowDetails';
import { Skeleton, useBoolean, useToast } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { useTvShowDetails } from 'renderer/api/tmdb/api';
import ErrorToast from 'renderer/components/ErrorToast';
import SourceSelector from 'renderer/components/SourceSelector';

const MovieDetails: FC = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useQuery();
  const mediaType = query.get('media_type')! as ContentType;

  const { data, isInitialLoading, error } = useTvShowDetails(
    mediaType === 'tv' ? id : undefined
  );
  const [playingData] = useLocalStorage<PlayingData>('playingData', {});
  const [sourcesLoading, setSourcesLoading] = useBoolean(true);
  const [sources, setSources] = useState<Sources>([]);
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [showDetails, setShowDetails] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id!]?.season || 1,
    episode: playingData[id!]?.episode || 1,
  });

  useEffect(() => {
    const getSources = async () => {
      const sourcesResponse = await window.electron.ipcRenderer.getSources(
        id!,
        mediaType,
        mediaType === 'tv' ? showDetails.season : undefined,
        mediaType === 'tv' ? showDetails.episode : undefined
      );
      setSources(sourcesResponse);
      setSelectedSource(sourcesResponse[0]);
    };
    setSourcesLoading.on();
    setSources([]);
    // eslint-disable-next-line promise/catch-or-return
    getSources().then(() => setSourcesLoading.off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mediaType, showDetails]);

  useEffect(() => {
    if (!sourcesLoading && sources.length === 0) {
      toast({
        title: 'No sources found',
        description: 'No sources found for this video',
        status: 'error',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
      });

      if (mediaType === 'movie') navigate(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesLoading, sources]);

  if (error)
    return <ErrorToast description={error.response?.data.status_message} />;

  return (
    <div>
      {sourcesLoading && <Skeleton height="500px" w="full" />}
      {sources && sources[0] && (
        <>
          <VideoPlayer
            selectedSource={selectedSource}
            tmdbId={id!}
            season={mediaType === 'tv' ? showDetails.season : undefined}
            episode={mediaType === 'tv' ? showDetails.episode : undefined}
            isLastEpisode={
              data?.seasons.find(
                (s) => s.season_number === data.number_of_seasons
              )?.episode_count === showDetails.episode
            }
          />
          <SourceSelector
            sources={sources}
            activeSource={selectedSource}
            selectSource={setSelectedSource}
          />
        </>
      )}
      {isInitialLoading && <Skeleton height="200px" w="full" />}
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
