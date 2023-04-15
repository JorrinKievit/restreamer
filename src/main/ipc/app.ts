import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.on('app-update-available-confirm', () => {
  autoUpdater.quitAndInstall(false, true);
});
