import { z } from "zod";
import { launchVlc, stopVlc } from "../lib/vlc";
import { t } from "./trpc-client";

export const vlcRouter = t.router({
  launch: t.procedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .mutation(({ input }) => {
      launchVlc(input.url);
    }),
  quit: t.procedure.mutation(() => {
    stopVlc();
  }),
});
