'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { type Message } from '@/types/conversation';

interface ChatContainerProps {
  messages: Message[];
  isAnalyzing?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatContainer({ messages, isAnalyzing = false, onSendMessage }: ChatContainerProps) {
  return (
    <Card className="w-full h-[calc(100vh-2rem)] max-w-4xl mx-auto flex flex-col">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <MessageList messages={messages} isAnalyzing={isAnalyzing} />
        </ScrollArea>
      </div>
      <div>
        <ChatInput onSendMessage={onSendMessage} disabled={isAnalyzing} />
      </div>
    </Card>
  );
} 