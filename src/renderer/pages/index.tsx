import { FC, useState } from "react";
import { PlayingData } from "types/localstorage";
import { Link as RouterLink } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";
import { SkeletonGrid } from "renderer/components/layout/loaders/skeleton-grid";
import NotFoundImage from "renderer/assets/undraw_page_not_found.svg";
import { client } from "renderer/api/trpc";
import { TMDB_IMAGE_BASE_URL } from "renderer/constants";
import { Eye, Trash2 } from "lucide-react";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

const Index: FC = () => {
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    "playingData",
    {},
  );
  const [blurId, setBlurId] = useState<number | undefined>();

  const { data, isInitialLoading } = client.tmdb.getShowsById.useQuery({
    playingData,
  });

  if (isInitialLoading) return <SkeletonGrid />;

  return (
    <div className="flex flex-col gap-4">
      <>
        <h1 className="w-full text-center text-4xl font-bold">
          Continue watching
        </h1>
        <Separator />

        {data && data.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-5">
            {data.map((show) => {
              let runtime = playingData[show.id].duration;
              if (!runtime)
                runtime =
                  show.media_type === "tv"
                    ? show.episode_run_time[0]
                    : show.runtime;
              const progress = Math.floor(
                (playingData[show.id].playingTime / 60 / runtime) * 100,
              );
              return (
                show.poster_path && (
                  <div key={show.id} className="relative">
                    <RouterLink
                      to={`/shows/${show.id}?media_type=${show.media_type}`}
                    >
                      <AspectRatio
                        ratio={2 / 3}
                        className="transition duration-150 ease-in-out hover:opacity-90 hover:backdrop-blur-md"
                      >
                        <div
                          className="relative"
                          onMouseEnter={() => setBlurId(show.id)}
                          onMouseLeave={() => setBlurId(undefined)}
                        >
                          <img
                            key={show.id}
                            src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                            alt={
                              show.media_type === "tv" ? show.name : show.title
                            }
                            className={cn({
                              "blur-sm filter": blurId === show.id,
                            })}
                          />
                          {blurId && (
                            <div className="absolute top-0 h-full w-full opacity-0 transition duration-150 ease-in-out hover:opacity-100">
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute right-2 top-2"
                                aria-label="Delete show from list"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  const newPlayingData = {
                                    ...playingData,
                                  };
                                  delete newPlayingData[show.id];
                                  setPlayingData(newPlayingData);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="flex h-full w-full flex-col items-center justify-center">
                                <Button
                                  size="icon"
                                  className={cn({
                                    "mt-5": show.media_type === "tv",
                                  })}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {show.media_type === "tv" && (
                                  <p className="font-bold text-white">
                                    Season {playingData[show.id].season} Episode{" "}
                                    {playingData[show.id].episode}
                                  </p>
                                )}
                                <p className="font-bold text-white">
                                  {(
                                    playingData[show.id].playingTime / 60
                                  ).toFixed(0)}{" "}
                                  / {runtime ?? "NaN"} min
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </AspectRatio>
                      <div className="mt-1 flex flex-col gap-1">
                        <Progress value={progress} className="w-full" />
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <p className="w-full truncate text-left">
                                {show.media_type === "tv"
                                  ? show.name
                                  : show.title}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-full truncate text-left">
                                {show.media_type === "tv"
                                  ? show.name
                                  : show.title}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex w-full">
                          <p className="flex-1">
                            {new Date(
                              show.media_type === "tv"
                                ? show.first_air_date
                                : show.release_date,
                            ).getFullYear() || "N/A"}
                          </p>
                          <Badge>
                            {show.media_type === "tv" ? "TV" : "Movie"}
                          </Badge>
                        </div>
                      </div>
                    </RouterLink>
                  </div>
                )
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <img
              src={NotFoundImage}
              alt="Not found"
              style={{ maxWidth: "60%" }}
            />
            <p className="text-2xl">
              You haven&apos;t watched anything yet. Go to the{" "}
              <RouterLink to="/shows/discover/movie">Movies</RouterLink> or{" "}
              <RouterLink to="/shows/discover/tv">TV Shows</RouterLink> page to
              find something to watch.
            </p>
          </div>
        )}
      </>
    </div>
  );
};

export { Index };
