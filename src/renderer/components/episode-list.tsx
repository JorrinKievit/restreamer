import { TvShowDetailsResults } from "main/api/tmdb/tvshow-details.types";
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface EpisodeListProps {
  tvData: TvShowDetailsResults & { episodeNames: string[][] };
  activeEpisode: {
    season: number;
    episode: number;
  };
  setActiveEpisode: Dispatch<
    SetStateAction<{
      season: number;
      episode: number;
    }>
  >;
}

const EpisodeList: FC<EpisodeListProps> = ({
  tvData,
  activeEpisode,
  setActiveEpisode,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(
    activeEpisode.season.toString(),
  );

  const currentSeason =
    tvData.seasons[0].season_number === 0
      ? tvData.seasons[+selectedSeason]
      : tvData.seasons[+selectedSeason - 1];
  const hasSpecial = tvData.seasons.some(
    (season) => season.season_number === 0,
  );
  const selectedSeasonIndex = hasSpecial
    ? +selectedSeason
    : +selectedSeason - 1;

  useEffect(() => {
    setSelectedSeason(activeEpisode.season.toString());
  }, [activeEpisode.season]);

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex w-full flex-col gap-4">
          <Select
            value={selectedSeason.toString()}
            onValueChange={setSelectedSeason}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              {tvData?.seasons.map((season) => (
                <SelectItem
                  value={season.season_number.toString()}
                  key={season.id}
                >
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from(
              { length: currentSeason.episode_count },
              (_, i) => i + 1,
            ).map((episodeNumber) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      key={`${selectedSeason}-${episodeNumber}}`}
                      onClick={() =>
                        setActiveEpisode({
                          season: currentSeason.season_number,
                          episode: episodeNumber,
                        })
                      }
                      disabled={
                        activeEpisode.season === currentSeason.season_number &&
                        activeEpisode.episode === episodeNumber
                      }
                    >
                      <span className="truncate">
                        {tvData.episodeNames?.[selectedSeasonIndex]?.[
                          episodeNumber - 1
                        ]
                          ? `Episode ${episodeNumber}: ${
                              tvData.episodeNames[selectedSeasonIndex][
                                episodeNumber - 1
                              ]
                            }`
                          : `Episode ${episodeNumber}`}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {tvData.episodeNames?.[selectedSeasonIndex]?.[
                        episodeNumber - 1
                      ]
                        ? `Episode ${episodeNumber}: ${
                            tvData.episodeNames[selectedSeasonIndex][
                              episodeNumber - 1
                            ]
                          }`
                        : `Episode ${episodeNumber}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { EpisodeList };
