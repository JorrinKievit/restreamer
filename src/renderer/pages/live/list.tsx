import { VStack, Heading, Grid, GridItem, Image, Tooltip, Text, Input, IconButton, Box, AspectRatio } from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { client } from 'renderer/api/trpc';
import SkeletonGrid from 'renderer/components/SkeletonGrid';
import { Link } from 'react-router-dom';
import { LiveMainPage } from 'types/sources';
import { StarIcon } from '@chakra-ui/icons';
import { useLocalStorage } from 'usehooks-ts';

const LiveGridItem: FC<{
  item: LiveMainPage;
  isFavorite: boolean;
  toggleFavorite: () => void;
}> = ({ item, isFavorite, toggleFavorite }) => {
  return (
    <GridItem key={item.url}>
      <Link to={`/live/view?url=${encodeURIComponent(item.url)}`}>
        <AspectRatio
          _hover={{
            background: 'black',
            transition: 'opacity 0.2s',
          }}
        >
          <>
            <Image src={item.imgSrc} alt={item.title} />
            <Box position="absolute" background="rgba(0, 0, 0, 0.5)" opacity={0} transition="opacity 0.2s" _hover={{ opacity: 1 }}>
              <IconButton
                icon={<StarIcon color={isFavorite ? 'yellow.400' : 'white'} />}
                position="absolute"
                colorScheme="yellow"
                aria-label="Add/Remove from Favorites"
                size="sm"
                top="2"
                right="2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite();
                }}
              />
            </Box>
          </>
        </AspectRatio>
        <VStack mt={1}>
          <Tooltip label={item.title}>
            <Text w="full" textAlign="left" noOfLines={1}>
              {item.title}
            </Text>
          </Tooltip>
        </VStack>
      </Link>
    </GridItem>
  );
};

const LiveListPage: FC = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<LiveMainPage[]>([]);
  const mainPageData = client.live.getMainPage.useQuery();

  const [favorites, setFavorites] = useLocalStorage<string[]>('liveFavorites', []);

  useEffect(() => {
    if (!mainPageData.data) return;
    setData(mainPageData.data);
  }, [mainPageData.data]);

  const filteredData = data.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())).filter((item) => !favorites.includes(item.url));

  const toggleFavorite = (url: string) => {
    if (favorites.includes(url)) {
      setFavorites(favorites.filter((f) => f !== url));
    } else {
      setFavorites([...favorites, url]);
    }
  };

  const favoriteData = data.filter((d) => favorites.includes(d.url));

  return (
    <VStack gap={4}>
      <Heading w="full" textAlign="left">
        Favorites
      </Heading>
      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)',
        }}
        gap={6}
        w="full"
      >
        {favoriteData.map((d) => (
          <LiveGridItem key={d.url} item={d} isFavorite toggleFavorite={() => toggleFavorite(d.url)} />
        ))}
      </Grid>
      <Heading w="full" textAlign="left">
        Live
      </Heading>
      <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
      {mainPageData.isLoading && <SkeletonGrid />}
      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)',
        }}
        gap={6}
        w="full"
      >
        {filteredData.map((d) => (
          <LiveGridItem key={d.url} item={d} isFavorite={favorites.includes(d.url)} toggleFavorite={() => toggleFavorite(d.url)} />
        ))}
      </Grid>
    </VStack>
  );
};

export default LiveListPage;
