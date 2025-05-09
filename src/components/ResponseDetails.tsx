'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, BarChart } from 'lucide-react';
import { Source, Score } from '@/types/conversation';
import { SourcesList } from './SourcesList';
import { ScoreDisplay } from './ScoreDisplay';

interface ResponseDetailsProps {
  sources?: Source[];
  scores?: Score;
}

export function ResponseDetails({ sources, scores }: ResponseDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Early return if no data to display
  if (!sources?.length && !scores) return null;

  // Get the number of sources safely
  const sourceCount = sources?.length ?? 0;
  const hasScores = !!scores;

  return (
    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
        >
          {isExpanded ? '[HIDE DETAILS]' : '[SHOW DETAILS]'}
        </button>
        <div className="ml-auto flex items-center">
          <span className="mr-2">{sourceCount} SOURCES</span>
          {scores && (
            <>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 relative">
                <div 
                  className="h-full bg-blue-600 dark:bg-blue-500" 
                  style={{ width: `${scores.overall * 100}%` }}
                ></div>
              </div>
              <span className="ml-1">{Math.round(scores.overall * 100)}% CONFIDENCE</span>
            </>
          )}
        </div>
      </div>
      
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="mt-3 space-y-4">
          {sourceCount > 0 && sources && <SourcesList sources={sources} />}
          {scores && <ScoreDisplay scores={scores} />}
        </div>
      </div>
    </div>
  );
}
