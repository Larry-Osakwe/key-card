'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { type Message } from '@/types/conversation';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  isAnalyzing?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatContainer({ messages, isAnalyzing = false, onSendMessage }: ChatContainerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Automatically scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  return (
    <Card 
      className="w-full h-[calc(100vh-160px)] max-w-4xl mx-auto flex flex-col overflow-hidden border-blue-600 dark:border-blue-500 border-[1px] bg-slate-50 dark:bg-slate-900"
    >
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-blue-600 dark:border-blue-500 px-4 py-3 flex items-center">
        <div className="mr-2 p-1.5">
          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-500" />
        </div>
        <h2 className="font-mono uppercase text-slate-800 dark:text-slate-200">CONVERSATION</h2>
        <div className="ml-auto text-xs font-mono text-slate-600 dark:text-slate-400">
          {messages.length > 0 ? `[MESSAGES: ${messages.length}]` : '[NO MESSAGES]'}
        </div>
      </div>
      
      <div className="flex-1 min-h-0" ref={scrollAreaRef}>
        <ScrollArea className="h-full bg-white dark:bg-slate-900">
          <MessageList messages={messages} isAnalyzing={isAnalyzing} />
        </ScrollArea>
      </div>
      
      <div>
        <ChatInput onSendMessage={onSendMessage} disabled={isAnalyzing} />
      </div>
    </Card>
  );
} 