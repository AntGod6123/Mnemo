import React, { useRef, useState } from 'react';
import Home from './pages/Home.jsx';
import SearchResults from './pages/SearchResults.jsx';
import ZimBrowserTabs from './components/ZimBrowserTabs.jsx';

export default function App() {
  const tabsRef = useRef(null);
  const [page, setPage] = useState('home');
  const [searchData, setSearchData] = useState({ query: '', results: [], answer: '' });

  const openTab = (zimId, path, title) => {
    if (tabsRef.current && tabsRef.current.openTab) {
      tabsRef.current.openTab(zimId, path, title);
    }
  };

  const handleSearch = (query, results, answer) => {
    setSearchData({ query, results, answer });
    setPage('results');
  };

  const goHome = () => setPage('home');

  return (
    <div className="p-4">
      {page === 'home' && <Home onSearch={handleSearch} onOpenZim={openTab} />}
      {page === 'results' && (
        <SearchResults
          initialQuery={searchData.query}
          initialResults={searchData.results}
          initialAnswer={searchData.answer}
          onHome={goHome}
          onOpenArticle={openTab}
        />
      )}
      <ZimBrowserTabs ref={tabsRef} />
    </div>
  );
}
