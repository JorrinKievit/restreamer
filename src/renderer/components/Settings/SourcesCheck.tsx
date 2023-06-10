import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Heading,
  UnorderedList,
  ListItem,
  Flex,
  Tag,
  CardFooter,
  ButtonGroup,
  Button,
  useBoolean,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import React, { FC } from 'react';
import { client } from 'renderer/api/trpc';
import { Sources } from 'types/sources';

const AVAILABLE_SOURCES = [
  {
    name: 'GoMovies',
  },
  {
    name: 'SuperStream',
  },
  {
    name: '2Embed',
    children: [
      {
        name: 'VidCloud',
      },
      {
        name: 'Streamlare',
      },
    ],
  },
  {
    name: 'VidSrc',
    children: [
      {
        name: 'VidSrc Pro',
      },
      {
        name: 'Embedsito',
      },
    ],
  },
];

const SourceInfo: FC<{
  data: Sources | undefined;
  name: string;
  isLoading: boolean;
  showBadge?: boolean;
}> = ({ data, name, isLoading, showBadge = true }) => {
  return (
    <Flex alignItems="center" gap={2}>
      <ListItem key={name}>{name}</ListItem>
      {data && showBadge && (
        <Tag
          colorScheme={data?.find((s) => s.server === name) ? 'green' : 'red'}
        >
          {data.find((s) => s.server === name)
            ? 'Operational'
            : 'Non-operational'}
        </Tag>
      )}
      {isLoading && showBadge && <Spinner size="sm" />}
    </Flex>
  );
};

const SourcesCheck: FC = () => {
  const [isDisabled, setIsDisabled] = useBoolean(false);

  const { data, isLoading, refetch, isRefetching } =
    client.app.getSources.useQuery({
      imdbId: 'tt0068646',
      showName: 'The Godfather',
      type: 'movie',
    });

  const handleRefetch = () => {
    refetch();
    setIsDisabled.on();
    setTimeout(() => {
      setIsDisabled.off();
    }, 2 * 60 * 1000);
  };

  return (
    <Card h="full">
      <CardHeader>
        <Heading>Available Sources</Heading>
      </CardHeader>
      <CardBody>
        <UnorderedList spacing={2}>
          {AVAILABLE_SOURCES.map((source) => (
            <Box key={source.name}>
              <SourceInfo
                data={data}
                name={source.name}
                isLoading={isLoading || isRefetching}
                showBadge={!source.children}
              />
              {source.children && (
                <UnorderedList spacing={2}>
                  {source.children.map((child) => (
                    <SourceInfo
                      key={child.name}
                      data={data}
                      name={child.name}
                      isLoading={isLoading || isRefetching}
                    />
                  ))}
                </UnorderedList>
              )}
            </Box>
          ))}
        </UnorderedList>
      </CardBody>
      <CardFooter justifyContent="flex-end">
        <ButtonGroup>
          <Tooltip
            hasArrow
            label="You can only refetch once every 2 minutes"
            isDisabled={!isDisabled}
          >
            <Button
              variant="solid"
              colorScheme="blue"
              onClick={handleRefetch}
              isDisabled={isDisabled}
            >
              Refetch
            </Button>
          </Tooltip>
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
};

export default SourcesCheck;
