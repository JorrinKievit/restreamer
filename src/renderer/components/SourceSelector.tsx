import { CheckIcon, StarIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Source, Sources } from 'types/sources';

interface SourceSelectorProps {
  sources: Sources;
  activeSource: Source;
  selectSource: (source: Source) => void;
}

const SourceSelector: FC<SourceSelectorProps> = ({
  sources,
  activeSource,
  selectSource,
}) => {
  return (
    <Flex align="center" justify="center" w="full" gap={4} mt={4}>
      {sources.map((source) => (
        <Button
          key={source.server}
          p={6}
          variant="solid"
          colorScheme="blue"
          size="lg"
          onClick={() => selectSource(source)}
          isDisabled={activeSource.server === source.server}
        >
          <Flex align="center" w="full">
            {activeSource.server === source.server ? (
              <CheckIcon />
            ) : (
              <StarIcon />
            )}
            <Box ml={4}>
              <Text fontSize="xs">Server</Text>
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
