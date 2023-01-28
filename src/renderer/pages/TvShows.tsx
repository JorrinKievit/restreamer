import {
  VStack,
  Heading,
  Spinner,
  AspectRatio,
  Flex,
  Grid,
  GridItem,
  Tag,
  Tooltip,
  Image,
  Text,
} from '@chakra-ui/react';
import React, { FC, useState } from 'react';
import { TMDB_IMAGE_BASE_URL, useDiscoverTMDB } from 'renderer/api/tmdb/api';
import ShowFilter, { FilterOptions } from 'renderer/components/ShowFilter';
import { Link } from 'react-router-dom';

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
      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(6, 1fr)',
        }}
        gap={6}
        w="full"
      >
        {data?.results.map((show) => {
          return (
            show.poster_path && (
              <GridItem key={show.id}>
                <Link to={`/details/${show.id}?media_type=tv`}>
                  <AspectRatio ratio={2 / 3}>
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                      alt={show.name}
                    />
                  </AspectRatio>
                  <VStack mt={1}>
                    <Tooltip label={show.name}>
                      <Text w="full" textAlign="left" noOfLines={1}>
                        {show.name}
                      </Text>
                    </Tooltip>
                    <Flex w="full">
                      <Text flex="1">
                        {new Date(show.first_air_date).getFullYear()}
                      </Text>
                      <Tag colorScheme="blue">TV</Tag>
                    </Flex>
                  </VStack>
                </Link>
              </GridItem>
            )
          );
        })}
      </Grid>
    </VStack>
  );
};

export default TvShows;
