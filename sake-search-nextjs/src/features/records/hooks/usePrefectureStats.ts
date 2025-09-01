'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRecords } from './useRecords';
import { fetchFromSakenowaAPI } from '@/lib/sakenowaApi';
import { Prefecture, getPrefecture, getAllPrefectures } from '@/utils/prefectureMapping';

export interface PrefectureStats {
  prefecture: Prefecture;
  recordCount: number;    // その都道府県の日本酒を飲んだ回数
  uniqueBrands: number;   // その都道府県のユニーク銘柄数
  averageRating: number;  // その都道府県の日本酒の平均評価
  lastDrunkDate?: string; // 最後に飲んだ日
}

export interface PrefectureConquestStats {
  totalPrefectures: number;        // 全都道府県数（47）
  conqueredPrefectures: number;    // 制覇した都道府県数
  conquestRate: number;            // 制覇率（%）
  unConqueredPrefectures: Prefecture[]; // 未制覇都道府県
  topPrefectures: PrefectureStats[];     // 上位都道府県（記録数順）
}

export const usePrefectureStats = () => {
  const { records, isLoading: recordsLoading } = useRecords();
  const [error, setError] = useState<string | null>(null);

  // 都道府県別統計を計算
  const prefectureStats = useMemo((): PrefectureStats[] => {
    if (!records.length) return [];

    // 都道府県別に記録を集計
    const prefectureMap = new Map<string, {
      records: typeof records,
      brands: Set<string>,
      ratings: number[]
    }>();

    records.forEach(record => {
      // 記録データから直接都道府県情報を取得
      const prefectureName = record.sakePrefecture;
      if (prefectureName) {
        if (!prefectureMap.has(prefectureName)) {
          prefectureMap.set(prefectureName, {
            records: [],
            brands: new Set(),
            ratings: []
          });
        }

        const data = prefectureMap.get(prefectureName)!;
        data.records.push(record);
        data.brands.add(record.sakeName);
        data.ratings.push(record.rating);
      }
    });

    // 統計オブジェクトを生成
    const stats: PrefectureStats[] = [];
    
    prefectureMap.forEach((data, prefectureName) => {
      // 都道府県名から都道府県オブジェクトを検索
      const prefecture = getAllPrefectures().find(p => p.name === prefectureName);
      if (prefecture) {
        const averageRating = data.ratings.length > 0 
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
          : 0;

        const lastDrunkDate = data.records.length > 0
          ? data.records.sort((a, b) => b.date.localeCompare(a.date))[0].date
          : undefined;

        stats.push({
          prefecture,
          recordCount: data.records.length,
          uniqueBrands: data.brands.size,
          averageRating,
          lastDrunkDate
        });
      }
    });

    return stats.sort((a, b) => b.recordCount - a.recordCount);
  }, [records]);

  // 制覇統計を計算
  const conquestStats = useMemo((): PrefectureConquestStats => {
    const allPrefectures = getAllPrefectures();
    const conqueredPrefectureIds = new Set(prefectureStats.map(stat => stat.prefecture.id));
    const unConqueredPrefectures = allPrefectures.filter(p => !conqueredPrefectureIds.has(p.id));

    return {
      totalPrefectures: allPrefectures.length,
      conqueredPrefectures: prefectureStats.length,
      conquestRate: (prefectureStats.length / allPrefectures.length) * 100,
      unConqueredPrefectures,
      topPrefectures: prefectureStats.slice(0, 10)
    };
  }, [prefectureStats]);

  return {
    prefectureStats,
    conquestStats,
    isLoading: recordsLoading,
    error
  };
};