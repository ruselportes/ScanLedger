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

  for (const item of queue) {
    try {
      // Insert upload record
      const { error: uploadError } = await supabase.from('logbook_uploads').upsert({
        id: item.upload.id,
        date: item.upload.date,
        staff_id: item.upload.staff_id,
        total_entries: item.upload.total_entries,
        total_amount: item.upload.total_amount,
        is_synced: true,
        synced_at: new Date().toISOString(),
      });

      if (uploadError) throw uploadError;

      // Insert entries
      const entryRows = item.entries.map((e) => ({
        upload_id: item.upload.id,
        original_text: e.original_text,
        name: e.name,
        amount: e.amount,
        is_confirmed: true,
        is_duplicate: e.is_duplicate || false,
      }));

      const { error: entriesError } = await supabase.from('logbook_entries').insert(entryRows);
      if (entriesError) throw entriesError;

      await removeFromQueue(item.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
