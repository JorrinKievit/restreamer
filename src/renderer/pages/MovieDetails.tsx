import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Source, Sources } from 'types/sources';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import EpisodeList from 'renderer/components/EpisodeList';
import { Skeleton, useToast, Flex, VStack } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import SourceSelector from 'renderer/components/SourceSelector';
import ShowDetails from 'renderer/components/ShowDetails';
import { client } from 'renderer/api/trpc';
import VidstackPlayer from 'renderer/components/VidstackPlayer/VidstackPlayer';

const MovieDetails: FC = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useQuery();
  const mediaType = query.get('media_type')! as ContentType;

  const [playingData] = useLocalStorage<PlayingData>('playingData', {});

  const [activeEpisode, setActiveEpisode] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id!]?.season ?? 1,
    episode: playingData[id!]?.episode ?? 1,
  });

  const { data: tvData, isInitialLoading: tvInitialLoading } = client.tmdb.tvShowDetails.useQuery(
    {
      tvShowId: mediaType === 'tv' ? id : '',
    },
    {
      enabled: mediaType === 'tv' && !!id,
    }
  );

  const { data: movieData, isInitialLoading: movieIsInitialLoading } = client.tmdb.movieDetails.useQuery(
    {
      movieId: mediaType === 'movie' ? id : '',
    },
    {
      enabled: mediaType === 'movie' && !!id,
    }
  );

  const { data: sourcesData, isLoading: sourcesLoading } = client.app.getSources.useQuery(
    {
      imdbId: (mediaType === 'tv' ? tvData?.external_ids.imdb_id : movieData?.imdb_id) || '',
      showName: (mediaType === 'tv' ? tvData?.name : movieData?.title) || '',
      type: mediaType,
      season: mediaType === 'tv' ? activeEpisode.season : undefined,
      episode: mediaType === 'tv' ? activeEpisode.episode : undefined,
    },
    {
      enabled: !!tvData || !!movieData,
    }
  );
  const [sources, setSources] = useState<Sources>(sourcesData ?? []);
  client.app.getSourcesSubscription.useSubscription(undefined, {
    onData: (data: Sources) => {
      setSources((prev) => [...prev, ...data]);
    },
  });

  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const isLastEpisode = mediaType === 'tv' ? tvData?.seasons.find((s) => s.season_number === tvData.number_of_seasons)?.episode_count === activeEpisode.episode : false;

  useEffect(() => {
    if (sources && sources.length > 0 && !selectedSource) {
      setSelectedSource(sources[0]);
    }
  }, [sourcesData, sources, selectedSource]);

  useEffect(() => {
    if (!sourcesLoading && sourcesData && sourcesData.length === 0) {
      toast({
        title: 'No sources found',
        description: 'No sources found for this video',
        status: 'error',
      });

      if (mediaType === 'movie') navigate(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesLoading, sourcesData]);

  useEffect(() => {
    const handleNextEpisode = () => {
      if (!tvData) return;
      const currentSeason = tvData.seasons.find((s: { season_number: number }) => s.season_number === activeEpisode.season);

      if (activeEpisode.episode < currentSeason!.episode_count) {
        setActiveEpisode({
          season: activeEpisode.season,
          episode: activeEpisode.episode + 1,
        });
      } else {
        setActiveEpisode({
          season: activeEpisode.season + 1,
          episode: 1,
        });
      }
    };

    setSources([]);
    setSelectedSource(null);

    document.addEventListener('next-episode', handleNextEpisode);

    return () => {
      document.removeEventListener('next-episode', handleNextEpisode);
    };
  }, [activeEpisode.episode, activeEpisode.season, tvData]);

  return (
    <Flex flexDirection="column" gap={4}>
      {sourcesLoading && sources.length === 0 && (
        <>
          <Skeleton height="700px" w="full" />
          <Flex height="50px" w="full" alignItems="center" justifyContent="center" gap={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <Skeleton key={i} h="full" w="200px" borderRadius="0.375rem" />
            ))}
          </Flex>
        </>
      )}
      {selectedSource && (
        <Flex gap={4} flexDirection="column">
          <VidstackPlayer
            selectedSource={selectedSource}
            title={mediaType === 'tv' ? `${tvData?.name} | Season ${activeEpisode.season} Episode ${activeEpisode.episode}` : movieData?.title}
            tmdbId={id!}
            season={mediaType === 'tv' ? activeEpisode.season : undefined}
            episode={mediaType === 'tv' ? activeEpisode.episode : undefined}
            isLastEpisode={isLastEpisode}
          />
          <SourceSelector sources={sources} activeSource={selectedSource} selectSource={setSelectedSource} />
        </Flex>
      )}
      {(tvInitialLoading || movieIsInitialLoading) && (
        <VStack gap={4} w="full">
          <Skeleton height="200px" w="full" />
          <Skeleton height="200px" w="full" />
        </VStack>
      )}
      {mediaType === 'tv' && tvData && <EpisodeList tvData={tvData} setActiveEpisode={setActiveEpisode} activeEpisode={activeEpisode} />}
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
    </Flex>
  );
};

export default MovieDetails;
