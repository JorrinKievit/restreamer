import { Grid, GridItem, AspectRatio, Image } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL } from 'renderer/api/tmdb/api';
import {
  DiscoverMovieResults,
  DiscoverTvShowsResults,
} from 'renderer/api/tmdb/discover.types';
import { SearchResponse } from 'renderer/api/tmdb/search.types';

interface SearchResultsProps {
  // TODO: fix types for discover and search
  data: SearchResponse | DiscoverMovieResults | DiscoverTvShowsResults;
  type: 'movie' | 'tv' | 'multi';
}

const SearchResults: FC<SearchResultsProps> = ({ data, type }) => {
  console.log(data);
  return (
    <Grid
      templateColumns={{
        base: 'repeat(2, 1fr)',
        md: 'repeat(6, 1fr)',
      }}
      gap={6}
    >
      {data?.results.map((show) => {
        return (
          show.poster_path && (
            <GridItem key={show.id}>
              <Link
                to={`/details/${show.id}?media_type=${
                  type === 'multi' ? show.media_type : type
                }`}
              >
                <AspectRatio ratio={2 / 3}>
                  <Image
                    src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                    alt={show.name}
                  />
                </AspectRatio>
                <div>{show.name ? show.name : show.title}</div>
              </Link>
            </GridItem>
          )
        );
      })}
    </Grid>
  );
};

export default SearchResults;
