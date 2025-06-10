import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function SearchPanel({ onSearch, incremental }) {
  const [query, setQuery] = useState('');
  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => res.json())
      .then(cfg => setLlmEnabled(cfg.llm_enabled));
  }, []);

  const runSearch = async () => {
    let answer = '';
    if (llmEnabled) {
      const llm = await apiFetch('/llm/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const ai = await llm.json();
      answer = ai.answer || '';
    }

    if (incremental) {
      if (onSearch) onSearch(query, [], answer);
      const es = new EventSource(`/search/stream?q=${encodeURIComponent(query)}`);
      let results = [];
      es.onmessage = (e) => {
        if (e.data === 'done') return;
        const item = JSON.parse(e.data);
        results.push(item);
        if (onSearch) onSearch(query, [...results], answer);
      };
      es.addEventListener('end', () => es.close());
      es.onerror = () => es.close();
      return;
    }

    const res = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (onSearch) onSearch(query, data.results || [], answer);
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
    </div>
  );
}
