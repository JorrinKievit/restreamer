import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Grid,
} from '@chakra-ui/react';
import React, { Dispatch, FC, SetStateAction } from 'react';
import { TvShowDetailsResults } from 'renderer/api/tmdb/tvshow-details.types';

interface TvShowDetailsProps {
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

const TvShowDetails: FC<TvShowDetailsProps> = ({
  showData,
  activeEpisode,
  showDetails,
}) => {
  return (
    <Box py={6}>
      <Accordion allowMultiple defaultIndex={[activeEpisode.season - 1]}>
        {showData?.seasons.map((season) => (
          <AccordionItem key={season.id}>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  {season.name}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Grid
                templateColumns={{
                  base: 'repeat(2, 1fr)',
                  md: 'repeat(6, 1fr)',
                }}
                gap={6}
              >
                {Array.from(
                  { length: season.episode_count },
                  (_, i) => i + 1
                ).map((episodeNumber) => (
                  <Box
                    as="button"
                    key={`${season}-${episodeNumber}}`}
                    color={
                      activeEpisode.season === season.season_number &&
                      activeEpisode.episode === episodeNumber
                        ? 'teal.500'
                        : ''
                    }
                    onClick={() =>
                      showDetails({
                        season: season.season_number,
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
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

export default TvShowDetails;
