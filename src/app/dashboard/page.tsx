'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { FileText, CheckCircle, FileEdit, Star, Pencil, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, avgScore: 0 });
  const [recentContents, setRecentContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, contentsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/contents'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (contentsRes.ok) {
        const contentsData = await contentsRes.json();
        setRecentContents(contentsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
          <p className="text-gray-600">Create SEO-optimized content with AI</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.published}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.drafts}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileEdit className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgScore}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hover>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Create Content</h3>
                    <p className="text-sm text-gray-600 mb-4">Generate SEO article with AI</p>
                    <Link href="/create">
                      <Button size="sm">Get Started</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Analyze Competitor</h3>
                    <p className="text-sm text-gray-600 mb-4">Scrape & analyze URL</p>
                    <Link href="/analyze">
                      <Button variant="secondary" size="sm">Start</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Contents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Contents</h2>
            <Link href="/contents">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Loading...
              </CardContent>
            </Card>
          ) : recentContents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No contents yet. Create your first content!
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentContents.map((content) => (
                    <div key={content.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {content.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>{content.main_keyword}</span>
                            <span>•</span>
                            <span>{content.word_count} words</span>
                            <span>•</span>
                            <span>{formatDate(content.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 ml-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{content.seo_score}/100</div>
                          </div>
                          <Badge variant={content.status === 'published' ? 'success' : 'default'}>
                            {content.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
