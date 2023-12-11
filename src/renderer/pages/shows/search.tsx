import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import { SkeletonGrid } from "renderer/components/layout/loaders/skeleton-grid";
import { client } from "renderer/api/trpc";
import { TMDB_IMAGE_BASE_URL } from "renderer/constants";
import { AspectRatio } from "renderer/components/ui/aspect-ratio";
import { Badge } from "renderer/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "renderer/components/ui/tooltip";

const SearchPage: FC = () => {
  const { query } = useParams();

  const { data, isLoading } = client.tmdb.search.useQuery(
    {
      query,
    },
    { enabled: !!query },
  );

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
      {data?.results.map((show) => {
        return (
          show.poster_path && (
            <div key={show.id}>
              <Link to={`/shows/${show.id}?media_type=${show.media_type}`}>
                <AspectRatio ratio={2 / 3}>
                  <img
                    src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                    alt={show.name}
                  />
                </AspectRatio>
                <div className="mt-1 flex flex-col">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="w-full truncate text-left">
                          {show.name ? show.name : show.title}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{show.name ? show.name : show.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex w-full">
                    <p className="flex-1">
                      {new Date(
                        show.release_date
                          ? show.release_date
                          : show.first_air_date,
                      ).getFullYear() || "N/A"}
                    </p>
                    <Badge>{show.media_type === "tv" ? "TV" : "Movie"}</Badge>
                  </div>
                </div>
              </Link>
            </div>
          )
        );
      })}
    </div>
  );
};

export { SearchPage };
