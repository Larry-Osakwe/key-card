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
      className={`w-full h-[calc(100vh-160px)] max-w-4xl mx-auto flex flex-col overflow-hidden shadow-lg transition-all duration-300 ${isHovered ? 'shadow-xl scale-[1.005]' : 'shadow-md'} border-slate-200 dark:border-slate-700`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center">
        <div className={`mr-2 p-1.5 rounded-full transition-colors ${isHovered ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`}>
          <MessageSquare className="h-5 w-5 text-indigo-500" />
        </div>
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Conversation</h2>
        <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {messages.length > 0 ? `${messages.length} message${messages.length === 1 ? '' : 's'}` : 'No messages yet'}
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