/**
 * 比較機能に関するユーティリティ関数とヘルパー
 */

/**
 * 比較リストの最大アイテム数
 */
export const MAX_COMPARISON_ITEMS = 10;

/**
 * 味覚指標をフォーマット
 * @param value 味覚指標の値
 * @param type 指標のタイプ（甘辛または淡濃）
 * @returns フォーマットされた文字列
 */
export const formatTasteIndicator = (
  value: number,
  type: 'sweetness' | 'richness'
): string => {
  if (type === 'sweetness') {
    return value > 0 
      ? `甘口 +${value.toFixed(1)}` 
      : `辛口 ${value.toFixed(1)}`;
  }
  
  return value > 0 
    ? `濃醇 +${value.toFixed(1)}` 
    : `淡麗 ${value.toFixed(1)}`;
};

/**
 * 比較リストが満杯かどうかを判定
 * @param currentCount 現在のアイテム数
 * @returns 満杯の場合true
 */
export const isComparisonListFull = (currentCount: number): boolean => {
  return currentCount >= MAX_COMPARISON_ITEMS;
};

/**
 * 比較リストの進捗状況テキストを取得
 * @param current 現在のアイテム数
 * @param max 最大アイテム数
 * @returns 進捗状況のテキスト
 */
export const getComparisonProgressText = (
  current: number,
  max: number = MAX_COMPARISON_ITEMS
): string => {
  return `最大${max}つまでの日本酒を選択して比較できます（${current}/${max}）`;
};