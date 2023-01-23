import React, { Dispatch, FC, SetStateAction } from 'react';
import { useTvShowDetails } from 'renderer/api/tmdb/api';

interface TvShowDetailsProps {
  id: string;
  activeEpisode: {
    season: number;
    episode: number;
  };
  showDetails: Dispatch<
    SetStateAction<{
      season: number;
      episode: number;
    }>
  >;
}

const TvShowDetails: FC<TvShowDetailsProps> = ({
  id,
  activeEpisode,
  showDetails,
}) => {
  const { data, isLoading, error } = useTvShowDetails(id);

  if (isLoading) return <div>Loading...</div>;

  if (error) return <div>{error.toString()}</div>;

  return (
    <div className="py-6">
      {data?.seasons.map((season) => (
        <div
          className="collapse collapse-arrow border border-neutral bg-neutral rounded-box mt-4"
          key={season.id}
        >
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">
            <div>{season.name}</div>
          </div>
          <div className="collapse-content">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              {Array.from(
                { length: season.episode_count },
                (_, i) => i + 1
              ).map((episodeNumber) => (
                <button
                  key={`${season}-${episodeNumber}}`}
                  type="button"
                  className={`link ${
                    activeEpisode.season === season.season_number &&
                    activeEpisode.episode === episodeNumber
                      ? 'text-primary'
                      : ''
                  }`}
                  onClick={() =>
                    showDetails({
                      season: season.season_number,
                      episode: episodeNumber,
                    })
                  }
                >
                  Episode {episodeNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TvShowDetails;
