import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Source } from "types/sources";
import { useQuery } from "renderer/hooks/useQuery";
import { ContentType } from "types/tmbd";
import { EpisodeList } from "renderer/components/episode-list";
import { PlayingData } from "types/localstorage";
import { useLocalStorage } from "renderer/hooks/useLocalStorage";
import { SourceSelector } from "renderer/components/player/source-selector";
import { ShowInformation } from "renderer/components/show-information";
import { client } from "renderer/api/trpc";
import Player from "renderer/components/player/player";
import { useRequiredParams } from "renderer/hooks/useRequiredParams";
import { getM3U8ProxyUrl, getMP4ProxyUrl } from "renderer/lib/proxy";
import { Skeleton } from "renderer/components/ui/skeleton";
import { useToast } from "renderer/components/ui/use-toast";

const ShowDetailsPage: FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useRequiredParams<{ id: string }>();
  const query = useQuery();
  const mediaType = query.get<ContentType>("media_type");

  const [playingData] = useLocalStorage<PlayingData>("playingData", {});

  const [activeEpisode, setActiveEpisode] = useState<{
    season: number;
    episode: number;
  }>({
    season: playingData[id]?.season ?? 1,
    episode: playingData[id]?.episode ?? 1,
  });

  const { mutate: launchVlc } = client.vlc.launch.useMutation();
  const { mutateAsync: startProxy } = client.proxy.start.useMutation();
  const { data: tvData, isInitialLoading: tvInitialLoading } =
    client.tmdb.tvShowDetails.useQuery(
      {
        tvShowId: mediaType === "tv" ? id : "",
      },
      {
        enabled: mediaType === "tv" && !!id,
      },
    );

  const { data: movieData, isInitialLoading: movieIsInitialLoading } =
    client.tmdb.movieDetails.useQuery(
      {
        movieId: mediaType === "movie" ? id : "",
      },
      {
        enabled: mediaType === "movie" && !!id,
      },
    );

  const { data: sourcesData, isLoading: sourcesLoading } =
    client.app.getSources.useQuery(
      {
        imdbId:
          (mediaType === "tv"
            ? tvData?.external_ids.imdb_id
            : movieData?.imdb_id) || "",
        tmdbId: id,
        showName: (mediaType === "tv" ? tvData?.name : movieData?.title) || "",
        type: mediaType,
        season: mediaType === "tv" ? activeEpisode.season : undefined,
        episode: mediaType === "tv" ? activeEpisode.episode : undefined,
      },
      {
        enabled: !!tvData || !!movieData,
      },
    );
  const [sources, setSources] = useState<Source[]>(sourcesData ?? []);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  client.app.getSourcesSubscription.useSubscription(undefined, {
    onData: (data) => {
      const d = data as Source[];
      if (sources && sources.length === 0) setSelectedSource(d[0]);
      setSources((prev) => [...prev, ...d]);
    },
  });

  const isLastEpisode =
    mediaType === "tv"
      ? tvData?.seasons.find(
          (s) => s.season_number === tvData.number_of_seasons,
        )?.episode_count === activeEpisode.episode
      : false;

  useEffect(() => {
    if (sourcesData && (!sources || sources.length === 0))
      setSources(sourcesData);

    if (sources && sources.length > 0 && !selectedSource) {
      setSelectedSource(sources[0]);
    }
  }, [sourcesData, sources, selectedSource]);

  useEffect(() => {
    if (!sourcesLoading && sourcesData && sourcesData.length === 0) {
      toast({
        title: "No sources found",
        description: "No sources found for this video",
        variant: "destructive",
      });

      if (mediaType === "movie") navigate(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesLoading, sourcesData]);

  useEffect(() => {
    const handleNextEpisode = () => {
      if (!tvData) return;
      const currentSeason = tvData.seasons.find(
        (s: { season_number: number }) =>
          s.season_number === activeEpisode.season,
      );
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

    document.addEventListener("next-episode", handleNextEpisode);

    return () => {
      document.removeEventListener("next-episode", handleNextEpisode);
    };
  }, [activeEpisode.episode, activeEpisode.season, tvData]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8">
        {!selectedSource?.isVlc && (
          <Player
            selectedSource={selectedSource}
            title={
              mediaType === "tv"
                ? `${tvData?.name} | Season ${activeEpisode.season} Episode ${activeEpisode.episode}`
                : movieData?.title
            }
            tmdbId={id}
            season={mediaType === "tv" ? activeEpisode.season : undefined}
            episode={mediaType === "tv" ? activeEpisode.episode : undefined}
            isLastEpisode={isLastEpisode}
          />
        )}
        {selectedSource && (
          <SourceSelector
            sources={sources}
            activeSource={selectedSource}
            selectSource={async (source) => {
              if (source.isVlc) {
                if (!source.proxySettings) {
                  launchVlc({ url: source.source.url });
                } else if (source.proxySettings?.type === "mp4") {
                  await startProxy({ type: "mp4" });
                  launchVlc({ url: getMP4ProxyUrl(source.source.url) });
                } else {
                  await startProxy({
                    type: "m3u8",
                    referer: source.proxySettings.referer,
                  });
                  launchVlc({
                    url: getM3U8ProxyUrl(
                      source.source.url,
                      source.proxySettings.referer,
                    ),
                  });
                }
              }
              setSelectedSource(source);
            }}
          />
        )}
      </div>
      {(tvInitialLoading || movieIsInitialLoading) && (
        <div className="flex w-full flex-col gap-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      )}
      {mediaType === "tv" && tvData && (
        <EpisodeList
          tvData={tvData}
          setActiveEpisode={setActiveEpisode}
          activeEpisode={activeEpisode}
        />
      )}
      {mediaType === "movie" && movieData && (
        <ShowInformation
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
      {mediaType === "tv" && tvData && (
        <ShowInformation
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
    </div>
  );
};

export { ShowDetailsPage };
