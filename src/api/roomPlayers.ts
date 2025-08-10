import { supabase } from '@/lib/supabase';

export async function add(room_id: string, user_id: string, ready = false) {
  const { error } = await supabase
    .from('room_players')
    .upsert({ room_id, user_id, ready, joined_at: new Date().toISOString() });
  if (error) throw error;
}

export async function remove(room_id: string, user_id: string) {
  const { error } = await supabase
    .from('room_players')
    .delete()
    .eq('room_id', room_id)
    .eq('user_id', user_id);
  if (error) throw error;
}

export async function setReady(room_id: string, user_id: string, ready: boolean) {
  const { error } = await supabase
    .from('room_players')
    .update({ ready })
    .eq('room_id', room_id)
    .eq('user_id', user_id);
  if (error) throw error;
}

export async function listByRoom(room_id: string): Promise<Array<{ user_id: string; ready: boolean }>> {
  const { data, error } = await supabase
    .from('room_players')
    .select('user_id, ready')
    .eq('room_id', room_id);
  if (error) throw error;
  return data || [];
}

export async function listActiveRoomsByUser(user_id: string): Promise<Array<{ room_id: string }>> {
  const { data, error } = await supabase
    .from('room_players')
    .select('room_id')
    .eq('user_id', user_id);
  if (error) throw error;
  return data || [];
}


