'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import KeywordSelector from '@/components/content/KeywordSelector';
import { Search, CheckCircle, XCircle, AlertCircle, Sparkles, Copy, Save, Target, TrendingUp, FileText, MessageSquare, Link as LinkIcon, Award } from 'lucide-react';
import type { FullCompetitorAnalysisResult } from '@/types/competitor';
import type { GenerateContentResponse } from '@/types/api';
import { marked } from 'marked';

export default function AnalyzePage() {
  // Stage 1 - Input
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [topic, setTopic] = useState('');
  const [mainKeyword, setMainKeyword] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(1500);
  const [contentType, setContentType] = useState('Blog Yazısı');
  const [tone, setTone] = useState('Profesyonel');
  const [purpose, setPurpose] = useState('Bilgilendirme');
  const [aiProvider, setAiProvider] = useState<'groq' | 'claude'>('groq');

  // Stage 2 - URLs
  const [urls, setUrls] = useState('');

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FullCompetitorAnalysisResult | null>(null);
  const [error, setError] = useState('');

  // Stage 3 - Strategy selection
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

  // Stage 4 - Content generation
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GenerateContentResponse | null>(null);

  // Dynamic prompt preview
  const [promptPreview, setPromptPreview] = useState('');

  useEffect(() => {
    if (results && stage === 3) {
      updatePromptPreview();
    }
  }, [selectedStrategies, results, stage, aiProvider]);

  function updatePromptPreview() {
    if (!results) return;

    const instructions: string[] = [];

    instructions.push(`# İçerik Talebi`);
    instructions.push(`AI Modeli: ${aiProvider === 'groq' ? '🚀 Groq (Llama 3.3 70B)' : '🧠 Claude (Sonnet 3.5)'}`);
    instructions.push(`Konu: ${topic}`);
    instructions.push(`Ana Anahtar Kelime: ${mainKeyword}`);

    if (selectedStrategies.useRecommendedWordCount) {
      instructions.push(`Hedef Kelime Sayısı: ${results.stage5_aiStrategy.contentLength.recommendedWordCount} kelime`);
      instructions.push(`(Rakip ort: ${results.stage4_aggregateAnalysis.averageWordCount}, En uzun: ${results.stage4_aggregateAnalysis.longestCompetitor.wordCount})`);
    } else {
      instructions.push(`Hedef Kelime Sayısı: ${wordCount} kelime`);
    }

    if (selectedStrategies.useRecommendedH2s && results.stage5_aiStrategy.headingStructure.suggestedH2s.length > 0) {
      instructions.push(`\n## Kullanılacak H2 Başlıkları:`);
      results.stage5_aiStrategy.headingStructure.suggestedH2s.forEach(h => {
        instructions.push(`- ${h}`);
      });
    }

    if (selectedStrategies.useKeywordGap && results.stage5_aiStrategy.keywords.keywordGap.length > 0) {
      instructions.push(`\n## Keyword Gap (Fırsat Kelimeleri):`);
      instructions.push(results.stage5_aiStrategy.keywords.keywordGap.slice(0, 10).join(', '));
    }

    if (selectedStrategies.useContentGaps && results.stage5_aiStrategy.contentGap.missedTopics.length > 0) {
      instructions.push(`\n## Content Gap (Rakiplerin Atladığı Konular):`);
      results.stage5_aiStrategy.contentGap.missedTopics.forEach(t => {
        instructions.push(`- ${t}`);
      });
    }

    if (selectedStrategies.useSuggestedFAQs && results.stage5_aiStrategy.faq.suggestedNewQuestions.length > 0) {
      instructions.push(`\n## FAQ Soruları:`);
      results.stage5_aiStrategy.faq.suggestedNewQuestions.forEach(q => {
        instructions.push(`- ${q}`);
      });
    }

    instructions.push(`\n## Kritik Kurallar:`);
    results.stage5_aiStrategy.criticalRules.forEach(rule => {
      instructions.push(`• ${rule}`);
    });

    setPromptPreview(instructions.join('\n'));
  }

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

      const keywords: string[] = [mainKeyword, ...selectedKeywords];
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
          aiProvider: aiProvider,
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
          seo_score: generatedContent.seoScore.overall,
          word_count: generatedContent.fullMarkdown.split(/\s+/).filter(Boolean).length,
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
    setSelectedKeywords([]);
    setUrls('');
  }

  function handleStageClick(targetStage: 1 | 2 | 3 | 4) {
    // Can only go back to completed stages
    if (targetStage < stage) {
      setStage(targetStage);
    }
  }

  return (
    <>
      <Navbar />
      <Container className="max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesyonel Rakip Analizi</h1>
          <p className="text-gray-600">Rakip içeriklerini analiz edin, strateji belirleyin ve AI ile içerik oluşturun</p>
        </div>

        {/* Modern Progress Steps - Tıklanabilir */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <ProgressStep
              number={1}
              label="Konu & Strateji"
              active={stage >= 1}
              completed={stage > 1}
              onClick={() => handleStageClick(1)}
              clickable={stage > 1}
            />
            <ProgressLine completed={stage > 1} />
            <ProgressStep
              number={2}
              label="Rakip URL'leri"
              active={stage >= 2}
              completed={stage > 2}
              onClick={() => handleStageClick(2)}
              clickable={stage > 2}
            />
            <ProgressLine completed={stage > 2} />
            <ProgressStep
              number={3}
              label="Analiz Sonuçları"
              active={stage >= 3}
              completed={stage > 3}
              onClick={() => handleStageClick(3)}
              clickable={stage > 3}
            />
            <ProgressLine completed={stage > 3} />
            <ProgressStep
              number={4}
              label="İçerik Oluştur"
              active={stage >= 4}
              completed={false}
              onClick={() => handleStageClick(4)}
              clickable={stage > 4}
            />
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

                <KeywordSelector
                  topic={topic}
                  mainKeyword={mainKeyword}
                  selectedKeywords={selectedKeywords}
                  onKeywordsChange={setSelectedKeywords}
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

                <Select
                  label="Yapay Zeka Modeli"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as 'groq' | 'claude')}
                  options={[
                    { value: 'groq', label: '🚀 Groq (Llama 3.3 70B - Hızlı)' },
                    { value: 'claude', label: '🧠 Claude (Sonnet 3.5 - Kaliteli)' },
                  ]}
                  helperText="İçerik oluşturma için kullanılacak AI modeli"
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Özet</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700 mb-1"><strong>Konu:</strong> {topic}</p>
                      <p className="text-sm text-blue-700 mb-1"><strong>Ana Kelime:</strong> {mainKeyword}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1"><strong>Tip:</strong> {contentType}</p>
                      <p className="text-sm text-blue-700"><strong>Ton:</strong> {tone}</p>
                    </div>
                  </div>
                  {selectedKeywords.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-sm text-blue-700 mb-2"><strong>İkincil Kelimeler:</strong></p>
                      <div className="flex flex-wrap gap-1">
                        {selectedKeywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
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
                      <CardTitle className="text-lg">📊 Rakip İstatistikleri</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <StatCard
                          icon={<FileText className="w-5 h-5" />}
                          label="Ortalama Kelime"
                          value={results.stage4_aggregateAnalysis.averageWordCount.toLocaleString()}
                          color="blue"
                        />
                        <StatCard
                          icon={<Target className="w-5 h-5" />}
                          label="Ortalama H2"
                          value={results.stage4_aggregateAnalysis.averageH2Count}
                          color="purple"
                        />
                        <StatCard
                          icon={<TrendingUp className="w-5 h-5" />}
                          label="En Uzun Rakip"
                          value={results.stage4_aggregateAnalysis.longestCompetitor.wordCount.toLocaleString()}
                          color="green"
                        />
                      </div>

                      <div className="space-y-2">
                        {results.stage2_scraping.scrapeStatus.map((status, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span className="text-gray-700 truncate flex-1">{new URL(status.url).hostname}</span>
                            {status.status === 'success' ? (
                              <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strategy Selection - Modern Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Sparkles className="w-5 h-5 mr-2" />
                        🎯 Uygulamak İstediğiniz Stratejiler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <ModernStrategyCard
                          icon={<FileText className="w-5 h-5" />}
                          title="Önerilen Kelime Sayısını Kullan"
                          description={`${results.stage5_aiStrategy.contentLength.recommendedWordCount.toLocaleString()} kelime`}
                          detail={`Rakip ort: ${results.stage4_aggregateAnalysis.averageWordCount.toLocaleString()}`}
                          checked={selectedStrategies.useRecommendedWordCount}
                          onChange={(checked) => setSelectedStrategies(s => ({ ...s, useRecommendedWordCount: checked }))}
                          color="blue"
                        />

                        {results.stage5_aiStrategy.headingStructure.suggestedH2s.length > 0 && (
                          <ModernStrategyCard
                            icon={<Target className="w-5 h-5" />}
                            title="Önerilen Başlıkları Kullan"
                            description={`${results.stage5_aiStrategy.headingStructure.suggestedH2s.length} yeni H2 başlığı`}
                            detail={results.stage5_aiStrategy.headingStructure.suggestedH2s.slice(0, 2).join(', ')}
                            checked={selectedStrategies.useRecommendedH2s}
                            onChange={(checked) => setSelectedStrategies(s => ({ ...s, useRecommendedH2s: checked }))}
                            color="purple"
                          />
                        )}

                        {results.stage5_aiStrategy.keywords.keywordGap.length > 0 && (
                          <ModernStrategyCard
                            icon={<Award className="w-5 h-5" />}
                            title="Keyword Gap'leri Kapat"
                            description={`${results.stage5_aiStrategy.keywords.keywordGap.length} fırsat kelime`}
                            chips={results.stage5_aiStrategy.keywords.keywordGap.slice(0, 5)}
                            checked={selectedStrategies.useKeywordGap}
                            onChange={(checked) => setSelectedStrategies(s => ({ ...s, useKeywordGap: checked }))}
                            color="yellow"
                          />
                        )}

                        {results.stage5_aiStrategy.faq.suggestedNewQuestions.length > 0 && (
                          <ModernStrategyCard
                            icon={<MessageSquare className="w-5 h-5" />}
                            title="Yeni FAQ Sorularını Ekle"
                            description={`${results.stage5_aiStrategy.faq.suggestedNewQuestions.length} yeni soru`}
                            checked={selectedStrategies.useSuggestedFAQs}
                            onChange={(checked) => setSelectedStrategies(s => ({ ...s, useSuggestedFAQs: checked }))}
                            color="green"
                          />
                        )}

                        {results.stage5_aiStrategy.contentGap.missedTopics.length > 0 && (
                          <ModernStrategyCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Content Gap'leri Doldur"
                            description={`${results.stage5_aiStrategy.contentGap.missedTopics.length} eksik konu`}
                            detail="Rakiplerin atladığı konular"
                            checked={selectedStrategies.useContentGaps}
                            onChange={(checked) => setSelectedStrategies(s => ({ ...s, useContentGaps: checked }))}
                            color="orange"
                          />
                        )}
                      </div>

                      <div className="mt-6 flex justify-between">
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

            {/* Right Column: Live Prompt Preview */}
            {results && (
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>📝 Canlı Prompt Önizlemesi</span>
                      <span className="text-xs font-normal px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full">
                        {aiProvider === 'groq' ? '🚀 Groq' : '🧠 Claude'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[600px]">
                      <pre className="whitespace-pre-wrap">{promptPreview || 'Strateji seçimleriniz burada görünecek...'}</pre>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      ✨ Seçimleriniz prompt'u dinamik olarak günceller
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    icon={<Award className="w-5 h-5" />}
                    label="SEO Skoru"
                    value={`${generatedContent.seoScore.overall}/100`}
                    color="green"
                  />
                  <StatCard
                    icon={<FileText className="w-5 h-5" />}
                    label="Kelime Sayısı"
                    value={generatedContent.fullMarkdown.split(/\s+/).filter(Boolean).length.toLocaleString()}
                    color="blue"
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5" />}
                    label="Başlık Sayısı"
                    value={generatedContent.structure.outline.length}
                    color="purple"
                  />
                  <StatCard
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="FAQ Sayısı"
                    value={generatedContent.content.faq.length}
                    color="orange"
                  />
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Meta Bilgileri</h3>
                  <p className="text-sm text-blue-800 mb-1"><strong>Title:</strong> {generatedContent.meta.title}</p>
                  <p className="text-sm text-blue-800"><strong>Description:</strong> {generatedContent.meta.description}</p>
                </div>

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

function ProgressStep({
  number,
  label,
  active,
  completed,
  onClick,
  clickable,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  onClick: () => void;
  clickable: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
          completed
            ? 'bg-green-600 text-white'
            : active
            ? 'bg-black text-white'
            : 'bg-gray-200 text-gray-500'
        } ${clickable ? 'hover:scale-110' : ''}`}
      >
        {completed ? <CheckCircle className="w-6 h-6" /> : number}
      </div>
      <span className={`text-xs mt-2 text-center ${active ? 'text-black font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function ProgressLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
      <div
        className={`h-full transition-all duration-500 ${completed ? 'bg-green-600 w-full' : 'bg-gray-200 w-0'}`}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ModernStrategyCard({
  icon,
  title,
  description,
  detail,
  chips,
  checked,
  onChange,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
  chips?: string[];
  checked: boolean;
  onChange: (checked: boolean) => void;
  color: string;
}) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-purple-500 bg-purple-50',
    green: 'border-green-500 bg-green-50',
    orange: 'border-orange-500 bg-orange-50',
    yellow: 'border-yellow-500 bg-yellow-50',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
        checked
          ? `${colorClasses[color as keyof typeof colorClasses]} shadow-md`
          : 'border-gray-200 bg-white hover:border-gray-300'
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
          <div className="flex items-center mb-1">
            <span className={`mr-2 ${iconColorClasses[color as keyof typeof iconColorClasses]}`}>{icon}</span>
            <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
          </div>
          <p className="text-sm text-gray-700 mb-1">{description}</p>
          {detail && <p className="text-xs text-gray-600 italic">{detail}</p>}
          {chips && chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {chips.map((chip, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-900 rounded text-xs">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
