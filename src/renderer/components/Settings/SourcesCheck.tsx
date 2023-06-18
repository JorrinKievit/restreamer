import { Card, CardBody, CardHeader, Spinner, Heading, UnorderedList, ListItem, Flex, Tag, CardFooter, ButtonGroup, Button, useBoolean, Tooltip, Box } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
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
      {data && showBadge && <Tag colorScheme={data?.find((s) => s.server === name) ? 'green' : 'red'}>{data.find((s) => s.server === name) ? 'Operational' : 'Non-operational'}</Tag>}
      {isLoading && showBadge && <Spinner size="sm" />}
    </Flex>
  );
};

const SourcesCheck: FC = () => {
  const [isDisabled, setIsDisabled] = useBoolean(false);

  const {
    data: sourcesData,
    isLoading,
    refetch,
  } = client.app.getSources.useQuery({
    imdbId: 'tt0068646',
    showName: 'The Godfather',
    type: 'movie',
  });
  const [sources, setSources] = useState<Sources>(sourcesData ?? []);
  const [sourcesLoading, setSourcesLoading] = useState<Record<string, boolean>>(() => {
    const initialLoading: Record<string, boolean> = {};
    AVAILABLE_SOURCES.forEach((source) => {
      if (!source.children) {
        initialLoading[source.name] = true;
      }
    });
    return initialLoading;
  });
  client.app.getSourcesSubscription.useSubscription(undefined, {
    onData: (data: Sources) => {
      if (data.length === 0) return;
      setSources((prev) => [...prev, ...data]);
      setSourcesLoading((prev) => ({ ...prev, [data[0].server]: false }));
    },
  });

  const handleRefetch = () => {
    setSourcesLoading((prev) => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = true;
      });
      return newState;
    });
    refetch();
    setIsDisabled.on();
    setTimeout(() => {
      setIsDisabled.off();
    }, 2 * 60 * 1000);
  };

  useEffect(() => {
    if (!isLoading) {
      setSourcesLoading((prev) => {
        const newState: Record<string, boolean> = {};
        Object.keys(prev).forEach((key) => {
          newState[key] = false;
        });
        return newState;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <Card h="full">
      <CardHeader>
        <Heading>Available Sources</Heading>
      </CardHeader>
      <CardBody>
        <UnorderedList spacing={2}>
          {AVAILABLE_SOURCES.map((source) => (
            <Box key={source.name}>
              <SourceInfo data={sources} name={source.name} isLoading={sourcesLoading[source.name]} showBadge={!source.children} />
              {source.children && (
                <UnorderedList spacing={2}>
                  {source.children.map((child) => (
                    <SourceInfo key={child.name} data={sources} name={child.name} isLoading={sourcesLoading[child.name]} />
                  ))}
                </UnorderedList>
              )}
            </Box>
          ))}
        </UnorderedList>
      </CardBody>
      <CardFooter justifyContent="flex-end">
        <ButtonGroup>
          <Tooltip hasArrow label="You can only refetch once every 2 minutes" isDisabled={!isDisabled}>
            <Button variant="solid" colorScheme="blue" onClick={handleRefetch} isDisabled={isDisabled}>
              Refetch
            </Button>
          </Tooltip>
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
};

export default SourcesCheck;
