import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  console.log('[API] /api/restaurant/menus GET: 開始');
  
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    console.log('[API] Supabaseクライアント作成完了');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API] ユーザー認証結果:', { user: user?.id, authError });
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 飲食店一覧を取得
    const { data: restaurants, error } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('user_id', user.id)
      .order('restaurant_name', { ascending: true });

    if (error) {
      console.error('[API] Supabaseクエリエラー:', error);
      throw error;
    }
    
    // 各飲食店の日本酒件数を取得
    const restaurantsWithCount = await Promise.all(
      (restaurants || []).map(async (restaurant) => {
        const { count } = await supabase
          .from('restaurant_menu_sakes')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_menu_id', restaurant.id);
        
        return {
          ...restaurant,
          sake_count: count || 0
        };
      })
    );
    
    console.log('[API] 飲食店データ取得成功:', { count: restaurantsWithCount?.length });
    const response = NextResponse.json({ restaurants: restaurantsWithCount });
    console.log('[API] レスポンス作成完了');
    return response;

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { restaurant_name, location, notes } = body;
    
    if (!restaurant_name) {
      return NextResponse.json(
        { error: 'Restaurant name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('restaurant_menus')
      .insert({
        user_id: user.id,
        restaurant_name,
        location,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Restaurant created successfully',
      restaurant: data 
    });

  } catch (error: unknown) {
    console.error('Error creating menu items:', error);
    
    // 一意制約違反エラー（重複する飲食店名）- 正常なビジネスフローとして扱う
    const dbError = error as { code?: string; message?: string };
    if (dbError?.code === '23505' && dbError?.message?.includes('restaurant_menus_user_id_restaurant_name_key')) {
      return NextResponse.json({ 
        success: true,
        conflict: true,
        message: 'この飲食店名は既に登録されています。'
      });
    }
    
    // その他のPostgreSQLエラー
    if (dbError?.code && typeof dbError.code === 'string') {
      return NextResponse.json(
        { error: 'データベースエラーが発生しました。' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUTメソッドは /api/restaurant/menus/[menu_id]/route.ts に移動しました

// DELETEメソッドは /api/restaurant/menus/[menu_id]/route.ts に移動しました