'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { marked } from 'marked';

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadContent();
  }, [params.id]);

  async function loadContent() {
    try {
      const response = await fetch(`/api/contents?id=${params.id}`);
      if (response.ok) {
        const allContents = await response.json();
        const foundContent = allContents.find((c: any) => c.id === params.id);
        if (foundContent) {
          setContent(foundContent);
        }
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Bu içeriği silmek istediğinizden emin misiniz?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/contents?id=${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/contents');
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('İçerik silinemedi');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Yükleniyor...</div>
          </div>
        </Container>
      </>
    );
  }

  if (!content) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-gray-500 mb-4">İçerik bulunamadı</div>
            <Button onClick={() => router.push('/contents')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </Container>
      </>
    );
  }

  const htmlContent = marked(content.content_markdown || '');

  return (
    <>
      <Navbar />
      <Container>
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/contents')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tüm İçerikler
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
                <Badge variant={content.status === 'published' ? 'success' : 'default'}>
                  {content.status === 'published' ? 'Yayında' : 'Taslak'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{content.main_keyword}</span>
                <span>•</span>
                <span>{content.word_count} kelime</span>
                <span>•</span>
                <span>{content.reading_time} dk okuma</span>
                <span>•</span>
                <span>SEO Skoru: {content.seo_score}/100</span>
                <span>•</span>
                <span>{formatDate(content.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/contents/${content.id}/edit`)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <article
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Score */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Skoru</h3>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-gray-900">{content.seo_score}</div>
                <div className="text-sm text-gray-600">/ 100</div>
              </div>
              <div className="space-y-2">
                {content.seo_checks && JSON.parse(content.seo_checks).keywordInTitle && (
                  <div className="flex items-center text-sm text-green-600">
                    <span className="mr-2">✓</span>
                    <span>Başlıkta anahtar kelime</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Meta Tags */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meta Etiketleri</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Başlık
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                    {content.meta_title}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Açıklama
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                    {content.meta_description}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Slug
                  </label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                    {content.slug}
                  </div>
                </div>
              </div>
            </Card>

            {/* Keywords */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Anahtar Kelimeler</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Ana Anahtar Kelime
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {content.main_keyword}
                  </div>
                </div>
                {content.secondary_keywords && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-2">
                      İkincil Kelimeler
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(content.secondary_keywords).map((keyword: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
