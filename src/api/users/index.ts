import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

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
      .from('users')
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