import path from 'path';
import { ChildProcess, fork } from 'child_process';
import log from 'electron-log';

const logger = log.scope('MP4 Proxy');

const PROXY_PATH = path.join(__dirname, './proxy');

let proxy: ChildProcess | null = null;

export const startProxy = () => {
  try {
    if (proxy) {
      proxy.kill();
    }
    proxy = fork(path.join(PROXY_PATH), {
      detached: true,
      env: {
        ELECTRON_RUN_AS_NODE: '1',
      },
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
