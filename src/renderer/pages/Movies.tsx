import { Heading, Spinner, VStack } from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { useDiscoverTMDB } from 'renderer/api/tmdb/api';
import SearchResults from 'renderer/components/SearchResults';
import ShowFilter, { FilterOptions } from 'renderer/components/ShowFilter';

const Movies: FC = () => {
  const [options, setOptions] = useState<FilterOptions>({
    genres: [],
    sortBy: 'popularity.desc',
    year: undefined,
    type: 'movie',
  });
  const { data, error, isLoading } = useDiscoverTMDB(
    {
      ...options,
    },
    'movie'
  );

  const callbackHandler = (opts: FilterOptions) => {
    setOptions(opts);
  };

  if (isLoading) return <Spinner />;
  if (error) return <div>{error.toString()}</div>;

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        Movies
      </Heading>
      <ShowFilter defaultShowType={options.type} callback={callbackHandler} />
      <SearchResults data={data} type={options.type} />
    </VStack>
  );
};

export default Movies;
