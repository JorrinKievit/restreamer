/* eslint-disable no-undef */
import { FC, useEffect } from 'react';
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
  Progress,
  Box,
  IconButton,
  Link,
} from '@chakra-ui/react';
import { PlayingData } from 'types/localstorage';
import { TMDB_IMAGE_BASE_URL, useGetShowsById } from 'renderer/api/tmdb/api';
import { Link as RouterLink } from 'react-router-dom';
import ErrorToast from 'renderer/components/ErrorToast';
import SkeletonGrid from 'renderer/components/SkeletonGrid';
import { DeleteIcon } from '@chakra-ui/icons';
import { useLocalStorage } from 'usehooks-ts';
import NotFoundImage from 'renderer/assets/undraw_page_not_found.svg';

const Index: FC = () => {
  const [playingData, setPlayingData] = useLocalStorage<PlayingData>(
    'playingData',
    {}
  );
  const { data, error, isInitialLoading } = useGetShowsById(playingData);

  if (isInitialLoading) return <SkeletonGrid />;

  if (error)
    return <ErrorToast description={error.response?.data.status_message} />;

  return (
    <VStack>
      <>
        <Heading w="full" textAlign="left">
          Continue watching
        </Heading>

        {data && data.length > 0 ? (
          <Grid
            templateColumns={{
              base: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)',
            }}
            gap={6}
            w="full"
          >
            {data.map((show) => {
              const runtime =
                show.media_type === 'tv'
                  ? show.episode_run_time[0]
                  : show.runtime;
              const progress = Math.floor(
                (playingData![show.id].playingTime / 60 / runtime) * 100
              );
              return (
                show.poster_path && (
                  <GridItem key={show.id} position="relative">
                    <RouterLink
                      to={`/details/${show.id}?media_type=${show.media_type}`}
                    >
                      <AspectRatio
                        ratio={2 / 3}
                        _hover={{
                          background: 'black',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <>
                          <Image
                            src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                            alt={
                              show.media_type === 'tv' ? show.name : show.title
                            }
                          />
                          <Box
                            position="absolute"
                            background="rgba(0, 0, 0, 0.5)"
                            opacity={0}
                            transition="opacity 0.2s"
                            _hover={{ opacity: 1 }}
                          >
                            <IconButton
                              icon={<DeleteIcon />}
                              position="absolute"
                              colorScheme="red"
                              aria-label="Delete show from list"
                              size="sm"
                              top="2"
                              right="2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const newPlayingData = {
                                  ...playingData,
                                };
                                delete newPlayingData[show.id];
                                setPlayingData(newPlayingData);
                              }}
                            />
                          </Box>
                        </>
                      </AspectRatio>
                      <VStack mt={1}>
                        <Progress value={progress} w="full" />
                        <Tooltip
                          label={
                            show.media_type === 'tv' ? show.name : show.title
                          }
                        >
                          <Text w="full" textAlign="left" noOfLines={1}>
                            {show.media_type === 'tv' ? show.name : show.title}
                          </Text>
                        </Tooltip>
                        <Flex w="full">
                          <Text flex="1">
                            {new Date(
                              show.media_type === 'tv'
                                ? show.first_air_date
                                : show.release_date
                            ).getFullYear() || 'N/A'}
                          </Text>
                          <Tag colorScheme="blue">
                            {show.media_type === 'tv' ? 'TV' : 'Movie'}
                          </Tag>
                        </Flex>
                      </VStack>
                    </RouterLink>
                  </GridItem>
                )
              );
            })}
          </Grid>
        ) : (
          <VStack gap={4}>
            <Image src={NotFoundImage} alt="Not found" maxW="60%" />
            <Text fontSize="2xl">
              You haven&apos;t watched anything yet. Go to the{' '}
              <Link as={RouterLink} to="/movies" color="blue.200">
                Movies
              </Link>{' '}
              or{' '}
              <Link as={RouterLink} to="/tvshows" color="blue.200">
                TV Shows
              </Link>{' '}
              page to find something to watch.
            </Text>
          </VStack>
        )}
      </>
    </VStack>
  );
};

export default Index;
