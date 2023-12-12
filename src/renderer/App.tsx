import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ipcLink } from "electron-trpc/renderer";
import { useState } from "react";
import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Header } from "./components/layout/header";
import { UpdateModal } from "./components/update-modal";
import { Index } from "./pages";
import { ShowDetailsPage } from "./pages/shows/view";
import { SearchPage } from "./pages/shows/search";
import { SettingsPage } from "./pages/settings";
import { client } from "./api/trpc";

import LiveListPage from "./pages/live/list";
import LiveViewPage from "./pages/live/view";
import { ThemeProvider } from "./components/contexts/theme-provider";
import { toast } from "./components/ui/use-toast";
import { Toaster } from "./components/ui/toaster";

import "./styles/globals.css";
import { DiscoverPage } from "./pages/shows/discover";

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
                let message = "";
                if (error.request.status === 401) message = "Unauthorized";
                if (error.request.status === 404) message = "Not found";
                if (error.request.status === 500)
                  message = "Internal server error";
                if (error.response?.data.status_message)
                  message = error.response.data.status_message;

                toast({
                  title: "An error occurred, please try again later",
                  description: message,
                  variant: "destructive",
                  duration: 5000,
                });
              }
              if (error instanceof Error) {
                toast({
                  title: "An error occurred, please try again later",
                  description: error.message,
                  variant: "destructive",
                  duration: 5000,
                });
              }
            },
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    client.createClient({
      links: [ipcLink()],
    }),
  );
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <Toaster />
      <client.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <div className="h-full px-20">
            <Router>
              <Header />
              <UpdateModal />
              <div className="h-full py-4">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search/:query" element={<SearchPage />} />
                  <Route path="/shows/:id" element={<ShowDetailsPage />} />
                  <Route
                    path="/shows/discover/:mediaType"
                    element={<DiscoverPage />}
                  />
                  <Route
                    path="/shows/discover/:mediaType"
                    element={<DiscoverPage />}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/live/list" element={<LiveListPage />} />
                  <Route path="/live/view" element={<LiveViewPage />} />
                </Routes>
              </div>
            </Router>
          </div>
        </QueryClientProvider>
      </client.Provider>
    </ThemeProvider>
  );
};

export default App;
