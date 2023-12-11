import React, { FC, useEffect, useState } from "react";
import { client } from "renderer/api/trpc";
import { SkeletonGrid } from "renderer/components/layout/loaders/skeleton-grid";
import { Link } from "react-router-dom";
import { LiveMainPage } from "types/sources";
import { StarIcon } from "@chakra-ui/icons";
import { useLocalStorage } from "usehooks-ts";
import { Input } from "renderer/components/ui/input";
import { AspectRatio } from "renderer/components/ui/aspect-ratio";
import { Button } from "renderer/components/ui/button";
import { Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "renderer/components/ui/tooltip";
import { Separator } from "renderer/components/ui/separator";
import { cn } from "renderer/lib/utils";

const LiveGridItem: FC<{
  item: LiveMainPage;
  isFavorite: boolean;
  toggleFavorite: () => void;
}> = ({ item, isFavorite, toggleFavorite }) => {
  return (
    <div key={item.url} className="h-40 w-32 border">
      <Link to={`/live/view?url=${encodeURIComponent(item.url)}`}>
        <AspectRatio className="hover:bg-black hover:opacity-50">
          <>
            <img src={item.imgSrc} alt={item.title} className="h-full w-full" />
            <div className="absolute top-0 h-full w-full opacity-0 transition duration-150 ease-in-out hover:opacity-100">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite();
                }}
                className="absolute right-2 top-2"
              >
                <Star
                  size={20}
                  className={cn(
                    {
                      "fill-current": isFavorite,
                    },
                    "text-yellow-400",
                  )}
                />
              </Button>
            </div>
          </>
        </AspectRatio>
        <div className="mt-1 flex flex-col">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="w-full truncate text-left">{item.title}</p>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Link>
    </div>
  );
};

const LiveListPage: FC = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<LiveMainPage[]>([]);
  const mainPageData = client.live.getMainPage.useQuery();

  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "liveFavorites",
    [],
  );

  useEffect(() => {
    if (!mainPageData.data) return;
    setData(mainPageData.data);
  }, [mainPageData.data]);

  const filteredData = data
    .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => !favorites.includes(item.url));

  const toggleFavorite = (url: string) => {
    if (favorites.includes(url)) {
      setFavorites(favorites.filter((f) => f !== url));
    } else {
      setFavorites([...favorites, url]);
    }
  };

  const favoriteData = data.filter((d) => favorites.includes(d.url));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="w-full text-2xl font-bold">Favorites</h1>
      <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-6">
        {favoriteData.map((d) => (
          <LiveGridItem
            key={d.url}
            item={d}
            isFavorite
            toggleFavorite={() => toggleFavorite(d.url)}
          />
        ))}
      </div>
      <Separator />
      <h1 className="w-full text-2xl font-bold">Live</h1>
      <Input
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {mainPageData.isLoading && <SkeletonGrid />}
      <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-6">
        {filteredData.map((d) => (
          <LiveGridItem
            key={d.url}
            item={d}
            isFavorite={favorites.includes(d.url)}
            toggleFavorite={() => toggleFavorite(d.url)}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveListPage;
