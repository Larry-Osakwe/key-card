import { z } from 'zod';
import { procedure, router } from '../trpc';
import { generateResponse } from '../services/langgraph-service';

export const messageRouter = router({
  sendMessage: procedure
    .input(z.object({
      content: z.string(),
      role: z.enum(['user', 'assistant'])
    }))
    .mutation(async ({ input }) => {
      // Store user message immediately
      return {
        messageId: crypto.randomUUID(),
        role: 'user' as const,
        content: input.content,
        timestamp: new Date()
      };
    }),

  generateResponse: procedure
    .input(z.object({
      messageId: z.string(),
      previousContent: z.string(),
      conversationHistory: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Generate response using the support service
      const result = await generateResponse(input.previousContent);

      return {
        content: result.content,
        sources: result.sources,
        scores: result.scores,
        success: result.success,
        timestamp: new Date()
      };
    })
}); 