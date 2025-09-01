'use client';

import { useState, useCallback } from 'react';
import { TrendingRecommendations } from './TrendingRecommendations';
import { PersonalizedRecommendations } from './PersonalizedRecommendations';
import { SakeData } from '@/types/sake';

interface RecommendationSectionProps {
  onSelectSake?: (sake: SakeData) => void;
  onAddToComparison?: (sake: SakeData) => void;
  isInComparison?: (sakeId: string) => boolean;
  className?: string;
}

export const RecommendationSection = ({
  onSelectSake,
  onAddToComparison,
  isInComparison,
  className = ''
}: RecommendationSectionProps) => {
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'explore'>('personalized');

  const handleSakeSelect = useCallback((sake: SakeData) => {
    onSelectSake?.(sake);
  }, [onSelectSake]);

  const handleAddToComparison = useCallback((sake: SakeData) => {
    onAddToComparison?.(sake);
  }, [onAddToComparison]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* タブ切り替え */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('personalized')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'personalized'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎯 あなたへのおすすめ
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trending'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔥 トレンド
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'explore'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🚀 新しい発見
          </button>
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-[400px]">
        {activeTab === 'personalized' && (
          <PersonalizedRecommendations
            onSelectSake={handleSakeSelect}
            onAddToComparison={handleAddToComparison}
            isInComparison={isInComparison}
          />
        )}
        
        {activeTab === 'trending' && (
          <TrendingRecommendations
            onSelectSake={handleSakeSelect}
            onAddToComparison={handleAddToComparison}
            isInComparison={isInComparison}
          />
        )}
        
        {activeTab === 'explore' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">🚀 新しい味わいを探す</h3>
            <div className="grid gap-4">
              <ExploreCard
                title="甘口の世界"
                description="フルーティーで優しい甘みの日本酒"
                category="sweet"
                onExplore={() => {/* TODO: 実装 */}}
              />
              <ExploreCard
                title="辛口の極み"
                description="キレのある爽快な辛口日本酒"
                category="dry"
                onExplore={() => {/* TODO: 実装 */}}
              />
              <ExploreCard
                title="濃醇な味わい"
                description="深みのある豊かな風味"
                category="rich"
                onExplore={() => {/* TODO: 実装 */}}
              />
              <ExploreCard
                title="淡麗な一杯"
                description="すっきりと軽やかな飲み口"
                category="light"
                onExplore={() => {/* TODO: 実装 */}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ExploreCardProps {
  title: string;
  description: string;
  category: string;
  onExplore: () => void;
}

const ExploreCard = ({ title, description, category, onExplore }: ExploreCardProps) => {
  const categoryColors = {
    sweet: 'from-pink-400 to-red-400',
    dry: 'from-blue-400 to-indigo-400',
    rich: 'from-amber-400 to-orange-400',
    light: 'from-green-400 to-teal-400',
  };

  return (
    <div
      className={`p-4 rounded-lg bg-gradient-to-r ${categoryColors[category as keyof typeof categoryColors]} text-white cursor-pointer hover:scale-105 transition-transform`}
      onClick={onExplore}
    >
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
};