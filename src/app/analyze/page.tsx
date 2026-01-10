'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Search } from 'lucide-react';

export default function AnalyzePage() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);

    if (urlList.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    if (urlList.length > 5) {
      setError('Maximum 5 URLs allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError('Failed to analyze competitors. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Competitor Analysis</h1>
          <p className="text-gray-600">Analyze competitor content to improve your SEO</p>
        </div>

        <Card className="mb-6">
          <CardContent>
            <Textarea
              label="Enter URLs to analyze (one per line, max 5)"
              rows={5}
              placeholder="https://competitor1.com/article&#10;https://competitor2.com/post"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button onClick={handleAnalyze} loading={loading} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">URL</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Words</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Headings</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Images</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.competitors.map((comp: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{new URL(comp.url).hostname}</td>
                          <td className="py-3 px-4 text-gray-900">{comp.wordCount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-900">{comp.headingCount}</td>
                          <td className="py-3 px-4 text-gray-900">{comp.imageCount}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="py-3 px-4 text-gray-900">Average</td>
                        <td className="py-3 px-4 text-gray-900">{results.averageStats.wordCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-900">{results.averageStats.headingCount}</td>
                        <td className="py-3 px-4 text-gray-900">{results.averageStats.imageCount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Common Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {results.commonKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-primary-light text-primary rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heading Structure Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.competitors.map((comp: any, idx: number) => (
                    <div key={idx}>
                      <h4 className="font-semibold text-gray-900 mb-2">{new URL(comp.url).hostname}</h4>
                      <div className="text-sm space-y-1">
                        {comp.headings.h1.map((h1: string, h1Idx: number) => (
                          <div key={h1Idx} className="text-gray-900 font-medium">H1: {h1}</div>
                        ))}
                        {comp.headings.h2.map((h2: string, h2Idx: number) => (
                          <div key={h2Idx} className="ml-4 text-gray-700">├─ H2: {h2}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </>
  );
}
