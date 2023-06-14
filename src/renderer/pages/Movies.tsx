import { AspectRatio, Flex, Grid, GridItem, Heading, Tag, Tooltip, VStack, Image, Text } from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import ShowFilter, { FilterOptions } from 'renderer/components/ShowFilter';
import { Link } from 'react-router-dom';
import SkeletonGrid from 'renderer/components/SkeletonGrid';
import Pagination from 'renderer/components/Pagination';
import { client } from 'renderer/api/trpc';
import { TMDB_IMAGE_BASE_URL } from 'renderer/constants';

const Movies: FC = () => {
  const [options, setOptions] = useState<FilterOptions>({
    genres: [],
    sortBy: 'popularity.desc',
    year: undefined,
    type: 'movie',
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

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        Movies
      </Heading>
      <ShowFilter defaultShowType={options.type} callback={callbackHandler} />
      {isLoading && <SkeletonGrid />}
      {data && (
        <>
          <Grid
            templateColumns={{
              base: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)',
            }}
            gap={6}
            w="full"
          >
            {data.results.map((show) => {
              return (
                show.poster_path && (
                  <GridItem key={show.id}>
                    <Link to={`/details/${show.id}?media_type=movie`}>
                      <AspectRatio ratio={2 / 3}>
                        <Image src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`} alt={show.name} />
                      </AspectRatio>
                      <VStack mt={1}>
                        <Tooltip label={show.title}>
                          <Text w="full" textAlign="left" noOfLines={1}>
                            {show.title}
                          </Text>
                        </Tooltip>
                        <Flex w="full">
                          <Text flex="1">{new Date(show.release_date ? show.release_date : show.first_air_date).getFullYear() || 'N/A'}</Text>
                          <Tag colorScheme="blue">Movie</Tag>
                        </Flex>
                      </VStack>
                    </Link>
                  </GridItem>
                )
              );
            })}
          </Grid>
          <Pagination currentPage={data.page} totalPages={data.total_pages > 500 ? 500 : data.total_pages} onPageChange={onPageChange} />
        </>
      )}
    </VStack>
  );
};

export default Movies;
