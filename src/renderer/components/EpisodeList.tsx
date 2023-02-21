import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
} from '@chakra-ui/react';
import React, { Dispatch, FC, SetStateAction, useState } from 'react';
import { TvShowDetailsResults } from 'renderer/api/tmdb/tvshow-details.types';

interface EpisodeListProps {
  showData: TvShowDetailsResults;
  activeEpisode: {
    season: number;
    episode: number;
  };
  showDetails: Dispatch<
    SetStateAction<{
      season: number;
      episode: number;
    }>
  >;
}

const EpisodeList: FC<EpisodeListProps> = ({
  showData,
  activeEpisode,
  showDetails,
}) => {
  const [selectedSeason, setSelectedSeason] = useState(activeEpisode.season);

  const currentSeason =
    showData.seasons[0].season_number === 0
      ? showData.seasons[selectedSeason]
      : showData.seasons[selectedSeason - 1];

  console.log(showData);
  return (
    <Card p={6}>
      <Flex gap={4} flexDirection="column" w="full">
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="150px">
            {currentSeason.name}
          </MenuButton>
          <MenuList minH="0" h="200px" overflowY="auto">
            <MenuOptionGroup defaultValue={activeEpisode.season.toString()}>
              {showData?.seasons.map((season) => (
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
                showDetails({
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
