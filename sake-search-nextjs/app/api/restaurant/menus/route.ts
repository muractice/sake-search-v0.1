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

  } catch (error) {
    console.error('Error creating menu items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { id, restaurant_name, location, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('restaurant_menus')
      .update({
        restaurant_name,
        location,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Restaurant updated successfully',
      restaurant: data 
    });

  } catch (error) {
    console.error('Error updating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // 飲食店を削除（カスケードで関連データも削除される）
    const { error } = await supabase
      .from('restaurant_menus')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}