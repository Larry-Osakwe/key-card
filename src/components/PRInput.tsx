'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PRInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export function PRInput({ onSubmit, disabled = false }: PRInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold mb-4">Analyze Pull Request</h2>
        <div className="space-y-4">
          <Input
            placeholder="Enter GitHub PR URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={disabled || !url.trim()}
          >
            Analyze PR
          </Button>
        </div>
      </form>
    </Card>
  );
} 