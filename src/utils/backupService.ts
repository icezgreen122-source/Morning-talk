import * as XLSX from 'xlsx';
import { Company, AttendanceRecord, CompanyType } from '../types';
import { toCanonicalDate, toThaiDateBuddhist, toThaiDateShort } from './dateUtils';

export interface BackupOptions {
  rangeStartDate?: string;
  rangeEndDate?: string;
  isAll?: boolean;
}

// Generate today's date string for filename
export function getBackupDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Filter records based on options
export function filterRecordsForBackup(
  records: AttendanceRecord[],
  options?: BackupOptions
): AttendanceRecord[] {
  if (!options || options.isAll) {
    return records;
  }
  const start = options.rangeStartDate || '2026-10-16';
  const end = options.rangeEndDate || '2026-10-31';
  return records.filter((r) => {
    const canon = toCanonicalDate(r.date);
    return canon >= start && canon <= end;
  });
}

// Prepare tabular rows with Thai headers
export function formatRecordsForExport(records: AttendanceRecord[]) {
  // Sort descending by date, then company name
  const sorted = [...records].sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : a.companyName.localeCompare(b.companyName);
  });

  return sorted.map((r, index) => {
    const isInternal = r.companyType === 'internal';
    const canonDate = toCanonicalDate(r.date);
    return {
      'ลำดับ': index + 1,
      'วันที่': canonDate,
      'วันที่ (พ.ศ.)': toThaiDateBuddhist(canonDate),
      'ชื่อบริษัท/หจก.': r.companyName,
      'ประเภทคู่ธุรกิจ': isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่',
      'จำนวนคน (คน)': Number(r.attendees) || 0,
      'เวลาบันทึก': r.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '-',
      'ผู้บันทึก': r.supervisorName || 'จป.วิชาชีพ PPPC',
      'หัวข้อความปลอดภัย': r.safetyTopic || '-',
      'เป้าหมายคน': r.targetWorkers ?? '-',
      'หมายเหตุ': r.notes || '-',
    };
  });
}

// ---------------------------------------------------------
// 1. Export Excel (.xlsx) using SheetJS
// ---------------------------------------------------------
export function exportBackupExcel(
  records: AttendanceRecord[],
  options?: BackupOptions
): { filename: string; count: number } {
  const filtered = filterRecordsForBackup(records, options);
  const rows = formatRecordsForExport(filtered);
  const dateStr = getBackupDateString();
  const filename = `SCGP_MorningTalk_Backup_${dateStr}.xlsx`;

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability in Microsoft Excel
  worksheet['!cols'] = [
    { wch: 8 },  // ลำดับ
    { wch: 14 }, // วันที่
    { wch: 22 }, // วันที่ พ.ศ.
    { wch: 32 }, // ชื่อบริษัท
    { wch: 18 }, // ประเภทคู่ธุรกิจ
    { wch: 16 }, // จำนวนคน
    { wch: 24 }, // เวลาบันทึก
    { wch: 20 }, // ผู้บันทึก
    { wch: 32 }, // หัวข้อความปลอดภัย
    { wch: 14 }, // เป้าหมายคน
    { wch: 28 }, // หมายเหตุ
  ];

  // Create workbook and write
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'MorningTalk_Backup');

  // Trigger download in browser
  XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });

  return { filename, count: filtered.length };
}

// ---------------------------------------------------------
// 2. Export CSV (.csv) with UTF-8 BOM for Microsoft Excel
// ---------------------------------------------------------
export function exportBackupCSV(
  records: AttendanceRecord[],
  options?: BackupOptions
): { filename: string; count: number } {
  const filtered = filterRecordsForBackup(records, options);
  const rows = formatRecordsForExport(filtered);
  const dateStr = getBackupDateString();
  const filename = `SCGP_MorningTalk_Backup_${dateStr}.csv`;

  if (rows.length === 0) {
    // Empty header row
    const headers = [
      'ลำดับ',
      'วันที่',
      'วันที่ (พ.ศ.)',
      'ชื่อบริษัท/หจก.',
      'ประเภทคู่ธุรกิจ',
      'จำนวนคน (คน)',
      'เวลาบันทึก',
      'ผู้บันทึก',
      'หัวข้อความปลอดภัย',
      'เป้าหมายคน',
      'หมายเหตุ',
    ];
    const csvContent = '\uFEFF' + headers.join(',') + '\n';
    triggerBlobDownload(csvContent, filename, 'text/csv;charset=utf-8;');
    return { filename, count: 0 };
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  rows.forEach((row: any) => {
    const line = headers.map((header) => {
      let val = row[header] ?? '';
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        return `"${val}"`;
      }
      return val;
    });
    csvLines.push(line.join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel displays Thai characters without mojibake
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  triggerBlobDownload(csvContent, filename, 'text/csv;charset=utf-8;');

  return { filename, count: filtered.length };
}

function triggerBlobDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------
// 3. Parse & Restore Backup File (.xlsx, .csv, or .json)
// ---------------------------------------------------------
export interface ParsedBackupResult {
  success: boolean;
  message?: string;
  records: AttendanceRecord[];
  newCompanies: { name: string; type: CompanyType }[];
  summary: {
    totalRecords: number;
    totalAttendees: number;
    companiesCount: number;
    dateSpan: string;
  };
}

export async function parseBackupFile(file: File): Promise<ParsedBackupResult> {
  const fileName = file.name.toLowerCase();

  try {
    // A. Handle JSON backup file
    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      let records: AttendanceRecord[] = [];

      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed && Array.isArray(parsed.records)) {
        records = parsed.records;
      }

      return validateAndNormalizeRecords(records);
    }

    // B. Handle Excel (.xlsx, .xls) and CSV (.csv) using SheetJS
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        message: 'ไม่พบตารางข้อมูล (Sheet) ในไฟล์ที่อัปโหลด',
        records: [],
        newCompanies: [],
        summary: { totalRecords: 0, totalAttendees: 0, companiesCount: 0, dateSpan: '-' },
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return {
        success: false,
        message: 'ไฟล์ว่างเปล่า ไม่มีข้อมูลรายการบันทึก',
        records: [],
        newCompanies: [],
        summary: { totalRecords: 0, totalAttendees: 0, companiesCount: 0, dateSpan: '-' },
      };
    }

    // Map columns dynamically to standard AttendanceRecord
    const normalizedList: AttendanceRecord[] = [];
    const companiesSet = new Set<string>();
    const newCompaniesList: { name: string; type: CompanyType }[] = [];

    rawRows.forEach((row, idx) => {
      // Find company name column
      const compNameRaw =
        row['ชื่อบริษัท/หจก.'] ||
        row['ชื่อบริษัท'] ||
        row['บริษัท'] ||
        row['companyName'] ||
        row['Company'] ||
        '';
      const companyName = String(compNameRaw).trim();
      if (!companyName) return; // Skip empty row

      // Find date
      let dateRaw =
        row['วันที่'] ||
        row['date'] ||
        row['วันที่ (พ.ศ.)'] ||
        '2026-10-21';
      
      // If SheetJS parsed an Excel date serial number
      if (typeof dateRaw === 'number') {
        const parsedDate = XLSX.SSF.parse_date_code(dateRaw);
        if (parsedDate) {
          dateRaw = `2026-10-${String(parsedDate.d).padStart(2, '0')}`;
        }
      }
      const canonicalDate = toCanonicalDate(String(dateRaw));

      // Find type
      const typeRaw = String(
        row['ประเภทคู่ธุรกิจ'] || row['ประเภท'] || row['companyType'] || 'internal'
      ).trim();
      const companyType: CompanyType =
        typeRaw.includes('นอก') || typeRaw.toLowerCase() === 'external'
          ? 'external'
          : 'internal';

      // Find attendees
      const attendeesRaw =
        row['จำนวนคน (คน)'] ||
        row['จำนวนคน'] ||
        row['จำนวนผู้เข้าร่วม'] ||
        row['attendees'] ||
        0;
      const attendees = Math.max(parseInt(String(attendeesRaw), 10) || 0, 0);

      // Find other optional fields
      const supervisorName = String(
        row['ผู้บันทึก'] || row['supervisorName'] || 'จป.วิชาชีพ PPPC'
      ).trim();
      const safetyTopic = String(
        row['หัวข้อความปลอดภัย'] || row['safetyTopic'] || ''
      ).trim();
      const notes = String(row['หมายเหตุ'] || row['notes'] || '').trim();
      const targetWorkers = parseInt(String(row['เป้าหมายคน'] || row['targetWorkers']), 10) || undefined;

      const recordId = `rec-restored-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;

      normalizedList.push({
        id: recordId,
        companyId: `comp-${companyName}`,
        companyName,
        companyType,
        attendees,
        date: canonicalDate,
        createdAt: new Date().toISOString(),
        supervisorName,
        safetyTopic: safetyTopic || undefined,
        targetWorkers,
        notes: notes || undefined,
        totalAfter: attendees,
      });

      if (!companiesSet.has(companyName.toLowerCase())) {
        companiesSet.add(companyName.toLowerCase());
        newCompaniesList.push({ name: companyName, type: companyType });
      }
    });

    if (normalizedList.length === 0) {
      return {
        success: false,
        message: 'ไม่พบรายการบันทึกที่ถูกต้องในไฟล์ กรุณาตรวจสอบชื่อคอลัมน์',
        records: [],
        newCompanies: [],
        summary: { totalRecords: 0, totalAttendees: 0, companiesCount: 0, dateSpan: '-' },
      };
    }

    return validateAndNormalizeRecords(normalizedList, newCompaniesList);
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`,
      records: [],
      newCompanies: [],
      summary: { totalRecords: 0, totalAttendees: 0, companiesCount: 0, dateSpan: '-' },
    };
  }
}

function validateAndNormalizeRecords(
  records: AttendanceRecord[],
  knownCompanies?: { name: string; type: CompanyType }[]
): ParsedBackupResult {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      success: false,
      message: 'ไม่พบข้อมูลบันทึกที่สามารถกู้คืนได้',
      records: [],
      newCompanies: [],
      summary: { totalRecords: 0, totalAttendees: 0, companiesCount: 0, dateSpan: '-' },
    };
  }

  let totalAttendees = 0;
  const companiesMap = new Map<string, { name: string; type: CompanyType }>();
  const dates = new Set<string>();

  const validRecords: AttendanceRecord[] = records.map((r, i) => {
    const canonDate = toCanonicalDate(r.date);
    dates.add(canonDate);
    const count = Number(r.attendees) || 0;
    totalAttendees += count;

    const trimmedName = r.companyName ? String(r.companyName).trim() : `บริษัท ${i + 1}`;
    const type: CompanyType = r.companyType === 'external' ? 'external' : 'internal';

    if (!companiesMap.has(trimmedName.toLowerCase())) {
      companiesMap.set(trimmedName.toLowerCase(), { name: trimmedName, type });
    }

    return {
      ...r,
      id: r.id || `rec-restore-${Date.now()}-${i}`,
      companyName: trimmedName,
      companyType: type,
      attendees: count,
      date: canonDate,
      totalAfter: typeof r.totalAfter === 'number' ? r.totalAfter : count,
      createdAt: r.createdAt || new Date().toISOString(),
    };
  });

  const sortedDates = Array.from(dates).sort();
  const dateSpan =
    sortedDates.length > 0
      ? `${toThaiDateShort(sortedDates[0])} – ${toThaiDateShort(sortedDates[sortedDates.length - 1])}`
      : '-';

  return {
    success: true,
    records: validRecords,
    newCompanies: knownCompanies || Array.from(companiesMap.values()),
    summary: {
      totalRecords: validRecords.length,
      totalAttendees,
      companiesCount: companiesMap.size,
      dateSpan,
    },
  };
}
