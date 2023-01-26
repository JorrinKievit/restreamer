import { VStack, Heading, Spinner } from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { useDiscoverTMDB } from 'renderer/api/tmdb/api';
import SearchResults from 'renderer/components/SearchResults';
import ShowFilter, { FilterOptions } from 'renderer/components/ShowFilter';

const TvShows: FC = () => {
  const [options, setOptions] = useState<FilterOptions>({
    genres: [],
    sortBy: 'popularity.desc',
    year: undefined,
    type: 'tv',
  });
  const { data, error, isLoading } = useDiscoverTMDB(
    {
      ...options,
    },
    'tv'
  );

  const callbackHandler = (opts: FilterOptions) => {
    setOptions(opts);
  };

  if (isLoading) return <Spinner />;
  if (error) return <div>{error.toString()}</div>;

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        TV Shows
      </Heading>
      <ShowFilter defaultShowType={options.type} callback={callbackHandler} />
      <SearchResults data={data} type={options.type} />
    </VStack>
  );
};

export default TvShows;
