import { Source } from '@/types/conversation';

export const SourcesList = ({ sources }: { sources: Source[] }) => (
    <div className="mt-2 text-sm text-gray-600">
      <h4 className="font-semibold">Sources:</h4>
      <ul className="space-y-1">
        {sources.map((source, i) => (
          <li key={i} className="flex justify-between">
            <a href={source.url} className="text-blue-600 hover:underline">
              {source.title}
            </a>
            <span>{(source.relevance * 100).toFixed(0)}% relevant</span>
          </li>
        ))}
      </ul>
    </div>
  )