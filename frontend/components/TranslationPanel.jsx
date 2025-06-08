import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function TranslationPanel() {
  const [models, setModels] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    apiFetch('/translate/models')
      .then(res => res.json())
      .then(setModels);
  }, []);

  const translate = async () => {
    const res = await apiFetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from_lang: from, to_lang: to })
    });
    const data = await res.json();
    setResult(data.translated || data.error);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Translation Plugin</h3>
      <div className="flex gap-2 mb-2">
        <select value={from} onChange={e => setFrom(e.target.value)} className="p-2 border rounded">
          <option value="">From</option>
          {models.map(m => (
            <option key={m.from_code + m.to_code} value={m.from_code}>{m.from_code}</option>
          ))}
        </select>
        <select value={to} onChange={e => setTo(e.target.value)} className="p-2 border rounded">
          <option value="">To</option>
          {models.map(m => (
            <option key={m.to_code + m.from_code} value={m.to_code}>{m.to_code}</option>
          ))}
        </select>
      </div>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={4}
        placeholder="Text to translate..."
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button onClick={translate} className="px-4 py-2 bg-green-600 text-white rounded">
        Translate
      </button>
      {result && <div className="mt-2 p-2 bg-gray-100 rounded">{result}</div>}
    </div>
  );
}
