import { NextRequest, NextResponse } from 'next/server';
import { searchMockSakeData } from '@/lib/mockData';
import { searchRealSakeData } from '@/lib/sakenowaApi';
import { SearchResponse } from '@/types/sake';

const USE_REAL_API = process.env.USE_SAKENOWA_API === 'true';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    console.log('=== API Search Debug ===');
    console.log('Environment variable USE_SAKENOWA_API:', process.env.USE_SAKENOWA_API);
    console.log('USE_REAL_API flag:', USE_REAL_API);
    console.log('Search query:', query);
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        results: [],
        error: 'Query parameter is required'
      } as SearchResponse);
    }
    
    let results;
    
    if (USE_REAL_API) {
      console.log('Attempting to use Sakenowa API...');
      try {
        // さけのわAPIで検索
        results = await searchRealSakeData(query);
        console.log('Sakenowa API success, found', results.length, 'results');
      } catch (error) {
        console.error('Sakenowa API failed, falling back to mock data:', error);
        // フォールバック: モックデータを使用
        results = searchMockSakeData(query);
        console.log('Using fallback mock data, found', results.length, 'results');
      }
    } else {
      console.log('Using mock data (API disabled)');
      // モックデータで検索
      results = searchMockSakeData(query);
      console.log('Mock data search complete, found', results.length, 'results');
    }
    
    return NextResponse.json({
      success: true,
      results,
    } as SearchResponse);
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      success: false,
      results: [],
      error: 'Internal server error'
    } as SearchResponse, { status: 500 });
  }
}

// 将来的にSakenowa APIを統合する場合のコード例
/*
async function fetchFromSakenowaAPI(endpoint: string) {
  const response = await fetch(`https://muro.sakenowa.com/sakenowa-data/api/${endpoint}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

async function searchRealSakeData(query: string): Promise<SakeData[]> {
  try {
    const [brands, breweries, flavorCharts] = await Promise.all([
      fetchFromSakenowaAPI('brands'),
      fetchFromSakenowaAPI('breweries'),
      fetchFromSakenowaAPI('flavor-charts')
    ]);
    
    // 検索・変換ロジックをここに実装
    // ...
    
    return results;
  } catch (error) {
    console.error('Sakenowa API error:', error);
    // フォールバックとしてモックデータを使用
    return searchMockSakeData(query);
  }
}
*/