'use client';

import { type Message } from '@/types/conversation';

interface MessageListProps {
  messages: Message[];
  isAnalyzing?: boolean;
}

export function MessageList({ messages, isAnalyzing = false }: MessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div key={message.id}>
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {message.content}
            </div>
          </div>
        </div>
      ))}
      {isAnalyzing && (
        <div className="flex justify-start">
          <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted animate-pulse">
            Analyzing...
          </div>
        </div>
      )}
    </div>
  );
} 