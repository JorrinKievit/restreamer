import { Grid, GridItem } from '@chakra-ui/react';
import { FC } from 'react';
import OpenSubtitlesSettings from 'renderer/components/Settings/OpenSubtitles';
import SourcesCheck from 'renderer/components/Settings/SourcesCheck';

const Settings: FC = () => {
  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={6} h={400}>
      <GridItem>
        <OpenSubtitlesSettings />
      </GridItem>
      <GridItem overflowY="auto">
        <SourcesCheck />
      </GridItem>
    </Grid>
  );
};

export default Settings;
