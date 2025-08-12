import { supabase } from '@/lib/supabase';

export async function add(room_id: string, user_id: string, ready = false) {
  const { error } = await supabase
    .from('room_players')
    .upsert({ room_id, user_id, is_ready: ready, joined_at: new Date().toISOString() }, { onConflict: 'room_id,user_id' });
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
    .update({ is_ready: ready })
    .eq('room_id', room_id)
    .eq('user_id', user_id);
  if (error) throw error;
}

export async function listByRoom(room_id: string): Promise<Array<{ user_id: string; ready: boolean }>> {
  const { data, error } = await supabase
    .from('room_players')
    .select('user_id, is_ready')
    .eq('room_id', room_id);
  if (error) throw error;
  return (data || []).map((row: { user_id: string; is_ready?: boolean }) => ({ user_id: row.user_id, ready: !!row.is_ready }));
}

export async function listActiveRoomsByUser(user_id: string): Promise<Array<{ room_id: string }>> {
  const { data, error } = await supabase
    .from('room_players')
    .select('room_id')
    .eq('user_id', user_id);
  if (error) throw error;
  return data || [];
}

// Only rooms that are not finished/cancelled. Assumes FK room_players.room_id → rooms.id exists.
export async function listOpenRoomsByUser(
  user_id: string
): Promise<Array<{ room_id: string; status: string; joined_at: string }>> {
  const { data, error } = await supabase
    .from('room_players')
    .select('room_id, joined_at, rooms:rooms(status)')
    .eq('user_id', user_id)
    // Filter by room status on the joined rooms table
    .filter('rooms.status', 'in', '("waiting","playing")')
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: { room_id: string; joined_at: string; rooms?: { status?: string } | { status?: string }[] }) => {
    const rooms = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
    return {
      room_id: row.room_id,
      status: rooms?.status || 'unknown',
      joined_at: row.joined_at,
    };
  });
}


