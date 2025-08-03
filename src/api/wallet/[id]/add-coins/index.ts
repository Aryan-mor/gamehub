import { supabase } from '@/lib/supabase';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return Response.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }

    // First get the current wallet
    const { data: currentWallet, error: getError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', params.id)
      .single();

    if (getError) {
      return Response.json({ error: getError.message }, { status: 404 });
    }

    // Update the wallet with new balance
    const newBalance = (currentWallet.balance || 0) + amount;
    
    const { data, error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
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