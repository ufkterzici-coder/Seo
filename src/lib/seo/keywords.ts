export function extractKeywords(text: string, limit: number = 10): string[] {
  const stopWords = new Set([
    'bir', 've', 'veya', 'ile', 'için', 'bu', 'şu', 'o', 'de', 'da', 'mi', 'mı',
    'ne', 'nasıl', 'neden', 'niçin', 'kim', 'nerede', 'ne zaman', 'gibi', 'kadar',
    'daha', 'en', 'çok', 'az', 'var', 'yok', 'olan', 'olduğu', 'yapan', 'eden',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const keywordOccurrences = words.filter(word =>
    word.includes(keyword.toLowerCase())
  ).length;

  return (keywordOccurrences / words.length) * 100;
}
