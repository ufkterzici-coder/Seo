import { SEOScore } from '@/types/seo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SEOScoreCardProps {
  score: SEOScore;
}

export default function SEOScoreCard({ score }: SEOScoreCardProps) {
  const getVariant = (overall: number) => {
    if (overall >= 80) return 'success';
    if (overall >= 60) return 'warning';
    return 'error';
  };

  const checkLabels: Record<string, string> = {
    keywordInTitle: 'Keyword in title',
    keywordInH1: 'Keyword in H1',
    keywordInFirst100Words: 'First 100 words',
    keywordDensity: 'Keyword density 1-2%',
    metaDescriptionOptimized: 'Meta description',
    headingHierarchy: 'Heading hierarchy',
    internalLinks: 'Internal links',
    imageAltTexts: 'Image alt texts',
    readabilityScore: 'Readability score',
    contentLength: 'Content length',
    lsiKeywordsUsed: 'LSI keywords used',
    faqIncluded: 'FAQ included',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {score.overall}<span className="text-2xl text-gray-500">/100</span>
          </div>
          <Progress value={score.overall} variant={getVariant(score.overall)} />
        </div>

        <div className="space-y-2">
          {Object.entries(score.checks).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {value ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                  {checkLabels[key] || key}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
