import { VStack, Heading, Grid, GridItem, AspectRatio, Image, Tooltip, Text } from '@chakra-ui/react';
import React, { FC } from 'react';
import { client } from 'renderer/api/trpc';
import SkeletonGrid from 'renderer/components/SkeletonGrid';
import { Link } from 'react-router-dom';

const LiveListPage: FC = () => {
  const mainPageData = client.live.getMainPage.useQuery();

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        Live
      </Heading>
      {mainPageData.isLoading && <SkeletonGrid />}
      {mainPageData.data && (
        <>
          <Grid
            templateColumns={{
              base: 'repeat(2, 1fr)',
              md: 'repeat(5, 1fr)',
            }}
            gap={6}
            w="full"
          >
            {mainPageData.data.map((d, i) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <GridItem key={`${d.title}${i}`}>
                  <Link to={`/live/view?url=${encodeURIComponent(d.url)}`}>
                    <Image src={d.imgSrc} alt={d.title} />
                    <VStack mt={1}>
                      <Tooltip label={d.title}>
                        <Text w="full" textAlign="left" noOfLines={1}>
                          {d.title}
                        </Text>
                      </Tooltip>
                    </VStack>
                  </Link>
                </GridItem>
              );
            })}
          </Grid>
        </>
      )}
    </VStack>
  );
};

export default LiveListPage;
