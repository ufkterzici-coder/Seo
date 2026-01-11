'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';

interface KeywordSelectorProps {
  topic: string;
  selectedKeywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  mainKeyword?: string;
}

export default function KeywordSelector({
  topic,
  selectedKeywords,
  onKeywordsChange,
  mainKeyword,
}: KeywordSelectorProps) {
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (topic && topic.length >= 3) {
      fetchKeywordSuggestions();
    } else {
      setSuggestedKeywords([]);
      setShowSuggestions(false);
    }
  }, [topic]);

  async function fetchKeywordSuggestions() {
    if (!topic || topic.length < 3) return;

    setLoading(true);
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedKeywords(data.keywords || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch keyword suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleKeyword(keyword: string) {
    if (selectedKeywords.includes(keyword)) {
      onKeywordsChange(selectedKeywords.filter((k) => k !== keyword));
    } else {
      onKeywordsChange([...selectedKeywords, keyword]);
    }
  }

  function addManualKeyword() {
    const keyword = manualInput.trim().toLowerCase();
    if (keyword && !selectedKeywords.includes(keyword)) {
      onKeywordsChange([...selectedKeywords, keyword]);
      setManualInput('');
    }
  }

  function removeKeyword(keyword: string) {
    onKeywordsChange(selectedKeywords.filter((k) => k !== keyword));
  }

  const availableSuggestions = suggestedKeywords.filter(
    (k) => !selectedKeywords.includes(k) && k !== mainKeyword
  );

  return (
    <div className="space-y-4">
      {/* Selected Keywords */}
      {selectedKeywords.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seçilen Anahtar Kelimeler ({selectedKeywords.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {selectedKeywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-3 py-1 bg-black text-white rounded-full text-sm font-medium"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="ml-2 hover:bg-gray-800 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Manuel Anahtar Kelime Ekle
        </label>
        <div className="flex space-x-2">
          <Input
            placeholder="anahtar kelime yaz..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addManualKeyword()}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addManualKeyword}
            disabled={!manualInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {topic && topic.length >= 3 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              AI Önerileri
            </label>
            {!showSuggestions && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchKeywordSuggestions}
                loading={loading}
                disabled={loading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Önerileri Getir
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">AI anahtar kelimeler üretiyor...</span>
            </div>
          ) : showSuggestions && availableSuggestions.length > 0 ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => toggleKeyword(keyword)}
                    className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100 hover:border-gray-400 transition-all"
                  >
                    <Plus className="w-3 h-3 mr-1.5" />
                    {keyword}
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fetchKeywordSuggestions}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  disabled={loading}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Yeni öneriler al
                </button>
              </div>
            </div>
          ) : showSuggestions && availableSuggestions.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              Tüm öneriler seçildi. Manuel olarak daha fazla ekleyebilirsiniz.
            </div>
          ) : null}
        </div>
      )}

      {topic && topic.length < 3 && (
        <div className="py-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <Sparkles className="w-5 h-5 mx-auto mb-2 text-gray-400" />
          Anahtar kelime önerileri için konu girişi yapın (min. 3 karakter)
        </div>
      )}
    </div>
  );
}
