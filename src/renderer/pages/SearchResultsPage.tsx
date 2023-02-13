import { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  TMDB_IMAGE_BASE_URL,
  useSearchMoviesAndShows,
} from 'renderer/api/tmdb/api';
import {
  AspectRatio,
  Flex,
  Grid,
  GridItem,
  Tag,
  Tooltip,
  VStack,
  Image,
  Text,
  Skeleton,
} from '@chakra-ui/react';
import ErrorToast from 'renderer/components/ErrorToast';
import SkeletonGrid from 'renderer/components/SkeletonGrid';

const SearchResultsPage: FC = () => {
  const { query } = useParams();
  const { data, error, isLoading } = useSearchMoviesAndShows(query);

  if (isLoading) return <SkeletonGrid />;

  if (error)
    return <ErrorToast description={error.response?.data.status_message} />;

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
              <Link to={`/details/${show.id}?media_type=${show.media_type}`}>
                <AspectRatio ratio={2 / 3}>
                  <Skeleton isLoaded={!isLoading}>
                    <Image
                      src={`${TMDB_IMAGE_BASE_URL}${show.poster_path}`}
                      alt={show.name}
                    />
                  </Skeleton>
                </AspectRatio>
                <VStack mt={1}>
                  <Tooltip label={show.name ? show.name : show.title}>
                    <Text w="full" textAlign="left" noOfLines={1}>
                      {show.name ? show.name : show.title}
                    </Text>
                  </Tooltip>
                  <Flex w="full">
                    <Text flex="1">
                      {new Date(
                        show.release_date
                          ? show.release_date
                          : show.first_air_date
                      ).getFullYear() || 'N/A'}
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
      })}
    </Grid>
  );
};

export default SearchResultsPage;
