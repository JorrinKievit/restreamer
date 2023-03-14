import { Box, ChakraProvider, Container } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Index from './pages/Index';
import MovieDetails from './pages/MovieDetails';
import Movies from './pages/Movies';
import Search from './pages/Search';
import Settings from './pages/Settings';
import TvShows from './pages/TvShows';

import './styles/globals.css';
import extendedTheme from './styles/theme';

const twentyFourHoursInMs = 1000 * 60 * 60 * 24;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: twentyFourHoursInMs,
    },
  },
  logger: {
    log: console.log,
    warn: console.log,
    error: console.log,
  },
});

const App = () => {
  return (
    <ChakraProvider theme={extendedTheme}>
      <QueryClientProvider client={queryClient}>
        <Container maxW="7xl" h="full">
          <Router>
            <Header />
            <Box py={4} h="full">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search/:query" element={<Search />} />
                <Route path="/details/:id" element={<MovieDetails />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/tvshows" element={<TvShows />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Router>
        </Container>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;
