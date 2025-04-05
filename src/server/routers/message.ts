import { z } from 'zod';
import { procedure, router } from '../trpc';
import { analyzePR, generateResponse } from '../services/python-service';

export const messageRouter = router({
  sendMessage: procedure
    .input(z.object({
      content: z.string(),
      role: z.enum(['user', 'assistant']),
      prUrl: z.string().url().optional()
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

  analyzePR: procedure
    .input(z.object({
      prUrl: z.string()
    }))
    .mutation(async ({ input }) => {
      // Check if the URL is valid before proceeding
      try {
        // Validate URL format
        new URL(input.prUrl);
        
        // Process the PR analysis through Python service
        const result = await analyzePR({
          content: '',
          pr_url: input.prUrl,
        });

        return {
          content: result.content,
          success: result.success,
          timestamp: new Date()
        };
      } catch {
        // Return a user-friendly error message for invalid URLs
        return {
          content: `Invalid GitHub URL: "${input.prUrl}". Please provide a valid GitHub pull request URL.`,
          success: false,
          timestamp: new Date()
        };
      }
    }),

  generateResponse: procedure
    .input(z.object({
      messageId: z.string(),
      previousContent: z.string(),
      conversationHistory: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Generate response through Python service
      const result = await generateResponse({
        content: input.previousContent,
        previous_content: input.conversationHistory // Pass conversation history
      });

      return {
        content: result.content,
        success: result.success,
        timestamp: new Date()
      };
    })
}); 