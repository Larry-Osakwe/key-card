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
    <form onSubmit={handleSubmit} className="flex border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
      <Input
        placeholder="TYPE YOUR MESSAGE..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        disabled={disabled}
        className="flex-1 bg-white dark:bg-slate-900 border-blue-600 dark:border-blue-500 font-mono rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button 
        type="submit" 
        disabled={disabled || !input.trim()} 
        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-none font-mono"
      >
        {disabled ? 'SENDING...' : 'SEND'}
      </Button>
    </form>
  );
} 