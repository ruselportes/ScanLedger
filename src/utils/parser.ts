import { ParsedEntry } from '../types';

/**
 * Parses a block of raw OCR text into structured logbook entries.
 * Handles formats like:
 *   "Maria - 120"
 *   "Carl 100"
 *   "John"
 *   "Anna-80"
 *   "Peter  150"
 */
export function parseOcrText(rawText: string): ParsedEntry[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const entries: ParsedEntry[] = [];

  for (const line of lines) {
    const entry = parseSingleLine(line);
    if (entry) entries.push(entry);
  }

  // Flag duplicates based on identical name + amount
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.name.toLowerCase()}|${entry.amount}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }

  return entries.map((entry) => {
    const key = `${entry.name.toLowerCase()}|${entry.amount}`;
    return { ...entry, is_duplicate: (seen.get(key) || 0) > 1 && entry.amount !== null };
  });
}

function parseSingleLine(line: string): ParsedEntry | null {
  if (!line || line.length < 2) return null;

  // Patterns:
  // "Maria - 120", "Maria-120", "Carl 100", "Anna  80"
  const patterns = [
    // Name - Amount (with or without spaces)
    /^([A-Za-z][A-Za-z\s\.'-]{0,30}?)\s*[-–—]\s*(\d+(?:\.\d{1,2})?)$/,
    // Name Amount (space separated, number at end)
    /^([A-Za-z][A-Za-z\s\.'-]{0,30}?)\s+(\d+(?:\.\d{1,2})?)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const name = match[1].trim();
      const amount = parseFloat(match[2]);
      if (!isNaN(amount) && amount > 0) {
        return { original_text: line, name, amount };
      }
    }
  }

  // No amount found — name-only entry
  const nameOnly = /^([A-Za-z][A-Za-z\s\.'-]{0,40})$/.test(line);
  if (nameOnly) {
    return { original_text: line, name: line.trim(), amount: null };
  }

  return null;
}

export function calculateTotal(entries: ParsedEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
