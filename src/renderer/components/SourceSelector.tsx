import { CheckIcon, StarIcon } from '@chakra-ui/icons';
import { Tag, Box, Button, Flex, Text } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Source, Sources } from 'types/sources';

interface SourceSelectorProps {
  sources: Sources;
  activeSource: Source;
  selectSource: (source: Source) => void;
}

const SourceSelector: FC<SourceSelectorProps> = ({ sources, activeSource, selectSource }) => {
  return (
    <Flex align="center" justify="center" w="full" gap={4}>
      {sources.map((source) => (
        <Button key={source.server} p={3} variant="solid" colorScheme="blue" size="lg" onClick={() => selectSource(source)} isDisabled={activeSource.server === source.server}>
          <Flex align="center" w="full">
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
      ))}
    </Flex>
  );
};

export default SourceSelector;
