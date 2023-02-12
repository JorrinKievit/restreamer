import { Grid, Skeleton } from '@chakra-ui/react';

const SkeletonGrid = () => {
  return (
    <Grid
      templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }}
      gap={6}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <Skeleton key={i} height="300px" />
      ))}
    </Grid>
  );
};

export default SkeletonGrid;
