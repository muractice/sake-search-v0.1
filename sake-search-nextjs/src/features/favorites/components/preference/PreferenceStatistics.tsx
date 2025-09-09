'use client';

interface PreferenceStatisticsProps {
  diversityScore: number;
  adventureScore: number;
  totalFavorites: number;
}

export const PreferenceStatistics = ({ 
  diversityScore, 
  adventureScore, 
  totalFavorites 
}: PreferenceStatisticsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-gray-600">多様性</div>
          <div className="text-sm font-bold text-blue-600">
            {Math.round(diversityScore * 100)}%
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-xs text-gray-600">冒険度</div>
          <div className="text-sm font-bold text-green-600">
            {Math.round(adventureScore * 100)}%
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        分析対象: {totalFavorites}件のお気に入り
      </div>
    </>
  );
};