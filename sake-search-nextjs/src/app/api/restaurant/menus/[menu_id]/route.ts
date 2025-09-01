import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * 飲食店メニューを更新
 * PUT /api/restaurant/menus/{menu_id}
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ menu_id: string }> }
) {
  console.log('[API] PUT /api/restaurant/menus/[menu_id] - 開始');

  try {
    const params = await context.params;
    const { menu_id } = params;
    console.log('[API] パラメータ:', { menu_id });

    const supabase = createRouteHandlerClient({ 
      cookies
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API] 認証結果:', { user: user?.id, authError });
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { restaurant_name, location, notes } = body;

    if (!menu_id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] 更新データ:', { restaurant_name, location, notes });

    const { data, error } = await supabase
      .from('restaurant_menus')
      .update({
        restaurant_name,
        location,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', menu_id)
      .eq('user_id', user.id)
      .select()
      .single();

    console.log('[API] 更新結果:', { data, error });

    if (error) {
      console.error('[API] 更新エラー:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Restaurant menu updated successfully',
      restaurant: data 
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
 * 飲食店メニューを削除
 * DELETE /api/restaurant/menus/{menu_id}
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ menu_id: string }> }
) {
  console.log('[API] DELETE /api/restaurant/menus/[menu_id] - 開始');

  try {
    const params = await context.params;
    const { menu_id } = params;
    console.log('[API] パラメータ:', { menu_id });
    const supabase = createRouteHandlerClient({ 
      cookies
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[API] 認証結果:', { user: user?.id, authError });
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!menu_id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    console.log('[API] 削除実行 - menu_id:', menu_id);

    // 飲食店メニューを削除（カスケードで関連データも削除される）
    const { error } = await supabase
      .from('restaurant_menus')
      .delete()
      .eq('id', menu_id)
      .eq('user_id', user.id);

    console.log('[API] 削除結果:', { error });

    if (error) {
      console.error('[API] 削除エラー:', error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Restaurant menu deleted successfully'
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
 * 飲食店メニューの詳細を取得
 * GET /api/restaurant/menus/{menu_id}
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ menu_id: string }> }
) {
  console.log('[API] GET /api/restaurant/menus/[menu_id] - 開始');

  try {
    const params = await context.params;
    const { menu_id } = params;
    console.log('[API] パラメータ:', { menu_id });
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

    if (!menu_id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    // 飲食店メニューの詳細を取得
    const { data: menu, error } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('id', menu_id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[API] 取得エラー:', error);
      throw error;
    }

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // 日本酒件数を取得
    const { count } = await supabase
      .from('restaurant_menu_sakes')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_menu_id', menu_id);

    return NextResponse.json({ 
      restaurant: {
        ...menu,
        sake_count: count || 0
      }
    });

  } catch (error) {
    console.error('[API] エラーキャッチ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}