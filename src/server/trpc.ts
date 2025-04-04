import { initTRPC } from '@trpc/server';

/**
 * Context definition - information available to all API procedures
 */
export const createTRPCContext = async ({ req }: { req: Request }) => {
  return {
    req,
  };
};

/**
 * Initialize tRPC API
 */
const t = initTRPC.context<typeof createTRPCContext>().create();

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const procedure = t.procedure; 