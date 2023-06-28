import path from 'path';
import { ChildProcess, fork } from 'child_process';
import log from 'electron-log';

const logger = log.scope('VidSrc Proxy');

const PROXY_PATH =
  process.env.NODE_ENV === 'production' ? path.join(process.resourcesPath, 'proxy/@warren-bank/hls-proxy/proxy.js') : path.join(__dirname, '../../../proxy/@warren-bank/hls-proxy/proxy.js');

let proxy: ChildProcess | null = null;

export const startProxy = (referer: string, origin?: string) => {
  try {
    if (proxy) {
      proxy.kill();
    }
    proxy = fork(path.join(PROXY_PATH), ['--port', '7687', '--host', 'localhost', `--referer ${referer}`, '-v', '-1'], {
      detached: true,
      env: {
        ELECTRON_RUN_AS_NODE: '1',
      },
    });
    proxy.on('message', (msg) => {
      logger.info(msg);
    });
    proxy.on('error', (err) => {
      logger.error('err', err);
    });
    proxy.on('exit', (code, signal) => {
      logger.info('exit', code, signal);
    });
    proxy.on('close', (code, signal) => {
      logger.info('close', code, signal);
    });
  } catch (error) {
    logger.error(error);
  }
};

export const stopProxy = () => {
  if (proxy) {
    proxy.kill();
  }
};
