/* eslint-disable no-undef */
import { FC } from 'react';
import {
  AspectRatio,
  Flex,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Tag,
  Tooltip,
  VStack,
  Image,
  Text,
  Progress,
} from '@chakra-ui/react';
import { useReadLocalStorage } from 'usehooks-ts';
import { PlayingData } from 'types/localstorage';
import { TMDB_IMAGE_BASE_URL, useGetShowsById } from 'renderer/api/tmdb/api';
import { Link } from 'react-router-dom';
import ErrorToast from 'renderer/components/ErrorToast';

const Index: FC = () => {
  const playingData = useReadLocalStorage<PlayingData>('playingData');
  const { data, error, isLoading, isInitialLoading } = useGetShowsById(
    playingData as PlayingData
  );

  if (isLoading) return <Spinner />;

  if (error)
    return <ErrorToast description={error.response?.data.status_message} />;

  return (
    <VStack>
      <>
        <Heading w="full" textAlign="left">
          Continue watching
        </Heading>
        {isInitialLoading && <Spinner />}
        <Grid
          templateColumns={{
            base: 'repeat(2, 1fr)',
            md: 'repeat(6, 1fr)',
          }}
          gap={6}
          w="full"
        >
          {data
            ? data.map((show) => {
                const runtime =
                  show.media_type === 'tv'
                    ? show.episode_run_time[0]
                    : show.runtime;
                const progress = Math.floor(
                  (playingData![show.id].playingTime / 60 / runtime) * 100
                );
                return (
                  show.poster_path && (
                    <GridItem key={show.id}>
                      <Link
                        to={`/details/${show.id}?media_type=${show.media_type}`}
                      >
                        <AspectRatio ratio={2 / 3}>
                          <Image
                            src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                            alt={
                              show.media_type === 'tv' ? show.name : show.title
                            }
                          />
                        </AspectRatio>
                        <VStack mt={1}>
                          <Progress value={progress} w="full" />
                          <Tooltip
                            label={
                              show.media_type === 'tv' ? show.name : show.title
                            }
                          >
                            <Text w="full" textAlign="left" noOfLines={1}>
                              {show.media_type === 'tv'
                                ? show.name
                                : show.title}
                            </Text>
                          </Tooltip>
                          <Flex w="full">
                            <Text flex="1">
                              {new Date(
                                show.media_type === 'tv'
                                  ? show.first_air_date
                                  : show.release_date
                              ).getFullYear()}
                            </Text>
                            <Tag colorScheme="blue">
                              {show.media_type === 'tv' ? 'TV' : 'Movie'}
                            </Tag>
                          </Flex>
                        </VStack>
                      </Link>
                    </GridItem>
                  )
                );
              })
            : null}
        </Grid>
      </>
    </VStack>
  );
};

export default Index;
