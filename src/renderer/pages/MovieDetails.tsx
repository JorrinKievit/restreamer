import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Source } from 'types/sources';
import { useQuery } from 'renderer/hooks/useQuery';
import { ContentType } from 'types/tmbd';
import EpisodeList from 'renderer/components/EpisodeList';
import { Skeleton, useToast, Flex, VStack, Heading } from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { useLocalStorage } from 'renderer/hooks/useLocalStorage';
import SourceSelector from 'renderer/components/SourceSelector';
import ShowDetails from 'renderer/components/ShowDetails';
import { client } from 'renderer/api/trpc';
import VidstackPlayer from 'renderer/components/VidstackPlayer/VidstackPlayer';
import { useRequiredParams } from 'renderer/hooks/useRequiredParams';
import { getM3U8ProxyUrl, getMP4ProxyUrl } from 'renderer/lib/proxy';

const MovieDetails: FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useRequiredParams<{ id: string }>();
  const query = useQuery();
  const mediaType = query.get<ContentType>('media_type');

  const [playingData] = useLocalStorage<PlayingData>('playingData', {});

  const [activeEpisode, setActiveEpisode] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id]?.season ?? 1,
    episode: playingData[id]?.episode ?? 1,
  });

  const { mutate: launchVlc } = client.vlc.launch.useMutation();
  const { mutate: quitVlc } = client.vlc.quit.useMutation();
  const { mutateAsync: startProxy } = client.proxy.start.useMutation();
  const { mutate: stopProxy } = client.proxy.stop.useMutation();
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
      tmdbId: id,
      showName: (mediaType === 'tv' ? tvData?.name : movieData?.title) || '',
      type: mediaType,
      season: mediaType === 'tv' ? activeEpisode.season : undefined,
      episode: mediaType === 'tv' ? activeEpisode.episode : undefined,
    },
    {
      enabled: !!tvData || !!movieData,
    }
  );
  const [sources, setSources] = useState<Source[]>(sourcesData ?? []);
  client.app.getSourcesSubscription.useSubscription(undefined, {
    onData: (data: Source[]) => {
      if (!data || data.length === 0) return;
      setSources((prev) => [...prev, ...data]);
    },
  });

  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  const isLastEpisode = mediaType === 'tv' ? tvData?.seasons.find((s) => s.season_number === tvData.number_of_seasons)?.episode_count === activeEpisode.episode : false;

  useEffect(() => {
    if (sourcesData && (!sources || sources.length === 0)) setSources(sourcesData);

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
      if (!currentSeason) return;

      if (activeEpisode.episode < currentSeason.episode_count) {
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
      <Flex gap={4} flexDirection="column">
        {!selectedSource?.isVlc && (
          <VidstackPlayer
            selectedSource={selectedSource}
            title={mediaType === 'tv' ? `${tvData?.name} | Season ${activeEpisode.season} Episode ${activeEpisode.episode}` : movieData?.title}
            tmdbId={id}
            season={mediaType === 'tv' ? activeEpisode.season : undefined}
            episode={mediaType === 'tv' ? activeEpisode.episode : undefined}
            isLastEpisode={isLastEpisode}
          />
        )}
        {selectedSource && (
          <SourceSelector
            sources={sources}
            activeSource={selectedSource}
            selectSource={async (source) => {
              if (source.isVlc) {
                if (source.proxyType === 'none') {
                  launchVlc({ url: source.url });
                } else if (source.proxyType === 'mp4') {
                  await startProxy({ type: 'mp4' });
                  launchVlc({ url: getMP4ProxyUrl(source.url) });
                } else {
                  await startProxy({ type: 'm3u8', referer: source.referer });
                  launchVlc({ url: getM3U8ProxyUrl(source.url, source.referer) });
                }
              }
              setSelectedSource(source);
            }}
          />
        )}
      </Flex>
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
