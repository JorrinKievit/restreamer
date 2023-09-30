import { appRouter } from './app.router';
import { liveRouter } from './live.router';
import { openSubtitlesRouter } from './opensubtitles/api.router';
import { proxyRouter } from './proxy.router';
import { tmdbRouter } from './tmdb/api.router';
import { t } from './trpc-client';
import { updaterRouter } from './updater.router';
import { vidSrcRouter } from './vidsrc.router';

export const router = t.router({
  app: appRouter,
  live: liveRouter,
  updater: updaterRouter,
  proxy: proxyRouter,
  vidsrc: vidSrcRouter,
  tmdb: tmdbRouter,
  opensubtitles: openSubtitlesRouter,
});

export type AppRouter = typeof router;
