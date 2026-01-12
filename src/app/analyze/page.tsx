'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { Search, CheckCircle, XCircle, AlertCircle, TrendingUp, Sparkles, Copy, Save } from 'lucide-react';
import type { FullCompetitorAnalysisResult } from '@/types/competitor';
import type { GenerateContentResponse } from '@/types/api';
import { marked } from 'marked';

export default function AnalyzePage() {
  // Stage 1 - Input
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [topic, setTopic] = useState('');
  const [mainKeyword, setMainKeyword] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [contentType, setContentType] = useState('Blog Yazısı');
  const [tone, setTone] = useState('Profesyonel');
  const [purpose, setPurpose] = useState('Bilgilendirme');

  // Stage 2 - URLs
  const [urls, setUrls] = useState('');

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FullCompetitorAnalysisResult | null>(null);
  const [error, setError] = useState('');

  // Stage 4 - Content generation
  const [selectedStrategies, setSelectedStrategies] = useState<{
    useRecommendedWordCount: boolean;
    useRecommendedH2s: boolean;
    useKeywordGap: boolean;
    useSuggestedTitle: boolean;
    useSuggestedFAQs: boolean;
    useContentGaps: boolean;
  }>({
    useRecommendedWordCount: true,
    useRecommendedH2s: true,
    useKeywordGap: true,
    useSuggestedTitle: true,
    useSuggestedFAQs: true,
    useContentGaps: true,
  });

  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateContentResponse | null>(null);

  async function handleStage1Next() {
    if (!topic || !mainKeyword) {
      setError('Konu ve ana anahtar kelime zorunludur');
      return;
    }
    setError('');
    setStage(2);
  }

  async function handleStartAnalysis() {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);

    if (urlList.length === 0) {
      setError('Lütfen en az bir rakip URL girin');
      return;
    }

    if (urlList.length > 5) {
      setError('Maksimum 5 URL analiz edilebilir');
      return;
    }

    setLoading(true);
    setError('');
    setStage(3);

    try {
      const response = await fetch('/api/analyze/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mainKeyword,
          wordCount,
          contentType,
          tone,
          purpose,
          urls: urlList,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analiz başarısız oldu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateContent() {
    if (!results) return;

    setGeneratingContent(true);
    setError('');

    try {
      // Build additional instructions based on selected strategies
      const instructions: string[] = [];

      if (selectedStrategies.useRecommendedH2s && results.stage5_aiStrategy.headingStructure.suggestedH2s.length > 0) {
        instructions.push('Aşağıdaki H2 başlıklarını mutlaka kullan:');
        instructions.push(results.stage5_aiStrategy.headingStructure.suggestedH2s.map(h => `- ${h}`).join('\n'));
      }

      if (selectedStrategies.useContentGaps && results.stage5_aiStrategy.contentGap.missedTopics.length > 0) {
        instructions.push('\nRakiplerin atladığı bu konuları dahil et:');
        instructions.push(results.stage5_aiStrategy.contentGap.missedTopics.map(t => `- ${t}`).join('\n'));
      }

      if (selectedStrategies.useSuggestedFAQs && results.stage5_aiStrategy.faq.suggestedNewQuestions.length > 0) {
        instructions.push('\nBu soruları SSS bölümüne ekle:');
        instructions.push(results.stage5_aiStrategy.faq.suggestedNewQuestions.map(q => `- ${q}`).join('\n'));
      }

      // Collect keywords
      const keywords: string[] = [mainKeyword];
      if (selectedStrategies.useKeywordGap) {
        keywords.push(...results.stage5_aiStrategy.keywords.keywordGap.slice(0, 10));
      }
      keywords.push(...results.stage5_aiStrategy.keywords.recommendedKeywords.slice(0, 10));

      const targetWordCount = selectedStrategies.useRecommendedWordCount
        ? results.stage5_aiStrategy.contentLength.recommendedWordCount
        : wordCount;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          mainKeyword,
          wordCount: targetWordCount,
          contentType,
          tone,
          intent: results.stage1_input.searchIntent,
          secondaryKeywords: keywords,
          competitorUrls: urls.split('\n').map(u => u.trim()).filter(Boolean),
          additionalInstructions: instructions.join('\n\n'),
          aiProvider: 'groq',
        }),
      });

      if (!response.ok) {
        throw new Error('İçerik oluşturulamadı');
      }

      const content = await response.json();
      setGeneratedContent(content);
      setStage(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İçerik oluşturulamadı');
      console.error(err);
    } finally {
      setGeneratingContent(false);
    }
  }

  function handleCopyContent() {
    if (generatedContent?.fullMarkdown) {
      navigator.clipboard.writeText(generatedContent.fullMarkdown);
      alert('İçerik panoya kopyalandı!');
    }
  }

  async function handleSaveContent() {
    if (!generatedContent) return;

    try {
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedContent.meta.title,
          content: generatedContent.fullMarkdown,
          seoScore: generatedContent.seoScore.overall,
          wordCount: generatedContent.fullMarkdown.split(/\s+/).filter(Boolean).length,
          keywords: [generatedContent.seo.primaryKeyword, ...generatedContent.seo.secondaryKeywords],
        }),
      });

      if (response.ok) {
        alert('İçerik başarıyla kaydedildi!');
      } else {
        throw new Error('Kaydetme başarısız');
      }
    } catch (err) {
      alert('İçerik kaydedilemedi');
      console.error(err);
    }
  }

  function handleReset() {
    setStage(1);
    setResults(null);
    setGeneratedContent(null);
    setError('');
    setTopic('');
    setMainKeyword('');
    setUrls('');
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesyonel Rakip Analizi</h1>
          <p className="text-gray-600">Rakip içeriklerini analiz edin, strateji belirleyin ve AI ile içerik oluşturun</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <StepIndicator number={1} label="Konu & Strateji" active={stage >= 1} />
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <StepIndicator number={2} label="Rakip URL'leri" active={stage >= 2} />
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <StepIndicator number={3} label="Analiz Sonuçları" active={stage >= 3} />
            <div className="w-16 h-0.5 bg-gray-200"></div>
            <StepIndicator number={4} label="İçerik Oluştur" active={stage >= 4} />
          </div>
        </div>

        {/* Stage 1: Input Form */}
        {stage === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>🟢 AŞAMA 1 – KONU & STRATEJİ TANIMI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Ana Konu *"
                  placeholder="Örn: SEO İçerik Yazımı"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />

                <Input
                  label="Ana Anahtar Kelime (Primary Keyword) *"
                  placeholder="Örn: seo içerik yazımı"
                  value={mainKeyword}
                  onChange={(e) => setMainKeyword(e.target.value)}
                />

                <Input
                  label="Başlangıç Kelime Sayısı"
                  type="number"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  helperText="Rakip analizinden sonra otomatik optimize edilecek"
                />

                <Select
                  label="İçerik Tipi"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  options={[
                    { value: 'Blog Yazısı', label: 'Blog Yazısı' },
                    { value: 'Rehber', label: 'Rehber' },
                    { value: 'Liste', label: 'Liste' },
                    { value: 'Karşılaştırma', label: 'Karşılaştırma' },
                    { value: 'How-To', label: 'How-To (Nasıl Yapılır)' },
                    { value: 'Landing Page', label: 'Landing Page' },
                  ]}
                />

                <Select
                  label="Ton"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  options={[
                    { value: 'Profesyonel', label: 'Profesyonel' },
                    { value: 'Samimi', label: 'Samimi' },
                    { value: 'Otoriter', label: 'Otoriter' },
                    { value: 'Satış Odaklı', label: 'Satış Odaklı' },
                    { value: 'Eğitici', label: 'Eğitici' },
                  ]}
                />

                <Select
                  label="Amaç"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  options={[
                    { value: 'Bilgilendirme', label: 'Bilgilendirme' },
                    { value: 'Satış', label: 'Satış' },
                    { value: 'Lead', label: 'Lead Toplama' },
                    { value: 'Marka Bilinirliği', label: 'Marka Bilinirliği' },
                    { value: 'SEO Trafik', label: 'SEO Trafik' },
                  ]}
                />

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleStage1Next}>
                    Devam Et
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage 2: URL Input */}
        {stage === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>🟢 AŞAMA 2 – RAKİP URL EKLEME</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Konu: {topic}</h4>
                  <p className="text-sm text-blue-700">Ana Kelime: {mainKeyword}</p>
                  <p className="text-sm text-blue-700">Tip: {contentType} | Ton: {tone}</p>
                </div>

                <Textarea
                  label="Rakip URL'leri (her satıra bir URL, maks. 5)"
                  rows={6}
                  placeholder="https://rakip1.com/makale&#10;https://rakip2.com/blog&#10;https://rakip3.com/rehber"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                />

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button onClick={() => setStage(1)} variant="outline">
                    Geri
                  </Button>
                  <Button onClick={handleStartAnalysis} loading={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Analizi Başlat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage 3: Analysis Results & Strategy Selection */}
        {stage === 3 && (
          <div className="space-y-6">
            {loading && (
              <Card>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Rakipler analiz ediliyor...</p>
                    <p className="text-sm text-gray-500 mt-2">Bu işlem 1-3 dakika sürebilir</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && !results && (
              <Card>
                <CardContent>
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-700 font-semibold">{error}</p>
                    <Button onClick={handleReset} className="mt-4">
                      Baştan Başla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {results && (
              <>
                {/* Scraping Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Scraping Sonuçları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {results.stage2_scraping.scrapeStatus.map((status, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate flex-1">{status.url}</span>
                          <div className="flex items-center ml-4">
                            {status.status === 'success' && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Başarılı</span>
                              </div>
                            )}
                            {status.status === 'error' && (
                              <div className="flex items-center text-red-600">
                                <XCircle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Hata</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                          ✅ {results.stage2_scraping.successCount} başarılı |
                          ❌ {results.stage2_scraping.errorCount} hata
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Aggregate Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>📈 Rakip İstatistikleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard
                        label="Ortalama Kelime"
                        value={results.stage4_aggregateAnalysis.averageWordCount.toLocaleString()}
                      />
                      <StatCard
                        label="Ortalama H2"
                        value={results.stage4_aggregateAnalysis.averageH2Count}
                      />
                      <StatCard
                        label="En Uzun Rakip"
                        value={results.stage4_aggregateAnalysis.longestCompetitor.wordCount.toLocaleString()}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Strategy Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      🎯 STRATEJİK ÖNERİLER - Uygulamak İstediklerinizi Seçin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Word Count Strategy */}
                      <StrategyCheckbox
                        checked={selectedStrategies.useRecommendedWordCount}
                        onChange={(checked) => setSelectedStrategies(s => ({ ...s, useRecommendedWordCount: checked }))}
                        title="📊 Önerilen Kelime Sayısını Kullan"
                        description={`${results.stage5_aiStrategy.contentLength.recommendedWordCount.toLocaleString()} kelime (Rakip ort: ${results.stage4_aggregateAnalysis.averageWordCount.toLocaleString()}, En uzun: ${results.stage4_aggregateAnalysis.longestCompetitor.wordCount.toLocaleString()})`}
                        reasoning={results.stage5_aiStrategy.contentLength.reasoning}
                      />

                      {/* Heading Strategy */}
                      {results.stage5_aiStrategy.headingStructure.suggestedH2s.length > 0 && (
                        <StrategyCheckbox
                          checked={selectedStrategies.useRecommendedH2s}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useRecommendedH2s: checked }))}
                          title="🏗️ Önerilen Başlıkları Kullan"
                          description={`${results.stage5_aiStrategy.headingStructure.suggestedH2s.length} yeni H2 başlığı`}
                          items={results.stage5_aiStrategy.headingStructure.suggestedH2s.slice(0, 5)}
                        />
                      )}

                      {/* Keyword Gap */}
                      {results.stage5_aiStrategy.keywords.keywordGap.length > 0 && (
                        <StrategyCheckbox
                          checked={selectedStrategies.useKeywordGap}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useKeywordGap: checked }))}
                          title="🔑 Keyword Gap'leri Kapat"
                          description={`${results.stage5_aiStrategy.keywords.keywordGap.length} fırsat kelime`}
                          items={results.stage5_aiStrategy.keywords.keywordGap.slice(0, 10)}
                          chips
                        />
                      )}

                      {/* Meta Title */}
                      {results.stage5_aiStrategy.meta.suggestedTitle && (
                        <StrategyCheckbox
                          checked={selectedStrategies.useSuggestedTitle}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useSuggestedTitle: checked }))}
                          title="📝 Önerilen Title'ı Kullan"
                          description={results.stage5_aiStrategy.meta.suggestedTitle}
                        />
                      )}

                      {/* FAQ */}
                      {results.stage5_aiStrategy.faq.suggestedNewQuestions.length > 0 && (
                        <StrategyCheckbox
                          checked={selectedStrategies.useSuggestedFAQs}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useSuggestedFAQs: checked }))}
                          title="❓ Yeni FAQ Sorularını Ekle"
                          description={`${results.stage5_aiStrategy.faq.suggestedNewQuestions.length} yeni soru`}
                          items={results.stage5_aiStrategy.faq.suggestedNewQuestions}
                        />
                      )}

                      {/* Content Gap */}
                      {results.stage5_aiStrategy.contentGap.missedTopics.length > 0 && (
                        <StrategyCheckbox
                          checked={selectedStrategies.useContentGaps}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useContentGaps: checked }))}
                          title="🎯 Content Gap'leri Doldur"
                          description={`Rakiplerin atladığı ${results.stage5_aiStrategy.contentGap.missedTopics.length} konu`}
                          items={results.stage5_aiStrategy.contentGap.missedTopics}
                        />
                      )}
                    </div>

                    {/* Critical Rules */}
                    <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                      <h3 className="font-bold text-red-900 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        ⚠️ KRİTİK KURALLAR
                      </h3>
                      <ul className="space-y-2">
                        {results.stage5_aiStrategy.criticalRules.map((rule, idx) => (
                          <li key={idx} className="text-sm text-red-800 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 flex justify-between">
                      <Button onClick={handleReset} variant="outline">
                        Yeni Analiz
                      </Button>
                      <Button
                        onClick={handleGenerateContent}
                        loading={generatingContent}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        İçerik Oluştur
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Stage 4: Generated Content */}
        {stage === 4 && generatedContent && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>✨ Oluşturulan İçerik</span>
                  <div className="flex gap-2">
                    <Button onClick={handleCopyContent} variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Kopyala
                    </Button>
                    <Button onClick={handleSaveContent} variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    label="SEO Skoru"
                    value={`${generatedContent.seoScore.overall}/100`}
                  />
                  <StatCard
                    label="Kelime Sayısı"
                    value={generatedContent.fullMarkdown.split(/\s+/).filter(Boolean).length.toLocaleString()}
                  />
                  <StatCard
                    label="Başlık Sayısı"
                    value={generatedContent.structure.outline.length}
                  />
                  <StatCard
                    label="FAQ Sayısı"
                    value={generatedContent.content.faq.length}
                  />
                </div>

                {/* Meta Info */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Meta Bilgileri</h3>
                  <p className="text-sm text-blue-800 mb-1"><strong>Title:</strong> {generatedContent.meta.title}</p>
                  <p className="text-sm text-blue-800"><strong>Description:</strong> {generatedContent.meta.description}</p>
                </div>

                {/* Content Preview */}
                <div
                  className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: marked(generatedContent.fullMarkdown) }}
                />

                <div className="mt-6 flex justify-between">
                  <Button onClick={() => setStage(3)} variant="outline">
                    Geri
                  </Button>
                  <Button onClick={handleReset}>
                    Yeni İçerik
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </>
  );
}

function StepIndicator({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
          active ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {number}
      </div>
      <span className={`text-xs mt-2 ${active ? 'text-black font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StrategyCheckbox({
  checked,
  onChange,
  title,
  description,
  reasoning,
  items,
  chips,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  reasoning?: string;
  items?: string[];
  chips?: boolean;
}) {
  return (
    <div
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        checked
          ? 'border-black bg-black bg-opacity-5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 mr-3 w-5 h-5 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-700 mb-2">{description}</p>
          {reasoning && (
            <p className="text-xs text-gray-600 italic mb-2">{reasoning}</p>
          )}
          {items && items.length > 0 && (
            <div className={chips ? 'flex flex-wrap gap-2 mt-2' : 'mt-2 space-y-1'}>
              {items.map((item, idx) => (
                chips ? (
                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded text-xs">
                    {item}
                  </span>
                ) : (
                  <div key={idx} className="text-xs text-gray-600">• {item}</div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
