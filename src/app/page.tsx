'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { PRInput } from '@/components/PRInput';
import { type Message } from '@/types/conversation';
import { trpc } from '@/utils/trpc';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use tRPC mutations
  const sendMessageMutation = trpc.message.sendMessage.useMutation({
    onSuccess: (data) => {
      console.log('Message sent:', data);
      
      // Simulate assistant response (this will be replaced with actual tRPC call)
      setTimeout(() => {
        const response: Message = {
          id: crypto.randomUUID(),
          content: 'This is a simulated response using tRPC. The actual analysis will be implemented with the Python backend.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, response]);
        setIsAnalyzing(false);
      }, 1000);
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
    <main className="min-h-screen p-4">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-4">
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
        <div className="hidden lg:block lg:col-start-3" />
      </div>
    </main>
  );
}
