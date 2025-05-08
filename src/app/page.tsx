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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800 dark:text-slate-100 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-500">Support</span>
            <span className="mx-1">&nbsp;|&nbsp;</span>
            <span>Assistant</span>
          </h1>
          <div className="h-1 w-40 mx-auto mt-3 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-500 rounded-full"></div>
          <p className="text-center text-slate-600 dark:text-slate-400 mt-4">
            Get answers to your support questions with verified sources
          </p>
        </header>
        
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 md:gap-6">
          {/* <div className="lg:col-start-1">
            <PRInput onSubmit={handlePRSubmit} disabled={isAnalyzing} />
          </div> */}
          <div className="w-full max-w-5xl mx-auto lg:col-start-2">
            <ChatContainer
              messages={messages}
              isAnalyzing={isAnalyzing}
              onSendMessage={handleSendMessage}
            />
          </div>
          <div className="hidden lg:block lg:col-start-3">
            {/* <Card className="p-5 shadow-md hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center mb-4">
                <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-red-100 dark:from-indigo-900/30 dark:to-red-900/20 rounded-full mr-2 shadow-inner">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16H12.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Tips</h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Enter a GitHub PR URL to get an analysis
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Ask follow-up questions about the PR
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  Request code suggestions for improvements
                </li>
                <li className="flex items-start mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                  <span className="text-amber-500 mr-2">⚠️</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    The backend service may take up to a minute to wake up on first use after a period of inactivity.
                  </span>
                </li>
              </ul>
            </Card> */}
          </div>
        </div>
      </div>
    </main>
  );
}
