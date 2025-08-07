import { Brand, Brewery, FlavorChart, SakeData } from '@/types/sake';

const SAKENOWA_API_BASE = 'https://muro.sakenowa.com/sakenowa-data/api';

export async function fetchFromSakenowaAPI(endpoint: string) {
  const response = await fetch(`${SAKENOWA_API_BASE}/${endpoint}`, {
    next: { revalidate: 3600 } // 1時間キャッシュ
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
}

// フレーバーチャートを4象限座標に変換
function convertFlavorToCoordinates(flavorChart: FlavorChart) {
  // さけのわAPIの各パラメータを適切に組み合わせて座標を計算
  
  // 甘辛度の計算: 芳醇度を基準に、ドライ度で調整
  // 芳醇度が高く、ドライ度が低い = 甘口
  const sweetnessRaw = flavorChart.f2 * 2 - flavorChart.f5 * 2; // より明確な差を作る
  const sweetness = (sweetnessRaw - 0) * 3; // 適度な範囲に調整
  
  // 淡濃度の計算: 重厚度を基準に、軽快度で調整
  // 重厚度が高く、軽快度が低い = 濃醇
  const richnessRaw = flavorChart.f3 * 2 - flavorChart.f6 * 2; // より明確な差を作る
  const richness = (richnessRaw - 0) * 3; // 適度な範囲に調整
  
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

export async function searchRealSakeData(query: string): Promise<SakeData[]> {
  try {
    // さけのわAPIからデータを取得
    const [brandsResponse, breweriesResponse, flavorChartsResponse] = await Promise.all([
      fetchFromSakenowaAPI('brands'),
      fetchFromSakenowaAPI('breweries'),
      fetchFromSakenowaAPI('flavor-charts')
    ]);
    
    console.log('API Response types:', {
      brands: typeof brandsResponse,
      breweries: typeof breweriesResponse,
      flavorCharts: typeof flavorChartsResponse
    });
    
    console.log('API Response structures:', {
      brands: Array.isArray(brandsResponse) ? 'Array' : Object.keys(brandsResponse || {}),
      breweries: Array.isArray(breweriesResponse) ? 'Array' : Object.keys(breweriesResponse || {}),
      flavorCharts: Array.isArray(flavorChartsResponse) ? 'Array' : Object.keys(flavorChartsResponse || {})
    });
    
    // さけのわAPIの実際の構造に合わせて修正
    const brands = brandsResponse?.brands || [];
    const breweries = breweriesResponse?.breweries || [];
    const flavorCharts = flavorChartsResponse?.flavorCharts || [];
    
    console.log('Processed data lengths:', {
      brands: brands.length,
      breweries: breweries.length,
      flavorCharts: flavorCharts.length
    });
    
    // 検索実行
    const normalizedQuery = query.toLowerCase().trim();
    const matchingBrands = brands.filter((brand: Brand) => 
      brand.name && typeof brand.name === 'string' && brand.name.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // 最大10件
    
    console.log('Found matching brands:', matchingBrands.length);
    
    // 結果を構築
    const results: SakeData[] = [];
    
    console.log('Building results for', matchingBrands.length, 'matching brands');
    
    for (const brand of matchingBrands) {
      console.log('Processing brand:', brand.name, 'ID:', brand.id);
      
      const brewery = breweries.find((b: Brewery) => b.id === brand.breweryId);
      const flavorChart = flavorCharts.find((f: FlavorChart) => f.brandId === brand.id);
      
      console.log('Found brewery:', brewery?.name, 'Found flavorChart:', !!flavorChart);
      
      if (brewery && flavorChart) {
        const coordinates = convertFlavorToCoordinates(flavorChart);
        
        // フレーバーチャートの生値をログ出力
        console.log('FlavorChart raw values for', brand.name, ':', {
          f1: flavorChart.f1, f2: flavorChart.f2, f3: flavorChart.f3,
          f4: flavorChart.f4, f5: flavorChart.f5, f6: flavorChart.f6
        });
        
        const sakeData = {
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
        
        console.log('Created sake data:', sakeData.name, 'coordinates:', coordinates);
        results.push(sakeData);
      } else {
        console.log('Missing data for brand:', brand.name, 'brewery:', !!brewery, 'flavorChart:', !!flavorChart);
      }
    }
    
    console.log('Final results count:', results.length);
    return results;
    
  } catch (error) {
    console.error('Sakenowa API error:', error);
    throw error;
  }
}