import { z } from 'zod';
import { CricFoot2Extractor } from '../extractors/live/cricfoot2';
import { t } from './trpc-client';

export const liveRouter = t.router({
  getMainPage: t.procedure.query(async () => {
    const cricFoot2Extractor = new CricFoot2Extractor();
    const sources = await cricFoot2Extractor.getMainPage();

    return sources;
  }),

  getLiveUrl: t.procedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(async (req) => {
      const cricFoot2Extractor = new CricFoot2Extractor();
      const source = await cricFoot2Extractor.extractUrls(req.input.url);

      return source;
    }),
});
