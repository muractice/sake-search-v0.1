import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * 特定飲食店のメニュー日本酒リストを取得
 */
export async function GET(request: NextRequest) {
  console.log('[API] /api/restaurant/menus/list GET: 開始');
  
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

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurant_id is required' },
        { status: 400 }
      );
    }

    console.log('[API] 飲食店詳細取得開始 - restaurantId:', restaurantId);
    
    // 特定の飲食店のメニューと日本酒情報を取得
    const { data: menuWithSakes, error } = await supabase
      .from('restaurant_menu_with_sakes')
      .select('*')
      .eq('restaurant_menu_id', restaurantId);

    if (error) {
      console.error('[API] 飲食店詳細取得エラー:', error);
      throw error;
    }
    
    console.log('[API] 飲食店詳細データ取得成功:', { 
      count: menuWithSakes?.length,
      sampleData: menuWithSakes?.[0]
    });
    
    return NextResponse.json({ menuWithSakes });

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 飲食店メニューに日本酒を追加
 */
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/restaurant/menus/list - 開始');
  
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API] 認証結果:', { user: user?.id, authError });
    
    if (!user || authError) {
      console.log('[API] 認証エラー - 401を返却');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[API] リクエストボディ:', JSON.stringify(body, null, 2));
    
    const { restaurant_menu_id, sakes, upsert, toDelete, diffMode } = body;
    console.log('[API] パース結果:', { restaurant_menu_id, sakes, upsert, toDelete, diffMode });

    if (!restaurant_menu_id || !Array.isArray(sakes)) {
      console.log('[API] バリデーションエラー - 400を返却:', { restaurant_menu_id, isArray: Array.isArray(sakes) });
      return NextResponse.json(
        { error: 'restaurant_menu_id and sakes array are required' },
        { status: 400 }
      );
    }

    // 権限チェック：該当飲食店がユーザーのものか確認
    console.log('[API] 権限チェック開始 - restaurant_menu_id:', restaurant_menu_id);
    const { data: restaurant, error: checkError } = await supabase
      .from('restaurant_menus')
      .select('user_id')
      .eq('id', restaurant_menu_id)
      .single();

    console.log('[API] 権限チェック結果:', { restaurant, checkError });

    if (checkError || !restaurant || restaurant.user_id !== user.id) {
      console.log('[API] 権限エラー - 403を返却:', { checkError, restaurant, userId: user.id });
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 403 }
      );
    }

    const sakesWithRestaurantId = sakes.map(sake => ({
      restaurant_menu_id,
      sake_id: sake.sake_id,
      brand_id: sake.brand_id || null,
      is_available: sake.is_available !== false,
      menu_notes: sake.menu_notes || null
    }));
    console.log('[API] Supabaseに挿入するデータ:', JSON.stringify(sakesWithRestaurantId, null, 2));

    let data, error;

    if (diffMode && toDelete && toDelete.length > 0) {
      console.log('[API] 差分モード: 削除処理を実行');
      // まず削除対象を削除
      const { error: deleteError } = await supabase
        .from('restaurant_menu_sakes')
        .delete()
        .eq('restaurant_menu_id', restaurant_menu_id)
        .in('sake_id', toDelete);
      
      if (deleteError) {
        console.error('[API] 削除エラー:', deleteError);
        throw deleteError;
      }
      console.log('[API] 削除完了:', toDelete);
    }

    if (sakes.length > 0) {
      if (upsert || diffMode) {
        console.log('[API] UPSERTモードで実行');
        // UPSERTの場合：ON CONFLICT DO UPDATEで重複を回避
        const { data: upsertData, error: upsertError } = await supabase
          .from('restaurant_menu_sakes')
          .upsert(sakesWithRestaurantId, {
            onConflict: 'restaurant_menu_id,sake_id'
          })
          .select();
        data = upsertData;
        error = upsertError;
      } else {
        console.log('[API] 通常INSERTモードで実行');
        // 通常の場合：INSERT（後方互換性）
        const { data: insertData, error: insertError } = await supabase
          .from('restaurant_menu_sakes')
          .insert(sakesWithRestaurantId)
          .select();
        data = insertData;
        error = insertError;
      }
    } else {
      // 全削除の場合
      data = [];
      error = null;
    }

    console.log('[API] Supabase挿入結果:', { data, error });

    if (error) {
      console.log('[API] Supabaseエラー - throwします:', error);
      throw error;
    }

    const result = { 
      message: 'Sakes added to menu successfully',
      menuSakes: data 
    };
    console.log('[API] レスポンス:', JSON.stringify(result, null, 2));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error adding sakes to menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * メニュー内の日本酒情報を更新
 */
export async function PUT(request: NextRequest) {
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
    const { id, is_available, menu_notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Menu sake ID is required' },
        { status: 400 }
      );
    }

    // 権限チェック：該当メニュー日本酒がユーザーの飲食店のものか確認
    const { data: menuSake, error: checkError } = await supabase
      .from('restaurant_menu_sakes')
      .select('restaurant_menu_id')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_menus')
      .select('user_id')
      .eq('id', menuSake.restaurant_menu_id)
      .single();

    if (restaurantError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .update({
        is_available,
        menu_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Menu sake updated successfully',
      menuSake: data 
    });

  } catch (error) {
    console.error('Error updating menu sake:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * メニューから日本酒を削除
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Menu sake ID is required' },
        { status: 400 }
      );
    }

    // 権限チェック：該当メニュー日本酒がユーザーの飲食店のものか確認
    const { data: menuSake, error: checkError } = await supabase
      .from('restaurant_menu_sakes')
      .select('restaurant_menu_id')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_menus')
      .select('user_id')
      .eq('id', menuSake.restaurant_menu_id)
      .single();

    if (restaurantError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('restaurant_menu_sakes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Menu sake deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting menu sake:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}