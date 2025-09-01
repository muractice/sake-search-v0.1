import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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
    const restaurantName = searchParams.get('restaurant');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('restaurant_drinking_records_detail')
      .select('*')
      .eq('user_id', user.id);

    if (restaurantName) {
      query = query.eq('restaurant_name', restaurantName);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: records, error } = await query
      .order('date', { ascending: false })
      .order('record_created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ records });

  } catch (error) {
    console.error('Error fetching restaurant records:', error);
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
    const recordData = {
      ...body,
      user_id: user.id
    };

    // 必須フィールドの検証
    const requiredFields = ['sake_id', 'sake_name', 'restaurant_name', 'rating'];
    for (const field of requiredFields) {
      if (!recordData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('restaurant_drinking_records')
      .insert(recordData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Restaurant record created successfully',
      record: data 
    });

  } catch (error) {
    console.error('Error creating restaurant record:', error);
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('restaurant_drinking_records')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Restaurant record updated successfully',
      record: data 
    });

  } catch (error) {
    console.error('Error updating restaurant record:', error);
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
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('restaurant_drinking_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      message: 'Restaurant record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}