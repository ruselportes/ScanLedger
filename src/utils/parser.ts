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

/**
 * Sanitizes potential OCR digit misreadings in amount strings:
 * e.g., "1O0" -> "100", "P15O" -> "150", "S00" -> "500", "1l0" -> "110"
 */
function sanitizeAmountString(rawAmount: string): number | null {
  if (!rawAmount) return null;

  let cleaned = rawAmount
    .replace(/[₱Ppp]/gi, '') // Strip currency symbols (₱, P, p, Php)
    .replace(/hp/gi, '')
    .trim();

  // Substitute common OCR letter misreadings in numbers:
  cleaned = cleaned
    .replace(/[OoQD]/g, '0')
    .replace(/[Il|!i]/g, '1')
    .replace(/[Ss]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[Zz]/g, '2');

  const parsed = parseFloat(cleaned);
  return !isNaN(parsed) && parsed > 0 && parsed < 1000000 ? parsed : null;
}

function parseSingleLine(rawLine: string): ParsedEntry | null {
  if (!rawLine || rawLine.length < 2) return null;

  // 1. Strip leading line numbers or bullets like "1.", "1)", "#1", "* "
  let line = rawLine.replace(/^(?:\d+[\.\)]|#\d+|\*|-)\s*/, '').trim();

  if (line.length < 2) return null;

  // 2. Try matching patterns with flexible separators (=, :, -, —, p, php, space)
  // Example matches: "Maria = 100", "Maria: 120", "Maria - P150", "John 200", "Anna-80.00"
  const separatorPattern = /^(.+?)\s*[:=\-–—\s]\s*(?:₱|P|PHP|php)?\s*([0-9OoQDIl|!iSsBZz]+(?:\.[0-9OoQDIl|!iSsBZz]{1,2})?)$/i;
  const match = line.match(separatorPattern);

  if (match) {
    const rawName = match[1].replace(/[^A-Za-z\s\.'-]/g, '').trim();
    const amount = sanitizeAmountString(match[2]);

    if (rawName.length >= 2 && amount !== null) {
      return {
        original_text: rawLine,
        name: capitalizeWords(rawName),
        amount,
      };
    }
  }

  // 3. Fallback: Search for any trailing number/amount-like token at the end of the line
  const endNumberMatch = line.match(/^(.+?)\s+(?:₱|P|PHP|php)?\s*([0-9OoQDIl|!iSsBZz]+)$/i);
  if (endNumberMatch) {
    const rawName = endNumberMatch[1].replace(/[^A-Za-z\s\.'-]/g, '').trim();
    const amount = sanitizeAmountString(endNumberMatch[2]);
    if (rawName.length >= 2 && amount !== null) {
      return {
        original_text: rawLine,
        name: capitalizeWords(rawName),
        amount,
      };
    }
  }

  // 4. Name-only fallback (no amount detected on line)
  const cleanNameOnly = line.replace(/[^A-Za-z\s\.'-]/g, '').trim();
  if (cleanNameOnly.length >= 2 && /^[A-Za-z]/.test(cleanNameOnly)) {
    return {
      original_text: rawLine,
      name: capitalizeWords(cleanNameOnly),
      amount: null,
    };
  }

  return null;
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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
