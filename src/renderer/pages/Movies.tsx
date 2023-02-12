import {
  AspectRatio,
  Flex,
  Grid,
  GridItem,
  Heading,
  Tag,
  Tooltip,
  VStack,
  Image,
  Text,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { TMDB_IMAGE_BASE_URL, useDiscoverTMDB } from 'renderer/api/tmdb/api';
import ShowFilter, { FilterOptions } from 'renderer/components/ShowFilter';
import { Link } from 'react-router-dom';
import ErrorToast from 'renderer/components/ErrorToast';
import SkeletonGrid from 'renderer/components/SkeletonGrid';

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

  if (error)
    return <ErrorToast description={error.response?.data.status_message} />;

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        Movies
      </Heading>
      <ShowFilter defaultShowType={options.type} callback={callbackHandler} />

      {isLoading ? (
        <SkeletonGrid />
      ) : (
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
                  <Link to={`/details/${show.id}?media_type=movie`}>
                    <AspectRatio ratio={2 / 3}>
                      <Image
                        src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                        alt={show.name}
                      />
                    </AspectRatio>
                    <VStack mt={1}>
                      <Tooltip label={show.title}>
                        <Text w="full" textAlign="left" noOfLines={1}>
                          {show.title}
                        </Text>
                      </Tooltip>
                      <Flex w="full">
                        <Text flex="1">
                          {new Date(
                            show.release_date
                              ? show.release_date
                              : show.first_air_date
                          ).getFullYear()}
                        </Text>
                        <Tag colorScheme="blue">Movie</Tag>
                      </Flex>
                    </VStack>
                  </Link>
                </GridItem>
              )
            );
          })}
        </Grid>
      )}
    </VStack>
  );
};

export default Movies;
