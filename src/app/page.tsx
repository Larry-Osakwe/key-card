'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/ChatContainer';
import { type Message } from '@/types/conversation';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSendMessage = async (content: string) => {
    // Create a new message
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // Add the message to the list
    setMessages(prev => [...prev, newMessage]);
    
    // TODO: Implement actual message handling and PR analysis
    setIsAnalyzing(true);
    // Simulate response for now
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

  return (
    <main className="min-h-screen p-4">
      <ChatContainer
        messages={messages}
        isAnalyzing={isAnalyzing}
        onSendMessage={handleSendMessage}
      />
    </main>
  );
}
