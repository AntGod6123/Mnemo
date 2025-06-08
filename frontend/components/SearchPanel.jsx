import React, { useState, useEffect } from 'react';

export default function SearchPanel({ onOpenTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState('');
  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    fetch('/admin/config')
      .then(res => res.json())
      .then(cfg => setLlmEnabled(cfg.llm_enabled));
  }, []);

  const runSearch = async () => {
    const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);

    if (llmEnabled) {
      const llm = await fetch('/llm/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const ai = await llm.json();
      setAnswer(ai.answer || '');
    } else {
      setAnswer('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        <input
          className="w-full p-2 border rounded dark:bg-gray-800 dark:text-white"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
        />
        <button onClick={runSearch} className="px-4 py-2 bg-blue-600 text-white rounded">
          Search
        </button>
      </div>
      {llmEnabled && answer && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-800 rounded mb-4">
          <strong>AI Summary:</strong> {answer}
        </div>
      )}
      <ul>
        {results.map((r, i) => (
          <li key={i} className="mb-2">
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                onOpenTab(r.zim_id, r.path, r.title);
              }}
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
