'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

export default function ContentsPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [contents, searchQuery, statusFilter]);

  async function loadContents() {
    try {
      const response = await fetch('/api/contents');
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterContents() {
    let filtered = [...contents];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.main_keyword?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredContents(filtered);
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">İçerikler</h1>
              <p className="text-gray-600">Tüm içeriklerinizi görüntüleyin ve yönetin</p>
            </div>
            <Link href="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni İçerik
              </Button>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="İçeriklerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-gray-400" />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tümü' },
                { value: 'draft', label: 'Taslak' },
                { value: 'published', label: 'Yayında' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Yükleniyor...
            </CardContent>
          </Card>
        ) : filteredContents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Sonuç bulunamadı'
                  : 'Henüz içerik yok'}
              </div>
              {!searchQuery && statusFilter === 'all' && (
                <Link href="/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    İlk İçeriğinizi Oluşturun
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContents.map((content) => (
              <Link key={content.id} href={`/contents/${content.id}`}>
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {content.title || 'Başlıksız'}
                          </h2>
                          <Badge variant={content.status === 'published' ? 'success' : 'default'}>
                            {content.status === 'published' ? 'Yayında' : 'Taslak'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="font-medium">{content.main_keyword}</span>
                          <span>•</span>
                          <span>{content.word_count} kelime</span>
                          <span>•</span>
                          <span>{content.reading_time} dk okuma</span>
                          <span>•</span>
                          <span>{formatDate(content.created_at)}</span>
                        </div>
                      </div>
                      <div className="ml-6 text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {content.seo_score}
                        </div>
                        <div className="text-xs text-gray-600">SEO Skoru</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {filteredContents.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            {filteredContents.length} içerik gösteriliyor
            {(searchQuery || statusFilter !== 'all') && ` (${contents.length} içerikten)`}
          </div>
        )}
      </Container>
    </>
  );
}
