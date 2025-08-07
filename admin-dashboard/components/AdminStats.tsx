'use client';

interface AdminSakeData {
  id: number;
  name: string;
  sweetness: number;
  richness: number;
  originalData: {
    f1: number;
    f2: number;
    f3: number;
    f4: number;
    f5: number;
    f6: number;
  };
}

interface AdminStatsProps {
  sakeData: AdminSakeData[];
}

export default function AdminStats({ sakeData }: AdminStatsProps) {
  // 統計値を計算
  const calculateStats = (values: number[]) => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return { min, max, avg, median };
  };

  const sweetnessValues = sakeData.map(sake => sake.sweetness);
  const richnessValues = sakeData.map(sake => sake.richness);
  
  const sweetnessStats = calculateStats(sweetnessValues);
  const richnessStats = calculateStats(richnessValues);

  // f1-f6の統計も計算
  const fStats = {
    f1: calculateStats(sakeData.map(sake => sake.originalData.f1)),
    f2: calculateStats(sakeData.map(sake => sake.originalData.f2)),
    f3: calculateStats(sakeData.map(sake => sake.originalData.f3)),
    f4: calculateStats(sakeData.map(sake => sake.originalData.f4)),
    f5: calculateStats(sakeData.map(sake => sake.originalData.f5)),
    f6: calculateStats(sakeData.map(sake => sake.originalData.f6)),
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 変換後の座標統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          座標統計
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">甘辛度（X軸）</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">最小値:</span>
                <span className="ml-2 font-mono">{sweetnessStats.min.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">最大値:</span>
                <span className="ml-2 font-mono">{sweetnessStats.max.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">平均値:</span>
                <span className="ml-2 font-mono">{sweetnessStats.avg.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">中央値:</span>
                <span className="ml-2 font-mono">{sweetnessStats.median.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">淡濃度（Y軸）</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">最小値:</span>
                <span className="ml-2 font-mono">{richnessStats.min.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">最大値:</span>
                <span className="ml-2 font-mono">{richnessStats.max.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">平均値:</span>
                <span className="ml-2 font-mono">{richnessStats.avg.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">中央値:</span>
                <span className="ml-2 font-mono">{richnessStats.median.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 元データ（f1-f6）の統計 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          元データ統計（f1-f6）
        </h3>
        
        <div className="space-y-2">
          {Object.entries(fStats).map(([key, stats]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{key}:</span>
              <div className="flex space-x-4 font-mono text-xs">
                <span className="text-gray-500">
                  min: {stats.min.toFixed(3)}
                </span>
                <span className="text-gray-500">
                  avg: {stats.avg.toFixed(3)}
                </span>
                <span className="text-gray-500">
                  max: {stats.max.toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500">
            変換式:
          </p>
          <p className="text-xs font-mono text-gray-600 mt-1">
            甘辛度 = (f2 × 2 - f5 × 2) × 3
          </p>
          <p className="text-xs font-mono text-gray-600">
            淡濃度 = (f3 × 2 - f6 × 2) × 3
          </p>
        </div>
      </div>
    </div>
  );
}