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
import { Plus, Search, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { Content } from '@/types/content';

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [filteredContents, setFilteredContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [searchQuery, statusFilter, contents]);

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

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.title?.toLowerCase().includes(query) ||
          c.main_keyword?.toLowerCase().includes(query)
      );
    }

    setFilteredContents(filtered);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/contents?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadContents();
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  }

  return (
    <>
      <Navbar />
      <Container>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contents</h1>
            <p className="text-gray-600">Manage your SEO contents</p>
          </div>
          <Link href="/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search contents..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
            ]}
          />
        </div>

        {/* Contents List */}
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Loading...
            </CardContent>
          </Card>
        ) : filteredContents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No contents found
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {filteredContents.map((content) => (
                  <div key={content.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {content.title || 'Untitled'}
                        </h3>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>{content.main_keyword}</span>
                          <span>•</span>
                          <span>{content.word_count?.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{formatDate(content.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-3 mt-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-bold text-gray-900">
                              {content.seo_score}/100
                            </div>
                            <Badge variant={content.status === 'published' ? 'success' : 'default'}>
                              {content.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
