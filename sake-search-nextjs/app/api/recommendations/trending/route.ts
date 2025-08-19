import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TestSakeDataService } from '@/services/testSakeDataService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 認証は任意（トレンドは誰でも見られる）
    await supabase.auth.getUser();
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    
    const sakeDataService = TestSakeDataService.getInstance();
    
    let result;
    if (category) {
      // カテゴリ別の人気日本酒
      const popularByCategory = await sakeDataService.getPopularByCategory();
      result = {
        category,
        sakes: popularByCategory[category as keyof typeof popularByCategory] || []
      };
    } else {
      // 全体のトレンド
      const trendingSakes = await sakeDataService.getTrendingSakes(limit);
      result = {
        trending: trendingSakes,
        timestamp: new Date().toISOString()
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching trending sakes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}