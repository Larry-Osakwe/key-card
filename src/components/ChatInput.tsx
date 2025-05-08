'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontal, Lightbulb } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {isFocused && (
        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-2 animate-fadeIn">
          <Lightbulb className="h-3 w-3 mr-1" />
          <span>Try asking about account issues, billing questions, or device troubleshooting</span>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className="flex-1 border-slate-300 dark:border-slate-600 focus-visible:ring-red-500 shadow-sm transition-shadow"
        />
        <Button 
          type="submit" 
          disabled={disabled || !input.trim()} 
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all ${!input.trim() ? 'opacity-70' : 'opacity-100'}`}
        >
          <SendHorizontal className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  );
} 