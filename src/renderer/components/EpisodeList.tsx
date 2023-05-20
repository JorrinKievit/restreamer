import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { TvShowDetailsResults } from 'main/api/tmdb/tvshow-details.types';
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

interface EpisodeListProps {
  tvData: TvShowDetailsResults & { episodeNames: string[][] };
  activeEpisode: {
    season: number;
    episode: number;
  };
  setActiveEpisode: Dispatch<
    SetStateAction<{
      season: number;
      episode: number;
    }>
  >;
}

const EpisodeList: FC<EpisodeListProps> = ({
  tvData,
  activeEpisode,
  setActiveEpisode,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(activeEpisode.season);

  const currentSeason =
    tvData.seasons[0].season_number === 0
      ? tvData.seasons[selectedSeason]
      : tvData.seasons[selectedSeason - 1];

  useEffect(() => {
    setSelectedSeason(activeEpisode.season);
  }, [activeEpisode.season]);

  return (
    <Card p={6} background="blue.900">
      <Flex gap={4} flexDirection="column" w="full">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="150px">
            {currentSeason.name}
          </MenuButton>
          <MenuList minH="0" h="200px" overflowY="auto">
            <MenuOptionGroup value={selectedSeason.toString()}>
              {tvData?.seasons.map((season) => (
                <MenuItemOption
                  value={season.season_number.toString()}
                  key={season.id}
                  onClick={() => setSelectedSeason(season.season_number)}
                  color={
                    activeEpisode.season === season.season_number
                      ? 'teal.500'
                      : ''
                  }
                >
                  {season.name}
                </MenuItemOption>
              ))}
            </MenuOptionGroup>
          </MenuList>
        </Menu>
        <Grid
          templateColumns={{
            base: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          }}
          gap={6}
        >
          {Array.from(
            { length: currentSeason.episode_count },
            (_, i) => i + 1
          ).map((episodeNumber) => (
            <Box
              as="button"
              key={`${selectedSeason}-${episodeNumber}}`}
              color={
                activeEpisode.season === currentSeason.season_number &&
                activeEpisode.episode === episodeNumber
                  ? 'teal.500'
                  : ''
              }
              onClick={() =>
                setActiveEpisode({
                  season: currentSeason.season_number,
                  episode: episodeNumber,
                })
              }
              sx={{
                background: 'blue.800',
                borderRadius: '0.375rem',
                padding: '0.5rem',
              }}
            >
              <Tooltip
                label={
                  tvData.episodeNames?.[selectedSeason]?.[episodeNumber - 1]
                    ? tvData.episodeNames[selectedSeason][episodeNumber - 1]
                    : ''
                }
              >
                <Text noOfLines={1}>
                  {tvData.episodeNames?.[selectedSeason]?.[episodeNumber - 1]
                    ? `Episode ${episodeNumber}: ${
                        tvData.episodeNames[selectedSeason][episodeNumber - 1]
                      }`
                    : `Episode ${episodeNumber}`}
                </Text>
              </Tooltip>
            </Box>
          ))}
        </Grid>
      </Flex>
    </Card>
  );
};

export default EpisodeList;
