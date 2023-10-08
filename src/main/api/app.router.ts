import { app } from 'electron';
import z from 'zod';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { Source } from 'types/sources';
import { UHDMoviesExtractor } from '../extractors/uhdmovies';
import { VegaMoviesExtractor } from '../extractors/vegamovies/vegamovies';
import { VidSrcToExtractor } from '../extractors/vidsrcto';
import { PrimeWireExtractor } from '../extractors/primewire';
import { MoviesApiExtractor } from '../extractors/moviesapi';
import { RemoteStreamExtractor } from '../extractors/remotestream';
import { GoMoviesExtractor } from '../extractors/gomovies';
import { TwoEmbedExtractor } from '../extractors/2embed';
import { SuperStreamExtractor } from '../extractors/superstream/superstream';
import { VidSrcExtractor } from '../extractors/vidsrc';
import { SmashyStreamExtractor } from '../extractors/smashystream/smashystream';
import { PutLockerExtractor } from '../extractors/putlocker';
import { t } from './trpc-client';

const ee = new EventEmitter();

export const appRouter = t.router({
  getAppVersion: t.procedure.query(() => {
    return app.getVersion();
  }),
  getSources: t.procedure
    .input(
      z.object({
        imdbId: z.string(),
        tmdbId: z.string(),
        showName: z.string(),
        type: z.enum(['movie', 'tv']),
        season: z.number().optional(),
        episode: z.number().optional(),
      })
    )
    .query(async (req) => {
      const goMoviesExtractor = new GoMoviesExtractor();
      const primeWireExtractor = new PrimeWireExtractor();
      const putLockerExtractor = new PutLockerExtractor();
      const superStreamExtractor = new SuperStreamExtractor();
      const twoEmbedExtractor = new TwoEmbedExtractor();
      const vidSrcExtractor = new VidSrcExtractor();
      const remoteStreamExtractor = new RemoteStreamExtractor();
      const smashyStreamExtractor = new SmashyStreamExtractor();
      const moviesApiExtractor = new MoviesApiExtractor();
      const vidSrcToExtractor = new VidSrcToExtractor();
      const vegaMoviesExtractor = new VegaMoviesExtractor();
      const uhdmoviesExtractor = new UHDMoviesExtractor();

      const { imdbId, tmdbId, showName, type, season, episode } = req.input;

      const goMoviesPromise = goMoviesExtractor.extractUrls(showName, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const primeWirePromise = primeWireExtractor.extractUrls(showName, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const putLockerPromise = putLockerExtractor.extractUrls(showName, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const superStreamPromise = superStreamExtractor.extractUrls(showName, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const twoEmbedPromise = twoEmbedExtractor.extractUrls(imdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const vidSrcPromise = vidSrcExtractor.extractUrls(imdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const remoteStreamPromise = remoteStreamExtractor.extractUrls(imdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const smashyStreamPromise = smashyStreamExtractor.extractUrls(imdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const moviesApipromise = moviesApiExtractor.extractUrls(tmdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const vidSrcToPromise = vidSrcToExtractor.extractUrls(imdbId, type, season, episode).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const vegaMoviesPromise = vegaMoviesExtractor.extractUrls(showName, type).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const uhdmoviesPromise = uhdmoviesExtractor.extractUrls(showName, type).then((sources) => {
        ee.emit('sources', sources);
        return sources;
      });

      const allPromises = [
        goMoviesPromise,
        primeWirePromise,
        putLockerPromise,
        superStreamPromise,
        twoEmbedPromise,
        vidSrcPromise,
        remoteStreamPromise,
        smashyStreamPromise,
        moviesApipromise,
        vidSrcToPromise,
        vegaMoviesPromise,
        uhdmoviesPromise,
      ];

      const allSources = await Promise.all(allPromises);

      const sources = allSources.flat();

      return sources;
    }),

  getSourcesSubscription: t.procedure.subscription(() => {
    return observable((emit) => {
      function onSources(sources: Source[]) {
        emit.next(sources);
      }

      ee.on('sources', onSources);

      return () => {
        ee.off('sources', onSources);
      };
    });
  }),
});
