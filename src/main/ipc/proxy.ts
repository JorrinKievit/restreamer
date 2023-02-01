import { ipcMain } from 'electron';
import path from 'path';
import { ChildProcess, fork } from 'child_process';

const PROXY_PATH =
  process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'proxy/@warren-bank/hls-proxy/proxy.js')
    : path.join(__dirname, '../../../proxy/@warren-bank/hls-proxy/proxy.js');

let proxy: ChildProcess | null = null;

ipcMain.on('start-proxy', (event, referer, origin) => {
  if (proxy) {
    proxy.kill();
  }
  proxy = fork(
    path.join(PROXY_PATH),
    [
      '--port',
      '7687',
      '--host',
      'localhost',
      `--referer ${referer}`,
      '--origin',
      origin,
      '-v',
      '4',
    ],
    {
      detached: true,
      env: {
        ELECTRON_RUN_AS_NODE: '1',
      },
    }
  );
  event.reply('proxy-started');
  proxy.on('message', (msg) => {
    console.log(msg);
  });
  proxy.on('error', (err) => {
    console.log('err', err);
  });
  proxy.on('exit', (code, signal) => {
    console.log('exit', code, signal);
  });
  proxy.on('close', (code, signal) => {
    console.log('close', code, signal);
  });
});

ipcMain.on('stop-proxy', (event) => {
  if (proxy) {
    proxy.kill();
  }
  event.reply('proxy-stopped');
});
