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
} from '@chakra-ui/react';
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { TvShowDetailsResults } from 'renderer/api/tmdb/tvshow-details.types';

interface EpisodeListProps {
  tvData: TvShowDetailsResults;
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
    <Card p={6}>
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
            md: 'repeat(6, 1fr)',
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
                textDecoration: 'underline',
              }}
            >
              Episode {episodeNumber}
            </Box>
          ))}
        </Grid>
      </Flex>
    </Card>
  );
};

export default EpisodeList;
