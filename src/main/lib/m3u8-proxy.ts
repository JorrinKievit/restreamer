import path from 'path';
import { ChildProcess, fork } from 'child_process';
import log from 'electron-log';

const logger = log.scope('M3U8 Proxy');

const PROXY_PATH =
  process.env.NODE_ENV === 'production' ? path.join(process.resourcesPath, 'proxy/@warren-bank/hls-proxy/proxy.js') : path.join(__dirname, '../../../proxy/@warren-bank/hls-proxy/proxy.js');

let proxy: ChildProcess | null = null;

export const startM3U8Proxy = (referer?: string, origin?: string) => {
  try {
    if (proxy) {
      proxy.kill();
    }
    proxy = fork(path.join(PROXY_PATH), ['--port', '7687', '--host', 'localhost', `--referer ${referer}`, '-v', '-1', `--origin ${origin}`], {
      detached: true,
      env: {
        ELECTRON_RUN_AS_NODE: '1',
      },
    });
  } catch (error) {
    logger.error(error);
  }
};

export const stopM3U8Proxy = () => {
  if (proxy) {
    proxy.kill();
  }
};
