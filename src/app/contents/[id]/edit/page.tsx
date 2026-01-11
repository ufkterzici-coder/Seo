'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import { slugify } from '@/lib/utils/slug';
import { readingTime } from '@/lib/utils/format';

export default function EditContentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    meta_title: '',
    meta_description: '',
    slug: '',
    main_keyword: '',
    content_markdown: '',
    status: 'draft',
  });

  useEffect(() => {
    loadContent();
  }, [params.id]);

  async function loadContent() {
    try {
      const response = await fetch(`/api/contents`);
      if (response.ok) {
        const allContents = await response.json();
        const content = allContents.find((c: any) => c.id === params.id);
        
        if (content) {
          setFormData({
            title: content.title || '',
            meta_title: content.meta_title || '',
            meta_description: content.meta_description || '',
            slug: content.slug || '',
            main_keyword: content.main_keyword || '',
            content_markdown: content.content_markdown || '',
            status: content.status || 'draft',
          });
        } else {
          setError('İçerik bulunamadı');
        }
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      setError('İçerik yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.title || !formData.content_markdown) {
      setError('Başlık ve içerik gereklidir');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const wordCount = formData.content_markdown.split(/\s+/).length;
      
      const response = await fetch('/api/contents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          title: formData.title,
          slug: formData.slug || slugify(formData.title),
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          main_keyword: formData.main_keyword,
          content_markdown: formData.content_markdown,
          word_count: wordCount,
          reading_time: readingTime(wordCount),
          status: formData.status,
        }),
      });

      if (response.ok) {
        router.push(`/contents/${params.id}`);
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      setError('İçerik güncellenemedi');
      console.error(err);
    } finally {
      setSaving(false);
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

  return (
    <>
      <Navbar />
      <Container>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/contents/${params.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">İçeriği Düzenle</h1>
              <p className="text-gray-600">İçeriğinizi güncelleyin</p>
            </div>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="space-y-4">
                <Input
                  label="Başlık *"
                  placeholder="İçerik başlığı"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <Input
                  label="Ana Anahtar Kelime"
                  placeholder="anahtar kelime"
                  value={formData.main_keyword}
                  onChange={(e) => setFormData({ ...formData, main_keyword: e.target.value })}
                />

                <Textarea
                  label="İçerik (Markdown) *"
                  rows={20}
                  placeholder="# Ana Başlık&#10;&#10;İçeriğiniz..."
                  value={formData.content_markdown}
                  onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Ayarları</h3>
              <div className="space-y-4">
                <Input
                  label="Meta Başlık"
                  placeholder="SEO başlık (max 60)"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  maxLength={60}
                />
                <div className="text-xs text-gray-500 -mt-2">
                  {formData.meta_title.length}/60 karakter
                </div>

                <Textarea
                  label="Meta Açıklama"
                  placeholder="SEO açıklama (max 155)"
                  rows={3}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  maxLength={155}
                />
                <div className="text-xs text-gray-500 -mt-2">
                  {formData.meta_description.length}/155 karakter
                </div>

                <Input
                  label="Slug"
                  placeholder="url-friendly-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum</h3>
              <Select
                label="Yayın Durumu"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'draft', label: 'Taslak' },
                  { value: 'published', label: 'Yayında' },
                ]}
              />
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kelime Sayısı:</span>
                  <span className="font-medium text-gray-900">
                    {formData.content_markdown.split(/\s+/).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Okuma Süresi:</span>
                  <span className="font-medium text-gray-900">
                    {readingTime(formData.content_markdown.split(/\s+/).filter(Boolean).length)} dk
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
