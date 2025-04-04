import { router } from './trpc';
import { messageRouter } from './routers/message';

export const appRouter = router({
  message: messageRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter; 