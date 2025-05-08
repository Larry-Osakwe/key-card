'use client';

import { type Message } from '@/types/conversation';
import ReactMarkdown from 'react-markdown';
import { ReactNode } from 'react';
import { Bot, Info } from 'lucide-react';
import { ResponseDetails } from './ResponseDetails';

interface MessageListProps {
  messages: Message[];
  isAnalyzing?: boolean;
}

// Define proper types for markdown components
type BaseProps = {
  children?: ReactNode;
  className?: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- 
   * The `node` prop from react-markdown has a complex type that varies based on the markdown AST node type.
   * Using `any` here is acceptable as we don't directly use the node prop in our components,
   * but need to pass it through to satisfy react-markdown's internal typing.
   */
  node?: any;
};

type CodeProps = BaseProps & {
  inline?: boolean;
};

export function MessageList({ messages, isAnalyzing = false }: MessageListProps) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-full mb-4 shadow-inner">
            <Info className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
            Welcome to <span className="text-blue-600 dark:text-blue-400 font-semibold">Support Assistant</span>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Ask me any customer support question to get started. I'll provide answers with verified sources.
          </p>
        </div>
      )}
      
      {messages.map((message, index) => (
        <div key={message.id} className={`animate-fadeIn opacity-0 animation-delay-${index % 5}`}>
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center mr-3 mt-1 shadow-inner">
                <Bot className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
            )}
            
            <div className={`max-w-[85%] px-4 py-3 rounded-lg shadow-sm border ${
              message.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-tl-none'
            }`}>
              {/* PR metadata removed - no longer needed for support system */}
              
              {message.role === 'user' ? (
                <div className="text-sm md:text-base">{message.content}</div>
              ) : (
                <div className="markdown-content prose dark:prose-invert prose-sm md:prose-base max-w-none">
                  <ReactMarkdown
                    components={{
                      // Enhance headings with clear styling and hierarchy
                      h2: ({ children, ...props }: BaseProps) => (
                        <h2 className="text-xl font-bold mt-4 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children, ...props }: BaseProps) => (
                        <h3 className="text-lg font-semibold mt-5 mb-3 text-gray-800 dark:text-gray-200" {...props}>
                          {children}
                        </h3>
                      ),
                      h4: ({ children, ...props }: BaseProps) => (
                        <h4 className="text-base font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </h4>
                      ),
                      // Handle code elements
                      code: ({ inline, className, children, ...props }: CodeProps) => {
                        // For inline code that's a single word/identifier, use a simpler style
                        if (inline && typeof children === 'string' && !children.includes(' ')) {
                          return (
                            <span className="font-mono text-pink-500 dark:text-pink-400 bg-transparent px-0" {...props}>
                              {children}
                            </span>
                          );
                        }
                        
                        // For inline code with spaces, use subtle background
                        if (inline) {
                          return (
                            <code className="px-1.5 py-0.5 mx-0.5 rounded text-sm font-mono bg-gray-100/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200" {...props}>
                              {children}
                            </code>
                          );
                        }
                        
                        // For actual code blocks, use full styling
                        const match = /language-(\w+)/.exec(className || '');
                        return (
                          <code className={`block w-full whitespace-pre overflow-x-auto my-3 rounded-md bg-gray-100 dark:bg-gray-900 p-3 text-sm font-mono border border-gray-200 dark:border-gray-700 ${
                            match ? `language-${match[1]}` : ''
                          }`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Simple paragraph styling
                      p: ({ children, ...props }: BaseProps) => (
                        <p className="mb-3 last:mb-0 text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
                          {children}
                        </p>
                      ),
                      // Only style pre when it's an actual code block
                      pre: ({ children, className, ...props }: BaseProps) => {
                        if (className?.includes('language-')) {
                          return (
                            <pre className="my-4 last:mb-0" {...props}>
                              {children}
                            </pre>
                          );
                        }
                        return <>{children}</>;
                      },
                      // Enhance lists with improved spacing
                      ul: ({ children, ...props }: BaseProps) => (
                        <ul className="list-disc pl-5 mb-4 last:mb-0 space-y-1 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }: BaseProps) => (
                        <ol className="list-decimal pl-5 mb-4 last:mb-0 space-y-1 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }: BaseProps) => (
                        <li className="pl-1" {...props}>
                          {children}
                        </li>
                      ),
                      // Style blockquotes
                      blockquote: ({ children, ...props }: BaseProps) => (
                        <blockquote className="border-l-4 border-gray-300 dark:border-gray-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400" {...props}>
                          {children}
                        </blockquote>
                      ),
                      // Style tables to be more readable
                      table: ({ children, ...props }: BaseProps) => (
                        <div className="overflow-x-auto w-full my-4 rounded-md">
                          <table className="border-collapse table-auto w-full text-sm" {...props}>
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children, ...props }: BaseProps) => (
                        <thead className="bg-gray-50 dark:bg-gray-900" {...props}>
                          {children}
                        </thead>
                      ),
                      tbody: ({ children, ...props }: BaseProps) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      // Style table headers
                      th: ({ children, ...props }: BaseProps) => (
                        <th className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-medium p-2 text-left" {...props}>
                          {children}
                        </th>
                      ),
                      // Style table cells
                      td: ({ children, ...props }: BaseProps) => (
                        <td className="border border-gray-300 dark:border-gray-700 p-2 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </td>
                      ),
                      // Handle hr elements
                      hr: () => (
                        <hr className="my-4 border-t border-gray-300 dark:border-gray-700" />
                      ),
                      // Handle strong elements
                      strong: ({ children, ...props }: BaseProps) => (
                        <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </strong>
                      ),
                      // Handle emphasis elements
                      em: ({ children, ...props }: BaseProps) => (
                        <em className="italic text-gray-800 dark:text-gray-200" {...props}>
                          {children}
                        </em>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {/* Display sources and scores in a collapsible section */}
                  <ResponseDetails sources={message.sources} scores={message.scores} />
                </div>
              )}
            </div>
            
            {message.role === 'user' && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center ml-3 mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          
          {message.role === 'assistant' && (
            <div className="ml-11 mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {isAnalyzing && (
        <div className="flex justify-start animate-fadeIn">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 flex items-center justify-center mr-3 mt-1 shadow-inner">
            <Bot className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="max-w-[85%] px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-tl-none">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 