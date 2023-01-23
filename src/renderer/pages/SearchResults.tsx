import React, { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from 'renderer/components/Loading';
import {
  TMDB_IMAGE_BASE_URL,
  useSearchMoviesAndShows,
} from 'renderer/api/tmdb/api';

const SearchResults: FC = () => {
  const { query } = useParams();

  const { data, error, isLoading } = useSearchMoviesAndShows(query);

  if (isLoading) return <Loading />;

  if (error) {
    return <div>{error.toString()}</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
      {data?.results.map((movie) => {
        return (
          movie.poster_path && (
            <Link
              key={movie.id}
              to={`/details/${movie.id}?media_type=${movie.media_type}`}
            >
              <img
                src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
                alt={movie.name}
                style={{ width: 150 }}
              />
              <div>{movie.name ? movie.name : movie.title}</div>
            </Link>
          )
        );
      })}
    </div>
  );
};

export default SearchResults;
