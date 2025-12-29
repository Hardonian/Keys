'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  type?: 'page' | 'template' | 'feature';
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  results?: SearchResult[];
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  results = [],
  onResultSelect,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query && onSearch) {
      onSearch(query);
    }
    setIsOpen(query.length > 0 && results.length > 0);
  }, [query, results, onSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && focusedIndex >= 0 && results[focusedIndex]) {
        e.preventDefault();
        onResultSelect?.(results[focusedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, results, onResultSelect]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {results.map((result, idx) => (
            <button
              key={result.id}
              onClick={() => {
                onResultSelect?.(result);
                setIsOpen(false);
                setQuery('');
              }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                idx === focusedIndex ? 'bg-slate-50 dark:bg-slate-700' : ''
              } ${idx !== results.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
            >
              <div className="flex items-start gap-3">
                {result.type === 'template' && (
                  <div className="mt-0.5 text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-50 truncate">{result.title}</div>
                  {result.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {result.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
