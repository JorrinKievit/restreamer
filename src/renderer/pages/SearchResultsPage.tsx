import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchMoviesAndShows } from 'renderer/api/tmdb/api';
import { Spinner } from '@chakra-ui/react';
import SearchResults from 'renderer/components/SearchResults';

const SearchResultsPage: FC = () => {
  const { query } = useParams();

  const { data, error, isLoading } = useSearchMoviesAndShows(query);

  if (isLoading) return <Spinner />;

  if (error) {
    return <div>{error.toString()}</div>;
  }

  return <SearchResults data={data} type="multi" />;
};

export default SearchResultsPage;
