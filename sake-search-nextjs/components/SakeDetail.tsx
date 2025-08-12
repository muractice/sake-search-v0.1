'use client';

import { SakeData } from '@/types/sake';
import { FavoriteButton } from './FavoriteButton';

interface SakeDetailProps {
  sake: SakeData;
  onCompare?: (sake: SakeData) => void;
  isInComparison?: boolean;
  showCompareButton?: boolean;
}

export default function SakeDetail({ sake, onCompare, isInComparison, showCompareButton = false }: SakeDetailProps) {
  return (
    <div className="space-y-4">
      {showCompareButton && onCompare && (
        <button
          onClick={() => onCompare(sake)}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
            isInComparison
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isInComparison ? '比較から削除' : '比較に追加'}
        </button>
      )}
      
      <div className="border-b border-gray-200 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <dt className="font-medium text-gray-700">酒名</dt>
            <dd className="text-lg font-semibold text-gray-900">{sake.name}</dd>
          </div>
          <FavoriteButton sake={sake} />
        </div>
      </div>
      
      <div className="border-b border-gray-200 pb-3">
        <dt className="font-medium text-gray-700">蔵元</dt>
        <dd className="text-gray-900">{sake.brewery}</dd>
      </div>
      
      <div className="border-b border-gray-200 pb-3">
        <dt className="font-medium text-gray-700">特徴</dt>
        <dd className="text-gray-900">{sake.description}</dd>
      </div>
      
      <div>
        <dt className="font-medium text-gray-700 mb-3">味覚座標</dt>
        <dd className="space-y-3">
          <div className="flex justify-between items-center bg-blue-50 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-blue-800">甘辛度</span>
            <span className="text-lg font-bold text-blue-900">
              {sake.sweetness > 0 ? '+' : ''}{sake.sweetness.toFixed(1)}
            </span>
          </div>
          
          <div className="flex justify-between items-center bg-green-50 px-4 py-3 rounded-lg">
            <span className="text-sm font-medium text-green-800">淡濃度</span>
            <span className="text-lg font-bold text-green-900">
              {sake.richness > 0 ? '+' : ''}{sake.richness.toFixed(1)}
            </span>
          </div>
        </dd>
      </div>
      
      {sake.flavorChart && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <dt className="font-medium text-gray-700 mb-3">詳細な味覚プロファイル</dt>
          <dd className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>華やか</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f1 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f1 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>芳醇</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f2 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f2 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>重厚</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f3 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f3 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>穏やか</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f4 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f4 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>ドライ</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f5 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f5 * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>軽快</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${sake.flavorChart.f6 * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{(sake.flavorChart.f6 * 100).toFixed(0)}%</span>
              </div>
            </div>
          </dd>
        </div>
      )}
    </div>
  );
}