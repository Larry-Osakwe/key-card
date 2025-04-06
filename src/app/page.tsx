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
        content: 'Failed to generate a response due to a server error. Please try again later.',
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
      
      // Add error message and reset state
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        content: 'Failed to analyze the PR due to a server error. Please try again later.',
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
          <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800 dark:text-slate-100">
            Adobe PR Assistant
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mt-2">
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
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-3">Tips</h2>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li>• Enter a GitHub PR URL to get an analysis</li>
                <li>• Ask follow-up questions about the PR</li>
                <li>• Request code suggestions for improvements</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
