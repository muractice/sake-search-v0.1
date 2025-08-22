'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-geo';

interface JapanD3MapProps {
  prefectureStats: { [key: string]: number };
  onPrefectureClick: (prefectureName: string) => void;
}

export const JapanD3Map = ({ prefectureStats, onPrefectureClick }: JapanD3MapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPrefecture, setHoveredPrefecture] = useState<string | null>(null);

  // 記録数に基づく色を取得
  const getColorForPrefecture = (prefectureName: string) => {
    const count = prefectureStats[prefectureName] || 0;
    
    if (count === 0) return '#e5e7eb'; // gray-200
    
    // 緑のグラデーション
    if (count >= 10) return '#15803d'; // green-700
    if (count >= 5) return '#16a34a'; // green-600
    if (count >= 3) return '#22c55e'; // green-500
    if (count >= 1) return '#4ade80'; // green-400
    return '#86efac'; // green-300
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // 投影法の設定（日本地図用）
    const projection = d3.geoMercator()
      .center([137, 38]) // 日本の中心座標
      .scale(1200)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // ここで実際のGeoJSONデータを使用する必要があります
    // 今回は簡易的な実装のため、静的なデータを使用します
  }, [prefectureStats]);

  // d3-geoが正常に動作しない場合のフォールバック
  return (
    <div className="relative">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          🚧 d3-geoによる地図描画を準備中です。日本のGeoJSONデータが必要です。
        </p>
      </div>
      
      <svg 
        ref={svgRef}
        width="800"
        height="600"
        viewBox="0 0 800 600"
        className="w-full h-auto border rounded-lg bg-gray-50"
      />

      {hoveredPrefecture && (
        <div className="absolute top-4 left-4 bg-white shadow-lg px-4 py-2 rounded-lg border">
          <div className="font-bold">{hoveredPrefecture}</div>
          <div className="text-sm text-gray-600">
            記録数: {prefectureStats[hoveredPrefecture] || 0}件
          </div>
        </div>
      )}
    </div>
  );
};