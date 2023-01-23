import axios from 'axios';
import { ipcMain } from 'electron';

ipcMain.handle('validate-vidsrc', async (event, url) => {
  const uri = new URL(url);
  const { host } = uri;

  let referer = `${host.split('.').slice(-2).join('.')}/`;
  referer = `https://${referer}`;

  const res = await axios.get(url, { headers: { referer } });
  console.log(url, res.data);
  return res.data;
});
