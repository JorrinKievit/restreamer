import { app } from 'electron';
import z from 'zod';
import { Sources } from 'types/sources';
import { GoMoviesExtractor } from '../extractors/gomovies';
import { TwoEmbedExtractor } from '../extractors/2embed';
import { SuperStreamExtractor } from '../extractors/superstream/superstream';
import { VidSrcExtractor } from '../extractors/vidsrc';
import { t } from './trpc-client';

export const appRouter = t.router({
  getAppVersion: t.procedure.query(() => {
    return app.getVersion();
  }),
  getSources: t.procedure
    .input(
      z.object({
        imdbId: z.string(),
        showName: z.string(),
        type: z.enum(['movie', 'tv']),
        season: z.number().optional(),
        episode: z.number().optional(),
      })
    )
    .query(async (req) => {
      const goMoviesExtractor = new GoMoviesExtractor();
      const superStreamExtractor = new SuperStreamExtractor();
      const twoEmbedExtractor = new TwoEmbedExtractor();
      const vidSrcExtractor = new VidSrcExtractor();

      const { imdbId, showName, type, season, episode } = req.input;

      const GoMoviesSources = await goMoviesExtractor.extractUrls(
        showName,
        type,
        season,
        episode
      );

      const superStreamSources = await superStreamExtractor.extractUrls(
        showName,
        type,
        season,
        episode
      );

      const twoEmbedSources = await twoEmbedExtractor.extractUrls(
        imdbId,
        type,
        season,
        episode
      );

      const vidSrcSources = await vidSrcExtractor.extractUrls(
        imdbId,
        type,
        season,
        episode
      );

      const sources: Sources = [
        ...GoMoviesSources,
        ...superStreamSources,
        ...twoEmbedSources,
        ...vidSrcSources,
      ];

      return sources;
    }),
});
