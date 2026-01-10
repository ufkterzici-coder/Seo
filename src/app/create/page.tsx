'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import SEOScoreCard from '@/components/seo/SEOScoreCard';
import { Copy, Save, Rocket } from 'lucide-react';
import { slugify } from '@/lib/utils/slug';
import { readingTime } from '@/lib/utils/format';

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    mainKeyword: '',
    wordCount: 1500,
    contentType: 'article',
    tone: 'expert',
    intent: 'auto',
    competitorUrls: '',
    additionalInstructions: '',
  });

  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!formData.topic || !formData.mainKeyword) {
      setError('Topic and Main Keyword are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          competitorUrls: formData.competitorUrls
            .split('\n')
            .map(url => url.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!generatedContent) return;

    try {
      const wordCount = generatedContent.fullMarkdown.split(/\s+/).length;
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedContent.structure.h1,
          slug: slugify(generatedContent.structure.h1),
          meta_title: generatedContent.meta.title,
          meta_description: generatedContent.meta.description,
          content_markdown: generatedContent.fullMarkdown,
          content_html: '',
          main_keyword: generatedContent.seo.primaryKeyword,
          secondary_keywords: JSON.stringify(generatedContent.seo.secondaryKeywords),
          lsi_keywords: JSON.stringify(generatedContent.seo.lsiKeywords),
          search_intent: generatedContent.seo.searchIntent,
          heading_structure: JSON.stringify(generatedContent.structure.outline),
          schema_article: JSON.stringify(generatedContent.schema.article),
          schema_faq: JSON.stringify(generatedContent.schema.faq),
          featured_snippet: generatedContent.featuredSnippet,
          images: JSON.stringify(generatedContent.images),
          internal_links: JSON.stringify(generatedContent.internalLinks),
          seo_score: generatedContent.seoScore.overall,
          seo_checks: JSON.stringify(generatedContent.seoScore.checks),
          word_count: wordCount,
          reading_time: readingTime(wordCount),
          status: 'draft',
        }),
      });

      if (response.ok) {
        router.push('/contents');
      }
    } catch (err) {
      setError('Failed to save content');
      console.error(err);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <>
      <Navbar />
      <Container size="full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Content</h1>
          <p className="text-gray-600">Generate SEO-optimized articles with AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="space-y-4">
                <Input
                  label="Topic *"
                  placeholder="En İyi Kablosuz Kulaklıklar 2025"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />

                <Input
                  label="Main Keyword *"
                  placeholder="kablosuz kulaklık"
                  value={formData.mainKeyword}
                  onChange={(e) => setFormData({ ...formData, mainKeyword: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Word Count"
                    type="number"
                    value={formData.wordCount}
                    onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) })}
                  />

                  <Select
                    label="Type"
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                    options={[
                      { value: 'article', label: 'Article' },
                      { value: 'blog', label: 'Blog' },
                      { value: 'product', label: 'Product' },
                      { value: 'landing', label: 'Landing' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Tone"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    options={[
                      { value: 'professional', label: 'Professional' },
                      { value: 'casual', label: 'Casual' },
                      { value: 'expert', label: 'Expert' },
                      { value: 'friendly', label: 'Friendly' },
                    ]}
                  />

                  <Select
                    label="Intent"
                    value={formData.intent}
                    onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: 'informational', label: 'Informational' },
                      { value: 'transactional', label: 'Transactional' },
                      { value: 'commercial', label: 'Commercial' },
                    ]}
                  />
                </div>

                <Textarea
                  label="Competitor URLs (optional)"
                  placeholder="https://example.com/article"
                  rows={3}
                  value={formData.competitorUrls}
                  onChange={(e) => setFormData({ ...formData, competitorUrls: e.target.value })}
                />

                <Textarea
                  label="Additional Instructions"
                  placeholder="Fiyat karşılaştırma tablosu ekle..."
                  rows={3}
                  value={formData.additionalInstructions}
                  onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                />

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Generate Content
                </Button>
              </div>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
              <>
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Generated Content</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.fullMarkdown)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                      {generatedContent.fullMarkdown}
                    </pre>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schema Markup</h3>
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(generatedContent.schema, null, 2))}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Schema
                    </Button>
                  </div>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(generatedContent.schema, null, 2)}
                  </pre>
                </Card>
              </>
            )}
          </div>

          {/* Right Panel - SEO Info */}
          <div className="space-y-6">
            {generatedContent && (
              <>
                <SEOScoreCard score={generatedContent.seoScore} />

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Meta Tags</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Title ({generatedContent.meta.title.length}/60)
                      </label>
                      <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                        {generatedContent.meta.title}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Description ({generatedContent.meta.description.length}/155)
                      </label>
                      <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                        {generatedContent.meta.description}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Structure</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold text-gray-900">
                      H1: {generatedContent.structure.h1}
                    </div>
                    {generatedContent.structure.outline.map((item: any, idx: number) => (
                      <div key={idx} className="ml-4">
                        <div className="text-gray-700">├─ H2: {item.h2}</div>
                        {item.h3.map((h3: string, h3Idx: number) => (
                          <div key={h3Idx} className="ml-4 text-gray-600">
                            │ └─ H3: {h3}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
