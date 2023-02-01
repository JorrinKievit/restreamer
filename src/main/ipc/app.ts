import { app, ipcMain } from 'electron';

ipcMain.handle('get-version', () => {
  return app.getVersion();
});
