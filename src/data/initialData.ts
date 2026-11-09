import { Company, ProjectConfig, DateOption } from '../types';
import { getDatesBetween } from '../utils/dateUtils';

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectName: 'Major Shutdown PPPC ขอนแก่น',
  subTitle: 'ระบบบันทึกและสรุปผลกิจกรรม Morning Talk',
  startDate: '2026-10-16',
  endDate: '2026-10-31',
  operatingDate: '2026-10-22',
  location: 'ขอนแก่น',
};

// Default dates array (Generated dynamically, perfectly backwards-compatible)
export const SHUTDOWN_DATES: DateOption[] = getDatesBetween(
  DEFAULT_PROJECT_CONFIG.startDate,
  DEFAULT_PROJECT_CONFIG.endDate
);


export const INITIAL_INTERNAL_COMPANIES = [
  'WCE.',
  'ทรัพย์ทวีคูณ',
  'C.T.C',
  'ขันติพิมพ์พงษ์',
  'BCC',
  'ปัญจพล',
  'SPI',
  'จรูณสิงห์',
  'เคนาย',
  'KKEN',
  'JBB',
  'LIDA',
  'ATT',
  'ดารุณี',
  'SM&SPS',
  'Fluiv power',
  'กาญจนา',
  'Flowlab',
  'ฐาปกรณ์',
  'Lucky',
  'พลูโตเทค',
  'เอ็กเซลเลนท์',
  'สหการช่าง',
  'ไพร์ม เอ็นจิเนียริ่ง',
] as const;

export const INITIAL_EXTERNAL_COMPANIES = [
  'คอนโทรลโรจิก',
  'เอ็นเวอร์เทค',
  'T.A.G',
  'M.A.C.S',
  'S.R.I.C',
  'AWS.',
  'เพอมาเทคเอเซีย',
  'NPP',
  'SYNERGY',
  'ไทยโพลิเมอร์',
  'พยัคฆ์',
  'WELL',
  'ณัฐนนท์',
  'NRK',
  'TECHNICAL',
  'Q&P',
  'SUMITOMO',
  'AGON',
  'T.VAS',
  'SCG Logistics',
  'โปรเทคเทค',
] as const;

// Initial company list: All counts strictly initialized to 0!
export function getInitialCompanies(): Company[] {
  const internals: Company[] = INITIAL_INTERNAL_COMPANIES.map((name, index) => ({
    id: `in-${index + 1}`,
    name,
    type: 'internal',
    totalAttendees: 0,
    isCustom: false,
  }));

  const externals: Company[] = INITIAL_EXTERNAL_COMPANIES.map((name, index) => ({
    id: `ex-${index + 1}`,
    name,
    type: 'external',
    totalAttendees: 0,
    isCustom: false,
  }));

  return [...internals, ...externals];
}
