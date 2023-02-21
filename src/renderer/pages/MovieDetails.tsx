/* eslint-disable camelcase */
import React, { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sources } from 'types/sources';
import VideoPlayer from 'renderer/components/VideoPlayer';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import EpisodeList from 'renderer/components/EpisodeList';
import {
  Heading,
  Skeleton,
  useBoolean,
  useToast,
  Flex,
} from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import { useMovieDetails, useTvShowDetails } from 'renderer/api/tmdb/api';
import ErrorToast from 'renderer/components/ErrorToast';
import SourceSelector from 'renderer/components/SourceSelector';
import ShowDetails from 'renderer/components/ShowDetails';

const MovieDetails: FC = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useQuery();
  const mediaType = query.get('media_type')! as ContentType;

  const {
    data: tvData,
    isInitialLoading: tvInitialLoading,
    error: tvError,
  } = useTvShowDetails(mediaType === 'tv' ? id : undefined);

  const {
    data: movieData,
    isInitialLoading: movieIsInitialLoading,
    error: movieError,
  } = useMovieDetails(mediaType === 'movie' ? id : undefined);

  const [playingData] = useLocalStorage<PlayingData>('playingData', {});
  const [sourcesLoading, setSourcesLoading] = useBoolean(true);
  const [sources, setSources] = useState<Sources>([]);
  const [selectedSource, setSelectedSource] = useState(sources[0]);
  const [showDetails, setShowDetails] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id!]?.season ?? 1,
    episode: playingData[id!]?.episode ?? 1,
  });

  useEffect(() => {
    const getSources = async () => {
      const sourcesResponse = await window.electron.ipcRenderer.getSources(
        mediaType === 'tv' ? tvData?.external_ids.imdb_id : movieData?.imdb_id,
        mediaType === 'tv' ? tvData?.name : movieData?.title,
        mediaType,
        mediaType === 'tv' ? showDetails.season : undefined,
        mediaType === 'tv' ? showDetails.episode : undefined
      );
      setSources(sourcesResponse);
      setSelectedSource(sourcesResponse[0]);
    };
    setSourcesLoading.on();
    setSources([]);
    getSources().then(() => setSourcesLoading.off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    mediaType,
    movieData?.imdb_id,
    showDetails,
    tvData?.external_ids.imdb_id,
  ]);

  useEffect(() => {
    if (
      !tvInitialLoading &&
      !movieIsInitialLoading &&
      !sourcesLoading &&
      sources.length === 0
    ) {
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

  if (tvError || movieError)
    return (
      <ErrorToast
        description={
          tvError
            ? tvError.response?.data.status_message
            : movieError?.response?.data.status_message
        }
      />
    );

  return (
    <Flex flexDirection="column" gap={4}>
      {sourcesLoading && (
        <>
          <Skeleton height="500px" w="full" />
          <Skeleton height="50px" w="full" />
        </>
      )}
      {sources && sources[0] && (
        <Flex gap={4} flexDirection="column">
          <VideoPlayer
            selectedSource={selectedSource}
            tmdbId={id!}
            season={mediaType === 'tv' ? showDetails.season : undefined}
            episode={mediaType === 'tv' ? showDetails.episode : undefined}
            isLastEpisode={
              mediaType === 'tv'
                ? tvData?.seasons.find(
                    (s) => s.season_number === tvData.number_of_seasons
                  )?.episode_count === showDetails.episode
                : false
            }
          />
          <SourceSelector
            sources={sources}
            activeSource={selectedSource}
            selectSource={setSelectedSource}
          />
        </Flex>
      )}
      {mediaType === 'tv' && tvData && (
        <EpisodeList
          showData={tvData}
          showDetails={setShowDetails}
          activeEpisode={showDetails}
        />
      )}
      {mediaType === 'movie' && movieData && (
        <ShowDetails
          posterPath={movieData.poster_path}
          title={movieData.title}
          overview={movieData.overview}
          releaseDate={movieData.release_date}
          runtime={movieData.runtime}
          genres={movieData.genres}
          spokenLanguages={movieData.spoken_languages}
          cast={movieData.credits.cast}
          productionCompanies={movieData.production_companies}
          votingAverage={movieData.vote_average}
        />
      )}
      {mediaType === 'tv' && tvData && (
        <ShowDetails
          posterPath={tvData.poster_path}
          title={tvData.name}
          overview={tvData.overview}
          releaseDate={tvData.first_air_date}
          runtime={tvData.episode_run_time[0]}
          genres={tvData.genres}
          spokenLanguages={tvData.spoken_languages}
          cast={tvData.credits.cast}
          productionCompanies={tvData.production_companies}
          votingAverage={tvData.vote_average}
        />
      )}
      {(tvInitialLoading || movieIsInitialLoading) && (
        <Skeleton height="200px" w="full" />
      )}
    </Flex>
  );
};

export default MovieDetails;
