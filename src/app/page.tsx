'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { PRInput } from '@/components/PRInput';
import { type Message } from '@/types/conversation';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    
    // TODO: Implement actual message handling and PR analysis
    setIsAnalyzing(true);
    setTimeout(() => {
      const response: Message = {
        id: crypto.randomUUID(),
        content: 'This is a simulated response. The actual PR analysis will be implemented later.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsAnalyzing(false);
    }, 1000);
  };

  const handlePRSubmit = (url: string) => {
    // TODO: Implement PR analysis
    const initialMessage: Message = {
      id: crypto.randomUUID(),
      content: `Analyzing PR: ${url}`,
      role: 'assistant',
      timestamp: new Date(),
      prMetadata: { url }
    };
    setMessages([initialMessage]);
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
