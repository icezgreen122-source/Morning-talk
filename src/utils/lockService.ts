import { AttendanceRecord } from '../types';
import { toCanonicalDate } from './dateUtils';

export const ADMIN_DEFAULT_PINS = ['1234', '9999', '0000', 'admin', 'pppc'];

// Get current system date in YYYY-MM-DD
export function getSystemTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a specific date is locked
 * @param dateStr Target date (canonical YYYY-MM-DD or short Thai)
 * @param lockedDates List of explicitly locked dates
 * @param unlockedDates List of explicit admin unlock overrides
 * @param currentDate Active operating date (e.g. today or active selected date)
 */
export function isDateLocked(
  dateStr: string | undefined | null,
  lockedDates: string[] = [],
  unlockedDates: string[] = [],
  currentDate?: string
): boolean {
  if (!dateStr) return false;
  const canon = toCanonicalDate(dateStr);

  // 1. If explicitly unlocked by Admin override, it is NOT locked
  if (unlockedDates.includes(canon)) {
    return false;
  }

  // 2. If explicitly locked by Admin or previous lock action, it IS locked
  if (lockedDates.includes(canon)) {
    return true;
  }

  // 3. Automatic Daily Lock:
  // If the record's date is strictly before the active operating date / today,
  // it is automatically locked once the day has passed.
  const referenceDate = currentDate || getSystemTodayDate();
  if (canon < referenceDate) {
    return true;
  }

  return false;
}

/**
 * Check if an attendance record is locked
 */
export function isRecordLocked(
  record: AttendanceRecord,
  lockedDates: string[] = [],
  unlockedDates: string[] = [],
  currentDate?: string
): boolean {
  return isDateLocked(record.date, lockedDates, unlockedDates, currentDate);
}

/**
 * Verify Admin PIN
 */
export function verifyAdminPin(pin: string): boolean {
  const trimmed = pin.trim().toLowerCase();
  return ADMIN_DEFAULT_PINS.includes(trimmed);
}
