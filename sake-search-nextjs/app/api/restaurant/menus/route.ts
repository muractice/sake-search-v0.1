import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');
    const withSakes = searchParams.get('with_sakes') === 'true';

    if (withSakes && restaurantId) {
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
    } else {
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
    }

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
    const { type } = body;

    if (type === 'restaurant') {
      // 飲食店を追加
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

    } else if (type === 'sakes') {
      // 日本酒をメニューに一括追加
      const { restaurant_menu_id, sakes } = body;

      if (!restaurant_menu_id || !Array.isArray(sakes)) {
        return NextResponse.json(
          { error: 'Restaurant menu ID and sakes array are required' },
          { status: 400 }
        );
      }

      const sakesWithRestaurantId = sakes.map(sake => ({
        restaurant_menu_id,
        sake_id: sake.sake_id,
        brand_id: sake.brand_id || null,
        is_available: sake.is_available !== false,
        menu_notes: sake.menu_notes || null
      }));

      const { data, error } = await supabase
        .from('restaurant_menu_sakes')
        .insert(sakesWithRestaurantId)
        .select();

      if (error) throw error;

      return NextResponse.json({ 
        message: 'Sakes added to menu successfully',
        menuSakes: data 
      });
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    );

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
    const { type } = body;

    if (type === 'restaurant') {
      // 飲食店情報を更新
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

    } else if (type === 'menu_sake') {
      // メニュー内の日本酒情報を更新
      const { id, is_available, menu_notes } = body;

      if (!id) {
        return NextResponse.json(
          { error: 'Menu sake ID is required' },
          { status: 400 }
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
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );

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
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    if (type === 'restaurant') {
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

    } else if (type === 'menu_sake') {
      // メニューから日本酒を削除
      const { error } = await supabase
        .from('restaurant_menu_sakes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return NextResponse.json({ 
        message: 'Menu sake deleted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid delete type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error deleting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}