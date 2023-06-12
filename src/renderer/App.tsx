import {
  Box,
  ChakraProvider,
  Container,
  createStandaloneToast,
} from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ipcLink } from 'electron-trpc/renderer';
import { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Header from './components/Header';
import UpdateModal from './components/UpdateModal';
import Index from './pages/Index';
import MovieDetails from './pages/MovieDetails';
import Movies from './pages/Movies';
import Search from './pages/Search';
import Settings from './pages/Settings';
import TvShows from './pages/TvShows';

import './styles/globals.css';
import extendedTheme from './styles/theme';
import { client } from './api/trpc';

const { ToastContainer, toast } = createStandaloneToast();

const twentyFourHoursInMs = 1000 * 60 * 60 * 24;

const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: twentyFourHoursInMs,

            onError: (error) => {
              if (isAxiosError(error)) {
                let message = '';
                if (error.request.status === 401) message = 'Unauthorized';
                if (error.request.status === 404) message = 'Not found';
                if (error.request.status === 500)
                  message = 'Internal server error';
                if (error.response?.data.status_message)
                  message = error.response.data.status_message;

                toast({
                  title: 'An error occurred, please try again later',
                  description: message,
                  status: 'error',
                  position: 'top-right',
                  duration: 5000,
                  isClosable: true,
                });
              }
              if (error instanceof Error) {
                toast({
                  title: 'An error occurred, please try again later',
                  description: error.message,
                  status: 'error',
                  position: 'top-right',
                  duration: 5000,
                  isClosable: true,
                });
              }
            },
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    client.createClient({
      links: [ipcLink()],
    })
  );
  return (
    <>
      <ToastContainer />
      <ChakraProvider
        theme={extendedTheme}
        toastOptions={{
          defaultOptions: {
            position: 'top-right',
            duration: 5000,
            isClosable: true,
          },
        }}
      >
        <client.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <Container maxW="7xl" h="full">
              <Router>
                <Header />
                <UpdateModal />
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
        </client.Provider>
      </ChakraProvider>
    </>
  );
};

export default App;
