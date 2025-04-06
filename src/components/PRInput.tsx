'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GitPullRequest, ArrowRight } from 'lucide-react';

interface PRInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function PRInput({ onSubmit, disabled = false }: PRInputProps) {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
  };

  return (
    <Card className="p-5 shadow-md hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center mb-4 text-slate-800 dark:text-slate-200">
          <GitPullRequest className="h-5 w-5 mr-2 text-indigo-500" />
          <h2 className="text-lg font-semibold">Analyze Pull Request</h2>
        </div>
        
        <div className="space-y-4">
          <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
            <Input
              placeholder="Enter GitHub PR URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              className="pr-10 shadow-sm border-slate-300 dark:border-slate-600 focus-visible:ring-indigo-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ArrowRight className={`h-4 w-4 transition-colors ${url.trim() ? 'text-indigo-500' : 'text-slate-400'}`} />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all" 
            disabled={disabled || !url.trim()}
          >
            {disabled ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing
              </span>
            ) : (
              <span>Analyze PR</span>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
} 