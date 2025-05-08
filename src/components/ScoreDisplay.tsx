import { Score } from '@/types/conversation';

export const ScoreDisplay = ({ scores }: { scores: Score }) => (
  <div className="mt-2 text-sm text-gray-600 flex justify-between">
    <span>Overall: {(scores.overall * 100).toFixed(0)}%</span>
    <span>Keyword: {(scores.keyword * 100).toFixed(0)}%</span>
    <span>LLM: {(scores.llm * 100).toFixed(0)}%</span>
  </div>
)
