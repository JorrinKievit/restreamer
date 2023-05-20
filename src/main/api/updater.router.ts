import { autoUpdater } from 'electron-updater';
import { t } from './trpc-client';

export const updaterRouter = t.router({
  quitAndInstall: t.procedure.mutation(async () => {
    autoUpdater.quitAndInstall(false, true);
  }),
});
