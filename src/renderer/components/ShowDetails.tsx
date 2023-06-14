import { Flex, AspectRatio, Heading, Grid, Text, Image, Tag } from '@chakra-ui/react';
import React, { FC } from 'react';
import { TMDB_IMAGE_BASE_URL } from 'renderer/constants';

interface ShowDetailsProps {
  posterPath: string;
  title: string;
  overview: string;
  releaseDate: string;
  runtime: number;
  genres: { name: string }[];
  spokenLanguages: { name: string }[];
  cast: { name: string; order: number }[];
  productionCompanies: { name: string }[];
  votingAverage: number;
}

const ShowDetails: FC<ShowDetailsProps> = ({ posterPath, title, overview, releaseDate, runtime, genres, spokenLanguages, cast, productionCompanies, votingAverage }) => {
  return (
    <Flex gap={4}>
      <AspectRatio ratio={2 / 3} minW="200px">
        <Image src={`${TMDB_IMAGE_BASE_URL}${posterPath}`} alt={title} objectFit="cover" />
      </AspectRatio>
      <Flex flexDirection="column" gap={4}>
        <Heading size="md">{title}</Heading>
        <Tag size="lg" variant="solid" colorScheme="orange" w="100px">
          TMDB: {votingAverage.toPrecision(2)}
        </Tag>
        <Text>{overview}</Text>
        <Grid templateColumns="repeat(2, 1fr)">
          <Text>Release date: {releaseDate}</Text>
          <Text>Duration: {runtime} min</Text>
          <Text>Genres: {genres.map((g) => g.name).join(', ')}</Text>
          <Text>Languages: {spokenLanguages.map((l) => l.name).join(', ')}</Text>
          <Text>
            Casts:{' '}
            {cast
              .sort((c) => c.order)
              .map((c) => c.name)
              .slice(0, 3)
              .join(', ')}
          </Text>
          <Text>Production: {productionCompanies.map((c) => c.name).join(', ')}</Text>
        </Grid>
      </Flex>
    </Flex>
  );
};

export default ShowDetails;
