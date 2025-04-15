'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { PRInput } from '@/components/PRInput';
import { type Message } from '@/types/conversation';
import { trpc } from '@/utils/trpc';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFirstRequest, setIsFirstRequest] = useState(true);

  // Use tRPC mutations for generating responses
  const generateResponseMutation = trpc.message.generateResponse.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const response: Message = {
          id: crypto.randomUUID(),
          content: data.content,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
        // After first successful response, reset first request flag
        setIsFirstRequest(false);
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
      
      // Customize error message based on whether this is first request (likely cold start)
      let errorMessage = 'Failed to generate a response due to a server error. Please try again.';
      
      if (isFirstRequest) {
        errorMessage = 'The backend service is warming up (this may take up to a minute on first use). Please try again shortly.';
      }
      
      // Add error message and reset state
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsAnalyzing(false);
    }
  });

  // Use tRPC mutations
  const sendMessageMutation = trpc.message.sendMessage.useMutation({
    onSuccess: (data) => {
      console.log('Message sent:', data);
      
      // Create conversation history string from previous messages
      const conversationHistory = getConversationHistory(messages);
      
      // Call the actual backend to generate a response
      generateResponseMutation.mutate({
        messageId: data.messageId,
        previousContent: data.content,
        conversationHistory: conversationHistory
      });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      
      // Add error message and reset state
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: 'Failed to send message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsAnalyzing(false);
    }
  });
  
  const analyzePRMutation = trpc.message.analyzePR.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const response: Message = {
          id: crypto.randomUUID(),
          content: data.content,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
        // After first successful response, reset first request flag
        setIsFirstRequest(false);
      } else {
        // Handle error returned as success: false
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          content: data.content || 'Failed to analyze the PR. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Error analyzing PR:', error);
      
      // Customize error message based on whether this is first request (likely cold start)
      let errorMessage = 'Failed to analyze the PR due to a server error. Please try again.';
      
      if (isFirstRequest) {
        errorMessage = 'The backend service is warming up (this may take up to a minute on first use). Please try again shortly.';
      }
      
      // Add error message and reset state
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: errorMessage,
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

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsAnalyzing(true);
    
    // Use tRPC to send the message
    sendMessageMutation.mutate({
      content,
      role: 'user',
    });
  };

  const handlePRSubmit = (url: string) => {
    const initialMessage: Message = {
      id: crypto.randomUUID(),
      content: `Analyzing PR: ${url}`,
      role: 'assistant',
      timestamp: new Date(),
      prMetadata: { url }
    };
    // Append to messages instead of replacing
    setMessages(prev => [...prev, initialMessage]);
    setIsAnalyzing(true);
    
    // Use tRPC to analyze the PR
    analyzePRMutation.mutate({ prUrl: url });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800 dark:text-slate-100 flex items-center justify-center">
            <span className="text-red-600 dark:text-red-500">PR</span>
            <span className="mx-1">&nbsp;|&nbsp;</span>
            <span>Assistant</span>
          </h1>
          <div className="h-1 w-40 mx-auto mt-3 bg-gradient-to-r from-indigo-500 via-red-600 to-indigo-500 rounded-full"></div>
          <p className="text-center text-slate-600 dark:text-slate-400 mt-4">
            Analyze pull requests and get intelligent feedback
          </p>
        </header>
        
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4 md:gap-6">
          <div className="lg:col-start-1">
            <PRInput onSubmit={handlePRSubmit} disabled={isAnalyzing} />
          </div>
          <div className="w-full max-w-5xl mx-auto lg:col-start-2">
            <ChatContainer
              messages={messages}
              isAnalyzing={isAnalyzing}
              onSendMessage={handleSendMessage}
            />
          </div>
          <div className="hidden lg:block lg:col-start-3">
            <Card className="p-5 shadow-md hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
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
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
