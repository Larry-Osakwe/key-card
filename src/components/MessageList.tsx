'use client';

import { type Message } from '@/types/conversation';
import ReactMarkdown from 'react-markdown';
import { ReactNode } from 'react';

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
                      // Style code blocks with better formatting
                      code: ({ inline, className, children, ...props }: CodeProps) => {
                        // Extract language from className if available (e.g., "language-javascript")
                        const match = /language-(\w+)/.exec(className || '');
                        
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
                          <code className={`block whitespace-pre overflow-x-auto my-3 rounded-md bg-gray-100 dark:bg-gray-900 p-3 text-sm font-mono ${
                            match ? `language-${match[1]}` : ''
                          }`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      // Properly format paragraphs
                      p: ({ children, ...props }: BaseProps) => (
                        <p className="mb-3 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </p>
                      ),
                      // Pre-formatted code blocks
                      pre: ({ children, ...props }: BaseProps) => (
                        <pre className="overflow-auto my-4 rounded-md bg-gray-100 dark:bg-gray-900 p-3 text-sm font-mono border border-gray-200 dark:border-gray-700" {...props}>
                          {children}
                        </pre>
                      ),
                      // Enhance lists
                      ul: ({ children, ...props }: BaseProps) => (
                        <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }: BaseProps) => (
                        <ol className="list-decimal pl-5 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }: BaseProps) => (
                        <li className="mb-1 pl-1" {...props}>
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