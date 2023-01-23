import { useQuery } from '@tanstack/react-query';
import { SuperEmbedResults } from './result.types';
import { retrieveStreamTapeURL } from './streamtape';
import { retrieveUpStreamURL } from './upstream';

const SUPEREMBED_API_ENDPOINT = 'https://seapi.link/?type=tmdb';

export const useMovie = (movieId: string | undefined) => {
  const { data, error, isLoading } = useQuery<
    { server: string; url: string }[]
  >({
    queryKey: ['movie', movieId],
    queryFn: async () => {
      const res = await fetch(
        `${SUPEREMBED_API_ENDPOINT}&id=${movieId}&max_results=1`
      );
      const json = await res.json();

      const providers = await Promise.all(
        json.results.map(async (result: SuperEmbedResults['results'][0]) => {
          switch (result.server) {
            // case 'streamtape':
            //   // eslint-disable-next-line no-case-declarations
            //   let url = await retrieveStreamTapeURL(result.url);
            //   console.log(url);
            //   return {
            //     server: result.server,
            //     url,
            //   };
            case 'upstream':
              // eslint-disable-next-line no-case-declarations
              const url = await retrieveUpStreamURL(result.url);
              return {
                server: result.server,
                url,
              };
            default:
              return {
                server: null,
                url: null,
              };
          }
        })
      );
      console.log(providers);

      return providers;
    },
    enabled: !!movieId,
  });

  return { data, error, isLoading };
};
