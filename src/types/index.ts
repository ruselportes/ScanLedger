export type UserRole = 'staff' | 'owner';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  device_id?: string;
  is_active?: boolean;
  created_at: string;
}

export interface LogbookEntry {
  id: string;
  upload_id: string;
  original_text: string;
  name: string;
  amount: number | null;
  is_confirmed: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export interface LogbookUpload {
  id: string;
  date: string;
  staff_id: string;
  staff_name?: string;
  image_url?: string;
  total_entries: number;
  total_amount: number;
  is_synced: boolean;
  synced_at?: string;
  created_at: string;
  entries?: LogbookEntry[];
}

export interface DailyRevenue {
  date: string;
  total: number;
  entry_count: number;
}

export interface RevenueStats {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  daily_history: DailyRevenue[];
}

export interface ParsedEntry {
  original_text: string;
  name: string;
  amount: number | null;
  is_duplicate?: boolean;
}

export interface OfflineQueueItem {
  id: string;
  upload: LogbookUpload;
  entries: ParsedEntry[];
  queued_at: string;
}

export interface Device {
  id: string;
  device_name: string;
  owner_id: string;
  is_active: boolean;
  registered_at: string;
}
