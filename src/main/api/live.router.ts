import { z } from 'zod';
import { PakTech2Extractor } from '../extractors/live/paktech2';
import { t } from './trpc-client';

export const liveRouter = t.router({
  getMainPage: t.procedure.query(async () => {
    const pakTech2Extractor = new PakTech2Extractor();
    const sources = await pakTech2Extractor.getMainPage();

    return sources;
  }),

  getLiveUrl: t.procedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(async (req) => {
      const pakTech2Extractor = new PakTech2Extractor();
      const source = await pakTech2Extractor.extractUrl(req.input.url);

      return source;
    }),
});
