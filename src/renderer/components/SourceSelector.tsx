import { CheckIcon, StarIcon } from '@chakra-ui/icons';
import { Tag, Box, Button, Flex, Text, Grid, Heading } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Source } from 'types/sources';

interface SourceSelectorProps {
  sources: Source[];
  activeSource: Source;
  selectSource: (source: Source) => void;
}

const SourceButton: FC<{ source: Source; activeSource: Source; selectSource: (source: Source) => void }> = ({ source, activeSource, selectSource }) => {
  return (
    <Button p={3} variant="solid" colorScheme="blue" size="lg" onClick={() => selectSource(source)} isDisabled={activeSource.server === source.server}>
      <Flex align="center" justify="center" w="full">
        <Flex flexDirection="column" align="center" gap={1}>
          <Tag colorScheme="purple" size="sm" variant="solid">
            {source.quality}
          </Tag>
          {activeSource.server === source.server ? <CheckIcon /> : <StarIcon />}
        </Flex>
        <Box ml={4}>
          <Text fontSize="xs">Server {source.subtitles && source.subtitles.length > 0 ? 'w/subtitles' : ''}</Text>
          <Text as="b" fontSize="xl">
            {source.server}
          </Text>
        </Box>
      </Flex>
    </Button>
  );
};

const SourceSelector: FC<SourceSelectorProps> = ({ sources, activeSource, selectSource }) => {
  return (
    <Flex flexDirection="column" gap={6}>
      <Grid templateColumns="repeat(5, 1fr)" w="full" gap={4}>
        {sources
          .filter((source) => !source.isVlc)
          .map((source) => (
            <SourceButton key={source.server} source={source} activeSource={activeSource} selectSource={selectSource} />
          ))}
      </Grid>
      {sources.filter((source) => source.isVlc).length > 0 ? <Heading size="lg">Sources only playable through VLC</Heading> : null}
      <Grid templateColumns="repeat(5, 1fr)" w="full" gap={4}>
        {sources
          .filter((source) => source.isVlc)
          .map((source) => (
            <SourceButton key={source.server} source={source} activeSource={activeSource} selectSource={selectSource} />
          ))}
      </Grid>
    </Flex>
  );
};

export default SourceSelector;
