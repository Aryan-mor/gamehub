import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';
    const gameType = searchParams.get('game_type');
    const status = searchParams.get('status');
    const roomId = searchParams.get('room_id');

    let query = supabase
      .from('games')
      .select('*')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    if (gameType) {
      query = query.eq('game_type', gameType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('games')
      .insert(body)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 