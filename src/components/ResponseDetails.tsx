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
    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {sourceCount > 0 && (
            <div className="flex items-center">
              <Info className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="ml-1">{sourceCount} source{sourceCount === 1 ? '' : 's'}</span>
            </div>
          )}
          {sourceCount > 0 && hasScores && <span className="mx-2">•</span>}
          {scores && (
            <div className="flex items-center">
              <BarChart className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              <span className="ml-1">{(scores.overall * 100).toFixed(0)}% confidence</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
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
