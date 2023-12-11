import React, { FC } from "react";
import { TMDB_IMAGE_BASE_URL } from "renderer/constants";
import { AspectRatio } from "./ui/aspect-ratio";
import { Badge } from "./ui/badge";

interface ShowInformationProps {
  posterPath: string;
  title: string;
  overview: string;
  releaseDate: string;
  runtime: number;
  genres: { name: string }[];
  spokenLanguages: { name: string }[];
  cast: { name: string; order: number }[];
  productionCompanies: { name: string }[];
  votingAverage: number;
}

const ShowInformation: FC<ShowInformationProps> = ({
  posterPath,
  title,
  overview,
  releaseDate,
  runtime,
  genres,
  spokenLanguages,
  cast,
  productionCompanies,
  votingAverage,
}) => {
  return (
    <div className="flex gap-4">
      <div
        style={{
          minWidth: "180px",
        }}
      >
        <AspectRatio ratio={2 / 3}>
          <img
            src={`${TMDB_IMAGE_BASE_URL}${posterPath}`}
            className="h-full object-cover"
            style={{
              minWidth: "180px",
            }}
          />
        </AspectRatio>
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">{title}</h1>
        <Badge variant="orange" className="w-[100px] text-base">
          TMDB: {votingAverage.toPrecision(2)}
        </Badge>
        <p>{overview}</p>
        <div className="grid grid-cols-2">
          <p>Release date: {releaseDate}</p>
          <p>Duration: {runtime} min</p>
          <p>Genres: {genres.map((g) => g.name).join(", ")}</p>
          <p>Languages: {spokenLanguages.map((l) => l.name).join(", ")}</p>
          <p>
            Casts:{" "}
            {cast
              .sort((c) => c.order)
              .map((c) => c.name)
              .slice(0, 3)
              .join(", ")}
          </p>
          <p>Production: {productionCompanies.map((c) => c.name).join(", ")}</p>
        </div>
      </div>
    </div>
  );
};

export { ShowInformation };
