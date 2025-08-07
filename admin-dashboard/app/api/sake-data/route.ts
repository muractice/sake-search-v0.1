import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Brand {
  id: number;
  name: string;
  breweryId: number;
}

interface FlavorChart {
  brandId: number;
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
}

interface Brewery {
  id: number;
  name: string;
  prefecture?: string;
}

// 座標変換ロジック（既存のロジックと同じ）
function convertFlavorToCoordinates(flavorChart: FlavorChart) {
  const sweetnessRaw = flavorChart.f2 * 2 - flavorChart.f5 * 2;
  const sweetness = sweetnessRaw * 3;
  
  const richnessRaw = flavorChart.f3 * 2 - flavorChart.f6 * 2;
  const richness = richnessRaw * 3;
  
  return {
    sweetness: Math.max(-3, Math.min(3, sweetness)),
    richness: Math.max(-3, Math.min(3, richness))
  };
}

export async function GET() {
  try {
    // データファイルのパスを設定（プロジェクトルートからの相対パス）
    const dataDir = path.join(process.cwd(), '..', 'sakenowa-api-research');
    
    // データを読み込み
    const brandsData = JSON.parse(
      await fs.readFile(path.join(dataDir, 'brands.json'), 'utf-8')
    );
    const flavorData = JSON.parse(
      await fs.readFile(path.join(dataDir, 'flavor-charts.json'), 'utf-8')
    );
    
    // ブランドとフレーバーチャートをマッピング
    const brandsMap = new Map<number, Brand>();
    brandsData.brands.forEach((brand: Brand) => {
      brandsMap.set(brand.id, brand);
    });
    
    const flavorMap = new Map<number, FlavorChart>();
    flavorData.flavorCharts.forEach((flavor: FlavorChart) => {
      flavorMap.set(flavor.brandId, flavor);
    });
    
    // 酒蔵データ（仮データ - 実際のAPIから取得する場合は要修正）
    // ここでは簡易的に酒蔵IDから都道府県を推定
    const breweryMap = new Map<number, Brewery>();
    const prefectures = [
      '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
      '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
      '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
      '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
      '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
      '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
      '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];
    
    // 結果を構築
    const result = [];
    
    for (const [brandId, brand] of brandsMap) {
      const flavorChart = flavorMap.get(brandId);
      if (!flavorChart) continue;
      
      const coordinates = convertFlavorToCoordinates(flavorChart);
      
      // 酒蔵情報（仮実装）
      const breweryId = brand.breweryId;
      let brewery = breweryMap.get(breweryId);
      if (!brewery) {
        brewery = {
          id: breweryId,
          name: `酒蔵${breweryId}`,
          prefecture: prefectures[breweryId % prefectures.length]
        };
        breweryMap.set(breweryId, brewery);
      }
      
      result.push({
        id: brandId,
        brandId: brandId,
        name: brand.name,
        breweryId: breweryId,
        breweryName: brewery.name,
        prefecture: brewery.prefecture,
        sweetness: coordinates.sweetness,
        richness: coordinates.richness,
        originalData: {
          f1: flavorChart.f1,
          f2: flavorChart.f2,
          f3: flavorChart.f3,
          f4: flavorChart.f4,
          f5: flavorChart.f5,
          f6: flavorChart.f6
        }
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to load sake data:', error);
    return NextResponse.json(
      { error: 'Failed to load sake data' },
      { status: 500 }
    );
  }
}