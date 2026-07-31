import { supabase } from './supabase';
import { RevenueStats, DailyRevenue, LogbookUpload, UserProfile } from '../types';

// ─── Revenue ─────────────────────────────────────────────────────────────────

export async function fetchRevenueStats(): Promise<RevenueStats> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Start of week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Start of month
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Start of year
  const yearStartStr = `${now.getFullYear()}-01-01`;

  const [daily, weekly, monthly, yearly, history] = await Promise.all([
    sumRevenue(todayStr, todayStr),
    sumRevenue(weekStartStr, todayStr),
    sumRevenue(monthStartStr, todayStr),
    sumRevenue(yearStartStr, todayStr),
    fetchDailyHistory(30),
  ]);

  return { daily, weekly, monthly, yearly, daily_history: history };
}

async function sumRevenue(from: string, to: string): Promise<number> {
  const { data, error } = await supabase
    .from('logbook_uploads')
    .select('total_amount')
    .gte('date', from)
    .lte('date', to)
    .eq('is_synced', true);

  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.total_amount || 0), 0);
}

async function fetchDailyHistory(days: number): Promise<DailyRevenue[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().split('T')[0];
  const toStr = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('logbook_uploads')
    .select('date, total_amount, total_entries')
    .gte('date', fromStr)
    .lte('date', toStr)
    .eq('is_synced', true)
    .order('date', { ascending: true });

  if (error || !data) return [];

  // Group by date
  const map = new Map<string, DailyRevenue>();
  for (const row of data) {
    const existing = map.get(row.date);
    if (existing) {
      existing.total += row.total_amount || 0;
      existing.entry_count += row.total_entries || 0;
    } else {
      map.set(row.date, {
        date: row.date,
        total: row.total_amount || 0,
        entry_count: row.total_entries || 0,
      });
    }
  }

  return Array.from(map.values());
}

// ─── Uploads ─────────────────────────────────────────────────────────────────

export async function fetchUploadHistory(limit = 20): Promise<LogbookUpload[]> {
  const { data, error } = await supabase
    .from('logbook_uploads')
    .select('*, profiles(full_name)')
    .order('date', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row: any) => ({
    ...row,
    staff_name: row.profiles?.full_name,
  }));
}

export async function fetchTodayUploads(staffId: string): Promise<LogbookUpload[]> {
  const { data, error } = await supabase
    .from('logbook_uploads')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  // Any record fetched directly from Supabase is remote & synced!
  return data.map((row) => ({
    ...row,
    is_synced: true,
  }));
}

/**
 * Paginated all-time uploads for a given staff member.
 * Pass offset=0 for first page, then increment by limit for "Load More".
 */
export async function fetchAllUploads(
  staffId: string,
  limit = 20,
  offset = 0
): Promise<LogbookUpload[]> {
  const { data, error } = await supabase
    .from('logbook_uploads')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return data.map((row) => ({ ...row, is_synced: true }));
}

/**
 * Fetch all individual entries for a specific upload (for owner tap-to-expand).
 */
export async function fetchUploadEntries(uploadId: string): Promise<import('../types').LogbookEntry[]> {
  const { data, error } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('upload_id', uploadId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data;
}

// ─── Staff Management ─────────────────────────────────────────────────────────

export async function fetchStaffList(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'staff')
    .order('full_name');

  if (error || !data) return [];
  return data;
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}
