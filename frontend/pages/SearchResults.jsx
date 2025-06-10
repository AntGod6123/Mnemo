import React, { useState } from 'react';
import SearchPanel from '../components/SearchPanel';
import { API_BASE } from '../api';
import Header from '../components/Header';

export default function SearchResults({ initialQuery, initialResults, initialAnswer, onHome }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState(initialResults || []);
  const [answer, setAnswer] = useState(initialAnswer || '');

  const handleSearch = (q, res, ans) => {
    setQuery(q);
    setResults(res);
    setAnswer(ans);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Header onHome={onHome} />
      <SearchPanel onSearch={handleSearch} incremental />
      {query && (
        <h2 className="text-lg font-semibold mb-2">Results for "{query}"</h2>
      )}
      {answer && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-800 rounded mb-4">
          <strong>AI Response:</strong> {answer}
        </div>
      )}
      <ul>
        {results.map((r, i) => (
          <li key={i} className="mb-2">
            <a
              href={`${API_BASE}/article/${r.zim_id}/${r.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-300 hover:underline"
            >
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
