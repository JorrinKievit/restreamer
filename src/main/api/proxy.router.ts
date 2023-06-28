import axios from 'axios';
import z from 'zod';
import { startProxy, stopProxy } from '../lib/proxy';
import { t } from './trpc-client';

export const proxyRouter = t.router({
  start: t.procedure
    .input(
      z.object({
        referer: z.string(),
        origin: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      startProxy(input.referer, input.origin);
    }),
  stop: t.procedure.mutation(() => {
    stopProxy();
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
