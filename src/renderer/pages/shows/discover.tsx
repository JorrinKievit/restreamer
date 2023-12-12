import React, { FC, useEffect, useState } from "react";
import ShowFilter, { FilterOptions } from "renderer/components/show-filters";
import { Link } from "react-router-dom";
import { SkeletonGrid } from "renderer/components/layout/loaders/skeleton-grid";
import { Pagination } from "renderer/components/pagination";
import { client } from "renderer/api/trpc";
import { TMDB_IMAGE_BASE_URL } from "renderer/constants";
import { Separator } from "renderer/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "renderer/components/ui/tooltip";
import { AspectRatio } from "renderer/components/ui/aspect-ratio";
import { Badge } from "renderer/components/ui/badge";
import { useRequiredParams } from "renderer/hooks/useRequiredParams";
import { ContentType } from "types/tmbd";

const DiscoverPage: FC = () => {
  const params = useRequiredParams<{
    mediaType: ContentType;
  }>();

  const [options, setOptions] = useState<FilterOptions>({
    genres: [],
    sortBy: "popularity.desc",
    year: undefined,
    type: params.mediaType,
    page: 1,
  });

  const { data, isLoading } = client.tmdb.discover.useQuery({
    options: {
      genres: options.genres,
      sortBy: options.sortBy,
      year: options.year,
      page: options.page,
    },
    type: options.type,
  });

  const callbackHandler = (opts: FilterOptions) => {
    setOptions(opts);
  };

  const onPageChange = (page: number) => {
    setOptions({ ...options, page });
  };

  useEffect(() => {
    setOptions({ ...options, type: params.mediaType });
  }, [params.mediaType]);

  return (
    <div className="flex flex-col gap-4">
      <ShowFilter defaultShowType={options.type} callback={callbackHandler} />
      <Separator />
      {isLoading && <SkeletonGrid />}
      {data && (
        <>
          <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-5">
            {data.results.map((show) => {
              return (
                show.poster_path && (
                  <div key={show.id}>
                    <Link to={`/shows/${show.id}?media_type=movie`}>
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
                          <Badge>
                            {show.media_type === "tv" ? "TV" : "Movie"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              );
            })}
          </div>
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages > 500 ? 500 : data.total_pages}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
};

export { DiscoverPage };
