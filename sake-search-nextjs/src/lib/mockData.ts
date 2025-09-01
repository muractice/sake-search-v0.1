import { Brand, Brewery, FlavorChart, SakeData } from '@/types/sake';

export const MOCK_BRANDS: Brand[] = [
  { id: 1, name: "獺祭 純米大吟醸 45", breweryId: 1 },
  { id: 2, name: "八海山 純米吟醸", breweryId: 2 },
  { id: 3, name: "久保田 萬寿", breweryId: 3 },
  { id: 4, name: "十四代 本丸", breweryId: 4 },
  { id: 5, name: "而今 純米吟醸", breweryId: 5 },
  { id: 6, name: "新政 No.6", breweryId: 6 },
  { id: 7, name: "田酒 特別純米", breweryId: 7 },
  { id: 8, name: "鍋島 純米吟醸", breweryId: 8 },
  { id: 9, name: "黒龍 石田屋", breweryId: 9 },
  { id: 10, name: "飛露喜 純米吟醸", breweryId: 10 }
];

export const MOCK_BREWERIES: Brewery[] = [
  { id: 1, name: "旭酒造" },
  { id: 2, name: "八海醸造" },
  { id: 3, name: "朝日酒造" },
  { id: 4, name: "高木酒造" },
  { id: 5, name: "木屋正酒造" },
  { id: 6, name: "新政酒造" },
  { id: 7, name: "西田酒造店" },
  { id: 8, name: "富久千代酒造" },
  { id: 9, name: "黒龍酒造" },
  { id: 10, name: "廣木酒造" }
];

export const MOCK_FLAVOR_CHARTS: FlavorChart[] = [
  { brandId: 1, f1: 0.8, f2: 0.6, f3: 0.2, f4: 0.4, f5: 0.3, f6: 0.8 },
  { brandId: 2, f1: 0.5, f2: 0.3, f3: 0.4, f4: 0.6, f5: 0.7, f6: 0.5 },
  { brandId: 3, f1: 0.6, f2: 0.7, f3: 0.6, f4: 0.4, f5: 0.4, f6: 0.3 },
  { brandId: 4, f1: 0.9, f2: 0.8, f3: 0.7, f4: 0.3, f5: 0.2, f6: 0.2 },
  { brandId: 5, f1: 0.7, f2: 0.8, f3: 0.5, f4: 0.3, f5: 0.3, f6: 0.4 },
  { brandId: 6, f1: 0.8, f2: 0.5, f3: 0.3, f4: 0.4, f5: 0.6, f6: 0.7 },
  { brandId: 7, f1: 0.5, f2: 0.6, f3: 0.7, f4: 0.5, f5: 0.4, f6: 0.3 },
  { brandId: 8, f1: 0.7, f2: 0.6, f3: 0.4, f4: 0.4, f5: 0.5, f6: 0.5 },
  { brandId: 9, f1: 0.6, f2: 0.7, f3: 0.8, f4: 0.4, f5: 0.3, f6: 0.2 },
  { brandId: 10, f1: 0.8, f2: 0.7, f3: 0.5, f4: 0.3, f5: 0.3, f6: 0.4 }
];

// フレーバーチャートを4象限座標に変換
function convertFlavorToCoordinates(flavorChart: FlavorChart) {
  // 甘辛度の計算: 芳醇(f2) - ドライ(f5)
  const sweetness = (flavorChart.f2 - flavorChart.f5) * 3;
  
  // 淡濃度の計算: 重厚(f3) - 軽快(f6)
  const richness = (flavorChart.f3 - flavorChart.f6) * 3;
  
  // -3 から 3 の範囲に正規化
  return {
    sweetness: Math.max(-3, Math.min(3, sweetness)),
    richness: Math.max(-3, Math.min(3, richness))
  };
}

// フレーバーチャートから説明文を生成
function createDescription(flavorChart: FlavorChart): string {
  const attributes: string[] = [];
  
  if (flavorChart.f1 > 0.6) attributes.push('華やかな香り');
  if (flavorChart.f2 > 0.6) attributes.push('芳醇な味わい');
  if (flavorChart.f3 > 0.6) attributes.push('重厚な飲み口');
  if (flavorChart.f4 > 0.6) attributes.push('穏やかな風味');
  if (flavorChart.f5 > 0.6) attributes.push('ドライな後味');
  if (flavorChart.f6 > 0.6) attributes.push('軽快な口当たり');
  
  return attributes.length > 0 ? attributes.join('、') : '特徴的な味わい';
}

// 完全な日本酒データを構築
export function buildMockSakeData(): SakeData[] {
  return MOCK_BRANDS.map(brand => {
    const brewery = MOCK_BREWERIES.find(b => b.id === brand.breweryId);
    const flavorChart = MOCK_FLAVOR_CHARTS.find(f => f.brandId === brand.id);
    
    if (!brewery || !flavorChart) {
      throw new Error(`Missing data for brand ${brand.id}`);
    }
    
    const coordinates = convertFlavorToCoordinates(flavorChart);
    
    return {
      id: `sake_${brand.id}`,
      brandId: brand.id,
      name: brand.name,
      brewery: brewery.name,
      breweryId: brand.breweryId,
      sweetness: coordinates.sweetness,
      richness: coordinates.richness,
      description: createDescription(flavorChart),
      flavorChart
    };
  });
}

// 検索機能
export function searchMockSakeData(query: string): SakeData[] {
  const allData = buildMockSakeData();
  const normalizedQuery = query.toLowerCase().trim();
  
  return allData.filter(sake => 
    sake.name.toLowerCase().includes(normalizedQuery) ||
    sake.brewery.toLowerCase().includes(normalizedQuery)
  );
}