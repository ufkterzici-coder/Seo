'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import Button from '@/components/ui/Button';
import { ArrowLeft, X } from 'lucide-react';

export default function PreviewPage() {
  const router = useRouter();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    // Load content from localStorage
    const previewData = localStorage.getItem('preview_content');
    if (previewData) {
      try {
        const parsed = JSON.parse(previewData);
        setContent(parsed);
      } catch (error) {
        console.error('Failed to parse preview content:', error);
      }
    }
  }, []);

  const handleClose = () => {
    window.close();
    // If window.close() doesn't work (not opened by script), redirect
    setTimeout(() => {
      router.push('/create');
    }, 100);
  };

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Önizlenecek içerik bulunamadı</p>
          <Button onClick={handleClose}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  const htmlContent = marked(content.fullMarkdown || '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Kapat
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600 font-medium">📄 Önizleme Modu</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                SEO Skoru: {content.seoScore?.overall || 0}/100
              </div>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                {content.fullMarkdown?.split(/\s+/).length || 0} kelime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Meta Info */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium">
              {content.seo?.searchIntent || 'Bilgilendirme'}
            </span>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {content.structure?.h1 || content.meta?.title}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            {content.meta?.description}
          </p>
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Ana Kelime:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-sm font-medium">
                {content.seo?.primaryKeyword}
              </span>
            </div>
            {content.seo?.secondaryKeywords && content.seo.secondaryKeywords.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">İkincil:</span>
                {content.seo.secondaryKeywords.slice(0, 2).map((keyword: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <article
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">SEO Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Keyword Yoğunluğu:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {content.seo?.keywordDensity || 0}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Arama Niyeti:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {content.seo?.searchIntent || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Başlık Uzunluğu:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {content.meta?.title?.length || 0}/60
                </span>
              </div>
              <div>
                <span className="text-gray-600">Açıklama Uzunluğu:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {content.meta?.description?.length || 0}/155
                </span>
              </div>
            </div>

            {content.seo?.lsiKeywords && content.seo.lsiKeywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600 block mb-2">LSI Anahtar Kelimeler:</span>
                <div className="flex flex-wrap gap-2">
                  {content.seo.lsiKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded text-xs"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
