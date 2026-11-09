import { Company, AttendanceRecord, IncidentRecord, ProjectConfig } from '../types';

export interface DashboardApiResponse {
  success: boolean;
  data: {
    companies: Company[];
    records: AttendanceRecord[];
    incidents: IncidentRecord[];
    selectedDate: string;
    summaryDateText: string;
    lockedDates?: string[];
    unlockedDates?: string[];
    currentOperatingDate?: string;
    projectConfig?: ProjectConfig;
  };
  message?: string;
}

// 1. Fetch complete data from server
export async function fetchDashboardData(): Promise<DashboardApiResponse['data'] | null> {
  try {
    const res = await fetch('/api/data', {
      headers: { credentials: 'same-origin' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: DashboardApiResponse = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn('API /api/data fetch error, falling back to local state:', err);
  }
  return null;
}

// 2. Save / Add attendance record
export async function apiSaveRecord(record: AttendanceRecord): Promise<boolean> {
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch (err) {
    console.error('apiSaveRecord error:', err);
    return false;
  }
}

// 3. Update attendance record
export async function apiUpdateRecord(
  record: AttendanceRecord,
  forceAdmin: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/records/${record.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, forceAdmin }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: json?.message || 'ไม่สามารถแก้ไขข้อมูลได้' };
    }
    return { success: true };
  } catch (err) {
    console.error('apiUpdateRecord error:', err);
    return { success: false, message: 'การเชื่อมต่อขัดข้อง' };
  }
}

// 4. Delete attendance record
export async function apiDeleteRecord(
  recordId: string,
  forceAdmin: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/records/${recordId}?forceAdmin=${forceAdmin}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceAdmin }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: json?.message || 'ไม่สามารถลบข้อมูลได้' };
    }
    return { success: true };
  } catch (err) {
    console.error('apiDeleteRecord error:', err);
    return { success: false, message: 'การเชื่อมต่อขัดข้อง' };
  }
}

// 5. Add custom company
export async function apiAddCompany(name: string, type: 'internal' | 'external'): Promise<boolean> {
  try {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    });
    return res.ok;
  } catch (err) {
    console.error('apiAddCompany error:', err);
    return false;
  }
}

// 6. Update company
export async function apiUpdateCompany(id: string, payload: { name?: string; type?: 'internal' | 'external' }): Promise<boolean> {
  try {
    const res = await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('apiUpdateCompany error:', err);
    return false;
  }
}

// 7. Delete company (Universal)
export async function apiDeleteCompany(
  id: string,
  deleteRecords: boolean = true
): Promise<{ success: boolean; message: string; data?: any }> {
  console.log(`[apiService] Sending DELETE /api/companies/${id}?deleteRecords=${deleteRecords}`);
  try {
    const res = await fetch(`/api/companies/${encodeURIComponent(id)}?deleteRecords=${deleteRecords}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteRecords }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `ไม่สามารถลบบริษัทได้ (รหัสสถานะ: HTTP ${res.status})`;
      console.error('[apiService] apiDeleteCompany failed:', errorMsg);
      return { success: false, message: errorMsg };
    }

    console.log('[apiService] apiDeleteCompany success:', json);
    return {
      success: true,
      message: json?.message || 'ลบบริษัทออกจากฐานข้อมูลเรียบร้อยแล้ว',
      data: json?.data,
    };
  } catch (err: any) {
    const errorMsg = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    console.error('[apiService] apiDeleteCompany network error:', err);
    return { success: false, message: errorMsg };
  }
}

// 8. Add incident
export async function apiAddIncident(incident: IncidentRecord): Promise<boolean> {
  try {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    return res.ok;
  } catch (err) {
    console.error('apiAddIncident error:', err);
    return false;
  }
}

// 9. Delete incident
export async function apiDeleteIncident(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/incidents/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('apiDeleteIncident error:', err);
    return false;
  }
}

// 10. Reset to Zero (Zero state)
export async function apiResetToZero(): Promise<boolean> {
  try {
    const res = await fetch('/api/data/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('apiResetToZero error:', err);
    return false;
  }
}

// 11. Factory Reset
export async function apiFactoryReset(): Promise<boolean> {
  try {
    const res = await fetch('/api/data/factory-reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('apiFactoryReset error:', err);
    return false;
  }
}

// 12. Full Data Sync / Import Backup
export async function apiSyncData(payload: {
  companies: Company[];
  records: AttendanceRecord[];
  incidents?: IncidentRecord[];
  summaryDateText?: string;
  lockedDates?: string[];
  unlockedDates?: string[];
  currentOperatingDate?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/data/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('apiSyncData error:', err);
    return false;
  }
}

// 13. Lock / Unlock date API
export async function apiLockDate(
  date: string,
  locked: boolean,
  operatingDate?: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await fetch('/api/lock/date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, locked, operatingDate }),
    });
    const json = await res.json().catch(() => null);
    return {
      success: res.ok,
      data: json?.data,
      message: json?.message,
    };
  } catch (err: any) {
    console.error('apiLockDate error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
  }
}

// 14. Check Publish Readiness & Data Integrity
export async function apiCheckPublishStatus(): Promise<{
  success: boolean;
  readyToPublish: boolean;
  isPersisted: boolean;
  recordsCount: number;
  companiesCount: number;
  totalAttendees: number;
  incidentsCount: number;
  uniqueDates: string[];
  warning?: string | null;
  message: string;
} | null> {
  try {
    const res = await fetch('/api/publish-status', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('apiCheckPublishStatus error:', err);
    return null;
  }
}

// 15. Verify Publish Parity (Preview vs Published)
export async function apiVerifyPublishParity(params: {
  expectedCompanies: number;
  expectedRecords: number;
  expectedAttendees: number;
}): Promise<{
  success: boolean;
  verified: boolean;
  discrepancy: boolean;
  preview: any;
  published: any;
  message: string;
} | null> {
  try {
    const res = await fetch('/api/publish-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('apiVerifyPublishParity error:', err);
    return null;
  }
}

// 16. Update Project Period and Configuration
export async function apiUpdateProjectConfig(
  config: ProjectConfig
): Promise<{ success: boolean; data?: ProjectConfig; message?: string }> {
  try {
    const res = await fetch('/api/project-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const json = await res.json().catch(() => null);
    return {
      success: res.ok,
      data: json?.data,
      message: json?.message,
    };
  } catch (err) {
    console.error('apiUpdateProjectConfig error:', err);
    return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
  }
}


