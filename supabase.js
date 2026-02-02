```javascript
// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://gtqmfriduegesrqydhqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-NdU_DRwfWjVWcBPjcGXWQ_cLGaSLr9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function upsertUser(user) {
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'telegram_id' });

  if (error) throw error;
  return data;
}

export async function getUser(telegram_id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateBalance(telegram_id, newBalance) {
  const { data, error } = await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('telegram_id', telegram_id);

  if (error) throw error;
  return data;
}

export async function updateLastMine(telegram_id, timestamp) {
  const { data, error } = await supabase
    .from('users')
    .update({ last_mine: timestamp })
    .eq('telegram_id', telegram_id);

  if (error) throw error;
  return data;
}
// أضف هذه الدالة للملف الموجود لديك
export async function getTopHolders(limit = 10) {
  const { data, error } = await supabase
    .from('users')
    .select('username, balance')
    .order('balance', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

```
