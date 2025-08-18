import { FlavorChart } from '@/types/sake';

/**
 * フレーバーチャートを4象限座標に変換
 * 
 * @param flavorChart さけのわAPIのフレーバーチャートデータ
 * @returns 甘辛度・淡濃度の座標(-3 〜 +3)
 */
export function convertFlavorToCoordinates(flavorChart: FlavorChart) {
  // 甘辛度の計算: 芳醇度を基準に、ドライ度で調整
  // 芳醇度が高く、ドライ度が低い = 甘口
  const sweetnessRaw = flavorChart.f2 * 2 - flavorChart.f5 * 2;
  const sweetness = Math.max(-3, Math.min(3, sweetnessRaw * 3));
  
  // 淡濃度の計算: 重厚度を基準に、軽快度で調整
  // 重厚度が高く、軽快度が低い = 濃醇
  const richnessRaw = flavorChart.f3 * 2 - flavorChart.f6 * 2;
  const richness = Math.max(-3, Math.min(3, richnessRaw * 3));
  
  // -3 から 3 の範囲に正規化
  return {
    sweetness,
    richness
  };
}

/**
 * フレーバーチャートから説明文を生成
 * 
 * @param flavorChart さけのわAPIのフレーバーチャートデータ
 * @returns 日本酒の特徴を表す説明文
 */
export function createFlavorDescription(flavorChart: FlavorChart): string {
  const attributes: string[] = [];
  
  if (flavorChart.f1 > 0.6) attributes.push('華やかな香り');
  if (flavorChart.f2 > 0.6) attributes.push('芳醇な味わい');
  if (flavorChart.f3 > 0.6) attributes.push('重厚な飲み口');
  if (flavorChart.f4 > 0.6) attributes.push('穏やかな風味');
  if (flavorChart.f5 > 0.6) attributes.push('ドライな後味');
  if (flavorChart.f6 > 0.6) attributes.push('軽快な口当たり');
  
  return attributes.length > 0 ? attributes.join('、') : '特徴的な味わい';
}