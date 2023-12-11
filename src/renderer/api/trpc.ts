import { createTRPCReact } from "@trpc/react-query";
import { AppRouter } from "main/api";

export const client = createTRPCReact<AppRouter>();
