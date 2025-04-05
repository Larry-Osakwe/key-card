'use client';

import { type Message } from '@/types/conversation';
import ReactMarkdown from 'react-markdown';
import { ReactNode } from 'react';

interface MessageListProps {
  messages: Message[];
  isAnalyzing?: boolean;
}

// Define proper types for markdown components
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

export function MessageList({ messages, isAnalyzing = false }: MessageListProps) {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <div key={message.id}>
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
              {message.role === 'user' ? (
                <div className="text-sm md:text-base">{message.content}</div>
              ) : (
                <div className="markdown-content prose dark:prose-invert prose-sm md:prose-base max-w-none">
                  <ReactMarkdown
                    components={{
                      // Enhance headings
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold border-b pb-2 mb-4 text-gray-900 dark:text-gray-100">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-md font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-300">
                          {children}
                        </h3>
                      ),
                      // Style code blocks with better formatting
                      code: ({ node, inline, className, children, ...props }: CodeProps) => {
                        // For inline code, return a simple code element
                        if (inline) {
                          return (
                            <code className="px-1 py-0.5 rounded text-sm font-mono bg-gray-100 dark:bg-gray-900 text-pink-500 dark:text-pink-400" {...props}>
                              {children}
                            </code>
                          );
                        }
                        
                        // For non-inline code blocks, return properly styled code
                        return (
                          <code className="block whitespace-pre overflow-x-auto my-3 rounded-md bg-gray-100 dark:bg-gray-900 p-3 text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Override default paragraph to avoid nesting issues
                      p: ({ children, ...props }) => {
                        return (
                          <p className="mb-4 text-gray-700 dark:text-gray-300" {...props}>
                            {children}
                          </p>
                        );
                      },
                      // Pre-formatted code blocks
                      pre: ({ children, ...props }) => {
                        return (
                          <pre className="overflow-auto my-4 rounded-md bg-gray-100 dark:bg-gray-900 p-3 text-sm font-mono border border-gray-200 dark:border-gray-700" {...props}>
                            {children}
                          </pre>
                        );
                      },
                      // Enhance lists
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">
                          {children}
                        </li>
                      ),
                      // Style blockquotes
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                          {children}
                        </blockquote>
                      ),
                      // Style tables to be more readable
                      table: ({ children }) => (
                        <div className="overflow-x-auto w-full my-4 rounded-md">
                          <table className="border-collapse table-auto w-full text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      // Style table headers
                      th: ({ children }) => (
                        <th className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-medium p-2 text-left">
                          {children}
                        </th>
                      ),
                      // Style table cells
                      td: ({ children }) => (
                        <td className="border border-gray-300 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-300">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {isAnalyzing && (
        <div className="flex justify-start">
          <div className="max-w-[80%] px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-gray-600 dark:text-gray-400">Analyzing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 