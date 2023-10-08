import axios from 'axios';
import z from 'zod';
import { startProxy, stopProxy } from '../lib/mp4-proxy/command';
import { startM3U8Proxy, stopM3U8Proxy } from '../lib/m3u8-proxy';
import { t } from './trpc-client';

export const proxyRouter = t.router({
  start: t.procedure
    .input(
      z.object({
        type: z.enum(['mp4', 'm3u8', 'mkv']),
        referer: z.string().optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      if (input.type === 'mp4') {
        startProxy();
        return;
      }
      startM3U8Proxy(input.referer, input.origin);
    }),
  stop: t.procedure.mutation(() => {
    stopProxy();
    stopM3U8Proxy();
  }),
  validate: t.procedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .query(async ({ input }) => {
      const uri = new URL(input.url);
      const { host } = uri;

      let referer = `${host.split('.').slice(-2).join('.')}/`;
      referer = `https://${referer}`;

      const res = await axios.get(input.url, { headers: { referer } });
      return res.data;
    }),
});
