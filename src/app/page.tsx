'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { type Message } from '@/types/conversation';
import { trpc } from '@/utils/trpc';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use tRPC mutations for sending messages and generating responses
  const sendMessageMutation = trpc.message.sendMessage.useMutation();

  // Use tRPC mutations for generating responses
  const generateResponseMutation = trpc.message.generateResponse.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const response: Message = {
          id: crypto.randomUUID(),
          content: data.content,
          role: 'assistant',
          timestamp: new Date(),
          // Add sources and scores from the response
          sources: data.sources,
          scores: data.scores
        };
        setMessages(prev => [...prev, response]);
      } else {
        // Handle error returned as success: false
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          content: data.content || 'Failed to generate a response. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Error generating response:', error);

      // Add error message and reset state
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: 'Failed to generate a response due to a server error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsAnalyzing(false);
    }
  });

  // Helper function to extract conversation history
  const getConversationHistory = (msgs: Message[]): string => {
    // Limit to last 10 messages to avoid token limits
    const recentMessages = msgs.slice(-10);

    return recentMessages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  };

  // Handle sending a new message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Step 1: Store the user message
    const userMessageResult = await sendMessageMutation.mutateAsync({
      content,
      role: 'user'
    });

    const newMessage: Message = {
      id: userMessageResult.messageId,
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsAnalyzing(true);

    // Step 2: Generate a response
    await generateResponseMutation.mutateAsync({
      messageId: userMessageResult.messageId,
      previousContent: content,
      conversationHistory: getConversationHistory(messages)
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-center text-slate-800 dark:text-slate-100 flex items-center justify-center uppercase">
            <span className="text-blue-600 dark:text-blue-500">SUPPORT</span>
            <span className="mx-1">&nbsp;|&nbsp;</span>
            <span>ASSISTANT</span>
          </h1>
          <div className="h-1 w-40 mx-auto mt-3 bg-blue-600 dark:bg-blue-500"></div>
          <p className="text-center text-slate-600 dark:text-slate-400 mt-4 uppercase text-sm tracking-wide font-mono">
            [STATUS: ONLINE] Get answers with verified sources
          </p>
        </header>

        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 md:gap-6">
          <div className="w-full max-w-5xl mx-auto lg:col-start-2">
            <ChatContainer
              messages={messages}
              isAnalyzing={isAnalyzing}
              onSendMessage={handleSendMessage}
            />
          </div>
          <div className="hidden lg:block lg:col-start-3">
          </div>
        </div>
      </div>
    </main>
  );
}
