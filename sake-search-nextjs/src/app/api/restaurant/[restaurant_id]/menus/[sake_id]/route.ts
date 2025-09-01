import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * 飲食店メニューから特定の日本酒を削除
 * DELETE /api/restaurant/{restaurant_id}/menus/{sake_id}
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ restaurant_id: string; sake_id: string }> }
) {
  console.log('[API] DELETE /api/restaurant/[restaurant_id]/menus/[sake_id] - 開始');

  try {
    const params = await context.params;
    const { restaurant_id, sake_id } = params;
    
    console.log('[API] パラメータ:', { 
      restaurant_id, 
      sake_id 
    });

    const supabase = createRouteHandlerClient({ 
      cookies
    });

    // ユーザー認証
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API] 認証結果:', { user: user?.id, authError });
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!restaurant_id || !sake_id) {
      return NextResponse.json(
        { error: 'restaurant_id and sake_id are required' },
        { status: 400 }
      );
    }

    // 権限チェック：該当飲食店がユーザーのものか確認
    console.log('[API] 権限チェック開始');
    const { data: restaurant, error: checkError } = await supabase
      .from('restaurant_menus')
      .select('user_id')
      .eq('id', restaurant_id)
      .single();

    console.log('[API] 権限チェック結果:', { restaurant, checkError });

    if (checkError || !restaurant || restaurant.user_id !== user.id) {
      console.log('[API] 権限エラー - 403を返却');
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 403 }
      );
    }

    // sake_idとrestaurant_menu_idの組み合わせで削除
    console.log('[API] 削除実行 - restaurant_menu_id:', restaurant_id, 'sake_id:', sake_id);
    const { data: deletedData, error: deleteError } = await supabase
      .from('restaurant_menu_sakes')
      .delete()
      .eq('restaurant_menu_id', restaurant_id)
      .eq('sake_id', sake_id)
      .select();

    console.log('[API] 削除結果:', { deletedData, deleteError });

    if (deleteError) {
      console.error('[API] 削除エラー:', deleteError);
      throw deleteError;
    }

    if (!deletedData || deletedData.length === 0) {
      console.log('[API] 削除対象が見つかりませんでした');
      return NextResponse.json(
        { error: 'Menu sake not found' },
        { status: 404 }
      );
    }

    console.log('[API] 削除成功 - 削除件数:', deletedData.length);
    return NextResponse.json({ 
      message: 'Menu sake deleted successfully',
      deleted: deletedData
    });

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 特定の日本酒の詳細情報を取得
 * GET /api/restaurant/{restaurant_id}/menus/{sake_id}
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ restaurant_id: string; sake_id: string }> }
) {
  console.log('[API] GET /api/restaurant/[restaurant_id]/menus/[sake_id] - 開始');

  try {
    const params = await context.params;
    const { restaurant_id, sake_id } = params;

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

    // 特定の日本酒情報を取得
    const { data: menuSake, error } = await supabase
      .from('restaurant_menu_with_sakes')
      .select('*')
      .eq('restaurant_menu_id', restaurant_id)
      .eq('sake_id', sake_id)
      .single();

    if (error) {
      console.error('[API] 取得エラー:', error);
      throw error;
    }

    if (!menuSake) {
      return NextResponse.json(
        { error: 'Menu sake not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ menuSake });

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * メニュー内の日本酒情報を更新
 * PUT /api/restaurant/{restaurant_id}/menus/{sake_id}
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ restaurant_id: string; sake_id: string }> }
) {
  console.log('[API] PUT /api/restaurant/[restaurant_id]/menus/[sake_id] - 開始');

  try {
    const params = await context.params;
    const { restaurant_id, sake_id } = params;

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
    const { is_available, menu_notes } = body;

    // 権限チェック
    const { data: restaurant, error: checkError } = await supabase
      .from('restaurant_menus')
      .select('user_id')
      .eq('id', restaurant_id)
      .single();

    if (checkError || !restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 更新実行
    const { data, error } = await supabase
      .from('restaurant_menu_sakes')
      .update({
        is_available,
        menu_notes,
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_menu_id', restaurant_id)
      .eq('sake_id', sake_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Menu sake updated successfully',
      menuSake: data 
    });

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}