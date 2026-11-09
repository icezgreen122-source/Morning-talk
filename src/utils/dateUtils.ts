// Universal Date Helpers for PPPC Safety Morning Talk
// Supports arbitrary project date ranges, cross-month, cross-year, and historical data

import { DateOption } from '../types';

export const THAI_MONTH_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
] as const;

export const THAI_MONTH_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

export const THAI_DAYS = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
] as const;

export interface ParsedDate {
  year: number; // Common Era (CE) e.g. 2026, 2027
  month: number; // 1 - 12
  day: number; // 1 - 31
}

/**
 * Universal date parser that understands ISO (YYYY-MM-DD), Thai strings, and numbers
 */
export function parseDate(dateInput: string | number | undefined | null): ParsedDate | null {
  if (dateInput === undefined || dateInput === null) return null;
  const str = String(dateInput).trim();
  if (!str) return null;

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    // Buddhist era year protection (> 2400)
    if (year > 2400) year -= 543;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }

  // 2. Thai text parsing (e.g. "16 ต.ค. 2026", "22 ตุลาคม 2569", "16 ต.ค.")
  let parsedDay: number | null = null;
  let parsedMonth: number | null = null;
  let parsedYear: number | null = null;

  // Find month from Thai short or full
  for (let m = 0; m < 12; m++) {
    if (str.includes(THAI_MONTH_FULL[m]) || str.includes(THAI_MONTH_SHORT[m])) {
      parsedMonth = m + 1;
      break;
    }
  }

  // Extract day and optional year numbers
  const numberTokens = str.match(/\d+/g);
  if (numberTokens && numberTokens.length > 0) {
    parsedDay = parseInt(numberTokens[0], 10);
    if (numberTokens.length > 1) {
      let y = parseInt(numberTokens[1], 10);
      if (y > 2400) y -= 543;
      parsedYear = y;
    }
  }

  if (parsedDay && parsedDay >= 1 && parsedDay <= 31) {
    const finalMonth = parsedMonth || 10;
    const finalYear = parsedYear || 2026;
    return {
      year: finalYear,
      month: finalMonth,
      day: parsedDay,
    };
  }

  return null;
}

export function extractDay(dateStr: string | number | undefined | null): number | null {
  const parsed = parseDate(dateStr);
  return parsed ? parsed.day : null;
}

/**
 * Standardize any date format to canonical ISO YYYY-MM-DD string
 */
export function toCanonicalDate(dateStr: string | undefined | null, fallback = '2026-10-22'): string {
  if (!dateStr) return fallback;
  const str = String(dateStr).trim();
  // Fast path for standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = parseDate(str);
  if (parsed) {
    const y = parsed.year.toString().padStart(4, '0');
    const m = parsed.month.toString().padStart(2, '0');
    const d = parsed.day.toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str || fallback;
}

/**
 * Compare whether two date representations refer to the exact same calendar day
 */
export function isSameDate(dateA: string | undefined | null, dateB: string | undefined | null): boolean {
  if (!dateA || !dateB) return false;
  if (dateA === dateB) return true;
  return toCanonicalDate(dateA) === toCanonicalDate(dateB);
}

/**
 * Format to Thai short date e.g. "16 ต.ค." or "5 พ.ย."
 */
export function toThaiDateShort(dateStr: string | undefined | null): string {
  const parsed = parseDate(dateStr) || { year: 2026, month: 10, day: 22 };
  const monthName = THAI_MONTH_SHORT[parsed.month - 1] || 'ต.ค.';
  return `${parsed.day} ${monthName}`;
}

/**
 * Format to Thai full label with day of the week e.g. "16 ต.ค. 2026 (วันศุกร์)"
 */
export function toThaiDateLabel(dateStr: string | undefined | null): string {
  const parsed = parseDate(dateStr) || { year: 2026, month: 10, day: 22 };
  const monthName = THAI_MONTH_SHORT[parsed.month - 1] || 'ต.ค.';
  const d = new Date(parsed.year, parsed.month - 1, parsed.day);
  const dayOfWeek = THAI_DAYS[d.getDay()] || '';
  return `${parsed.day} ${monthName} ${parsed.year}${dayOfWeek ? ` (${dayOfWeek})` : ''}`;
}

/**
 * Format to Thai full date e.g. "16 ตุลาคม 2026"
 */
export function toThaiDateFull(dateStr: string | undefined | null): string {
  const parsed = parseDate(dateStr) || { year: 2026, month: 10, day: 22 };
  const monthName = THAI_MONTH_FULL[parsed.month - 1] || 'ตุลาคม';
  return `${parsed.day} ${monthName} ${parsed.year}`;
}

/**
 * Format to Thai Buddhist Era date e.g. "16 ตุลาคม 2569"
 */
export function toThaiDateBuddhist(dateStr: string | undefined | null): string {
  const parsed = parseDate(dateStr) || { year: 2026, month: 10, day: 22 };
  const monthName = THAI_MONTH_FULL[parsed.month - 1] || 'ตุลาคม';
  const buddhistYear = parsed.year + 543;
  return `${parsed.day} ${monthName} ${buddhistYear}`;
}

/**
 * Format project duration in Thai Buddhist Era e.g. "16 – 31 ตุลาคม 2569"
 */
export function formatProjectPeriod(startDate: string, endDate: string): string {
  const s = parseDate(startDate) || { year: 2026, month: 10, day: 16 };
  const e = parseDate(endDate) || { year: 2026, month: 10, day: 31 };

  const sYearBE = s.year + 543;
  const eYearBE = e.year + 543;

  if (s.year === e.year && s.month === e.month) {
    return `${s.day} – ${e.day} ${THAI_MONTH_FULL[s.month - 1]} ${sYearBE}`;
  }

  if (s.year === e.year) {
    return `${s.day} ${THAI_MONTH_SHORT[s.month - 1]} – ${e.day} ${THAI_MONTH_SHORT[e.month - 1]} ${sYearBE}`;
  }

  return `${s.day} ${THAI_MONTH_SHORT[s.month - 1]} ${sYearBE} – ${e.day} ${THAI_MONTH_SHORT[e.month - 1]} ${eYearBE}`;
}

/**
 * Dynamically generate array of dates between startDate and endDate
 * Also incorporates any historical dates with recorded data so users can access them
 */
export function getDatesBetween(
  startDate: string,
  endDate: string,
  additionalDates: string[] = []
): DateOption[] {
  const startCanon = toCanonicalDate(startDate, '2026-10-16');
  const endCanon = toCanonicalDate(endDate, '2026-10-31');

  const sParsed = parseDate(startCanon) || { year: 2026, month: 10, day: 16 };
  const eParsed = parseDate(endCanon) || { year: 2026, month: 10, day: 31 };

  let current = new Date(sParsed.year, sParsed.month - 1, sParsed.day);
  const end = new Date(eParsed.year, eParsed.month - 1, eParsed.day);

  // If start is after end, swap them
  if (current > end) {
    current = new Date(eParsed.year, eParsed.month - 1, eParsed.day);
  }

  const dateMap = new Map<string, DateOption>();

  // Maximum loop guard (e.g. 365 days max for a single project range)
  let loopCount = 0;
  while (current <= end && loopCount < 366) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;

    const dayIdx = current.getDay();
    const shortLabel = `${current.getDate()} ${THAI_MONTH_SHORT[current.getMonth()]}`;
    const fullLabel = `${shortLabel} ${y} (${THAI_DAYS[dayIdx]})`;

    dateMap.set(iso, {
      value: iso,
      label: fullLabel,
      short: shortLabel,
      dayOfWeek: THAI_DAYS[dayIdx],
      isWithinProject: true,
    });

    current.setDate(current.getDate() + 1);
    loopCount++;
  }

  // Incorporate additional dates (e.g. historical records from database)
  additionalDates.forEach((raw) => {
    const canon = toCanonicalDate(raw);
    if (!dateMap.has(canon)) {
      const p = parseDate(canon);
      if (p) {
        const dt = new Date(p.year, p.month - 1, p.day);
        const dayIdx = dt.getDay();
        const shortLabel = `${p.day} ${THAI_MONTH_SHORT[p.month - 1]}`;
        const fullLabel = `${shortLabel} ${p.year} (${THAI_DAYS[dayIdx]}) [นอกช่วงโครงการ]`;
        dateMap.set(canon, {
          value: canon,
          label: fullLabel,
          short: shortLabel,
          dayOfWeek: THAI_DAYS[dayIdx],
          isWithinProject: false,
        });
      }
    }
  });

  return Array.from(dateMap.values()).sort((a, b) => a.value.localeCompare(b.value));
}
