export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num);
}

export function readingTime(wordCount: number): number {
  // Ortalama okuma hızı: 200 kelime/dakika
  return Math.ceil(wordCount / 200);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}
