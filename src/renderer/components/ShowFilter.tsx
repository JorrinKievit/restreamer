import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { MultiValue, Select } from 'chakra-react-select';
import React, { FC, useState } from 'react';
import { TMDB_MOVIE_GENRES, TMDB_TV_GENRES } from 'renderer/api/tmdb/genres';
import { TMBD_SORT_BY } from 'renderer/api/tmdb/sort-by';

type ShowType = 'movie' | 'tv';

export type FilterOptions = {
  genres: number[];
  year?: number;
  type: ShowType;
  sortBy: string;
  page: number;
};

interface ShowFilterProps {
  defaultShowType: ShowType;
  callback: (options: FilterOptions) => void;
}

const ShowFilter: FC<ShowFilterProps> = ({ defaultShowType, callback }) => {
  const [genres, setGenres] = useState<
    MultiValue<{ label: string; value: number }>
  >([]);
  const [year, setYear] = useState('');
  const [type, setType] = useState<ShowType>(defaultShowType);
  const [sortBy, setSortBy] = useState(
    TMBD_SORT_BY.find((sort) => sort.value === 'popularity.desc')
  );

  const DEFAULT_GENRES =
    defaultShowType === 'movie' ? TMDB_MOVIE_GENRES : TMDB_TV_GENRES;

  const handleSubmit = () => {
    callback({
      genres: genres.map((genre) => genre.value),
      year: Number(year),
      type,
      sortBy: sortBy?.value ? sortBy.value : 'popularity.desc',
      page: 1,
    });
  };

  return (
    <Flex gap={4} alignItems="center" w="full">
      <FormControl>
        <FormLabel>Genres</FormLabel>
        <Select
          isMulti
          options={DEFAULT_GENRES.map((genre) => ({
            label: genre.name,
            value: genre.id,
          }))}
          value={genres}
          onChange={setGenres}
        />
      </FormControl>
      <FormControl minW="150px" maxW="150px">
        <FormLabel>Year</FormLabel>
        <NumberInput min={1900} max={2100} value={year} onChange={setYear}>
          <NumberInputField placeholder="all" />
        </NumberInput>
      </FormControl>
      <FormControl minW="150px" maxW="150px">
        <FormLabel>Type</FormLabel>
        <Select
          options={[
            { label: 'Movie', value: 'movie' },
            { label: 'TV Show', value: 'tv' },
          ]}
          value={{
            label: type === 'movie' ? 'Movie' : 'TV Show',
            value: type,
          }}
          onChange={(value) => setType(value?.value as ShowType)}
        />
      </FormControl>
      <FormControl minW="255px" maxW="255px">
        <FormLabel>Sort</FormLabel>
        <Select
          options={TMBD_SORT_BY.map((sort) => ({
            label: sort.label,
            value: sort.value,
          }))}
          value={sortBy}
          onChange={(e) =>
            setSortBy({
              label: e?.label as string,
              value: e?.value as string,
            })
          }
        />
      </FormControl>
      <Box w={40}>
        <Box h="32px" />
        <Button colorScheme="blue" onClick={handleSubmit}>
          Filter
        </Button>
      </Box>
    </Flex>
  );
};

export default ShowFilter;
