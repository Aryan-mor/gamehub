import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', params.id)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('wallets')
      .update(body)
      .eq('user_id', params.id)
      .select()
      .single();

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