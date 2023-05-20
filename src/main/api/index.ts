import { appRouter } from './app.router';
import { openSubtitlesRouter } from './opensubtitles/api';
import { proxyRouter } from './proxy.router';
import { tmdbRouter } from './tmdb/api';
import { t } from './trpc-client';
import { updaterRouter } from './updater.router';

export const router = t.router({
  app: appRouter,
  updater: updaterRouter,
  proxy: proxyRouter,
  tmdb: tmdbRouter,
  opensubtitles: openSubtitlesRouter,
});

export type AppRouter = typeof router;
