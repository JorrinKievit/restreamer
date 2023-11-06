import path from 'path';
import { ChildProcess, fork } from 'child_process';
import log from 'electron-log';

const logger = log.scope('M3U8 Proxy');

const PROXY_PATH =
  process.env.NODE_ENV === 'production'
    ? path.join(process.resourcesPath, 'node_modules/@warren-bank/hls-proxy/hls-proxy/bin/hlsd.js')
    : path.join(__dirname, '../../../node_modules/@warren-bank/hls-proxy/hls-proxy/bin/hlsd.js');

let proxy: ChildProcess | null = null;

interface StartM3U8ProxyOptions {
  referer?: string;
  origin?: string | null;
  userAgent?: string;
}

export const startM3U8Proxy = (options: StartM3U8ProxyOptions) => {
  try {
    if (proxy) {
      proxy.kill();
    }
    proxy = fork(
      path.join(PROXY_PATH),
      ['--port', '7687', '--host', 'localhost', '--referer', `"${options.referer}"`, '-v', '0', '--origin', `"${options.origin}"`, '--useragent', `"${options.userAgent}"`],
      {
        detached: true,
        env: {
          ELECTRON_RUN_AS_NODE: '1',
        },
      }
    );
  } catch (error) {
    logger.error(error);
  }
};

export const stopM3U8Proxy = () => {
  if (proxy) {
    proxy.kill();
  }
};
