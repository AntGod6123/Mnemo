import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

export default function LLMChatPanel() {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(false);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => res.json())
      .then(cfg => setLlmEnabled(cfg.llm_enabled));
  }, []);

  const sendMessage = async () => {
    if (!llmEnabled) return;
    setLoading(true);
    const res = await apiFetch('/llm/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input })
    });
    const data = await res.json();
    setChat([...chat, { user: input, ai: data.answer || 'No response' }]);
    setInput('');
    setLoading(false);
  };

  if (!llmEnabled) return null;

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Ask the Assistant</h3>
      <div className="mb-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          className="w-full p-2 border rounded"
          placeholder="Ask something..."
        />
      </div>
      <button onClick={sendMessage} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
        {loading ? 'Thinking...' : 'Ask'}
      </button>
      <div className="mt-4 space-y-4">
        {chat.map((msg, i) => (
          <div key={i} className="border rounded p-2 bg-gray-50">
            <div><strong>You:</strong> {msg.user}</div>
            <div><strong>AI:</strong> {msg.ai}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
