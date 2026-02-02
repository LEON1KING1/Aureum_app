import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://gtqmfriduegesrqydhqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-NdU_DRwfWjVWcBPjcGXWQ_cLGaSLr9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getUser(tid) {
    const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
    return data;
}

export async function upsertUser(user) {
    await supabase.from('users').upsert(user);
}

export async function updateBalance(tid, bal) {
    await supabase.from('users').update({ balance: bal }).eq('telegram_id', tid);
}

export async function updateLastMine(tid, ts) {
    await supabase.from('users').update({ last_mine: ts }).eq('telegram_id', tid);
}

export async function getTopHolders(limit) {
    const { data } = await supabase.from('users').select('username, balance').order('balance', { ascending: false }).limit(limit);
    return data || [];
}
