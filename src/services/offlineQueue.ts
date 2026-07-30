import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueueItem, LogbookUpload, ParsedEntry } from '../types';
import { supabase } from './supabase';

const QUEUE_KEY = 'scanledger_offline_queue';

export async function getQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToQueue(upload: LogbookUpload, entries: ParsedEntry[]): Promise<void> {
  const queue = await getQueue();
  const item: OfflineQueueItem = {
    id: upload.id,
    upload,
    entries,
    queued_at: new Date().toISOString(),
  };
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  let synced = 0;
  let failed = 0;

  if (queue.length === 0) return { synced: 0, failed: 0 };

  // Get current user ID to ensure valid staff_id
  const { data: userRes } = await supabase.auth.getUser();
  const currentUser = userRes?.user;

  if (currentUser) {
    // Ensure profile exists in DB
    await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email || '',
      full_name: currentUser.user_metadata?.full_name || currentUser.email || 'Staff Member',
      role: 'staff',
    }, { onConflict: 'id' }).catch((e) => console.warn('Profile upsert warning in syncQueue:', e));
  }

  for (const item of queue) {
    try {
      const validStaffId = item.upload.staff_id && item.upload.staff_id.length > 5
        ? item.upload.staff_id
        : currentUser?.id || '';

      if (!validStaffId) {
        console.warn('Cannot sync queue item: no valid staff_id', item.id);
        failed++;
        continue;
      }

      // 1. Upsert upload record
      const { error: uploadError } = await supabase.from('logbook_uploads').upsert({
        id: item.upload.id,
        date: item.upload.date,
        staff_id: validStaffId,
        total_entries: item.upload.total_entries,
        total_amount: item.upload.total_amount,
        is_synced: true,
        synced_at: new Date().toISOString(),
      });

      if (uploadError) {
        console.error('Supabase logbook_uploads upsert error:', uploadError);
        throw uploadError;
      }

      // 2. Insert entries if any
      if (item.entries && item.entries.length > 0) {
        const entryRows = item.entries.map((e) => ({
          upload_id: item.upload.id,
          original_text: e.original_text || '',
          name: e.name || 'Member',
          amount: e.amount,
          is_confirmed: true,
          is_duplicate: e.is_duplicate || false,
        }));

        const { error: entriesError } = await supabase.from('logbook_entries').upsert(entryRows, { onConflict: 'id' });
        if (entriesError) {
          console.error('Supabase logbook_entries insert error:', entriesError);
          // Don't abort sync if entries insert fails, but log it
        }
      }

      await removeFromQueue(item.id);
      synced++;
    } catch (err) {
      console.error('Failed to sync queue item:', item.id, err);
      failed++;
    }
  }

  return { synced, failed };
}
