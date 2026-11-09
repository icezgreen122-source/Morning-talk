export type CompanyType = 'internal' | 'external';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  totalAttendees: number; // View-dependent total (Daily or Cumulative based on active view mode)
  dailyAttendees?: number; // Attendees specifically on selectedDate
  cumulativeAttendees?: number; // Total attendees across all dates in shutdown project
  isCustom?: boolean;
  contactPerson?: string;
  phone?: string;
  targetAttendees?: number;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  companyId: string;
  companyName: string;
  companyType: CompanyType;
  attendees: number;
  targetWorkers?: number;
  safetyTopic?: string;
  supervisorName?: string;
  notes?: string;
  totalAfter: number;
  createdAt: string;
}

export interface QuickStats {
  internalCompaniesWithAttendees: number;
  internalAttendeesCount: number;
  externalCompaniesWithAttendees: number;
  externalAttendeesCount: number;
  totalCompaniesCount: number;
  totalAttendeesCount: number;
  participatingCompaniesCount: number;
  internalSharePercent: number;
  externalSharePercent: number;
  avgAttendeesPerCompany: number;
  dataCoveragePercent: number;
  internalCompaniesCount?: number;
  externalCompaniesCount?: number;
  masterTargetCount?: number;
  // Comparison metrics for Cumulative vs Daily
  cumulativeTotalAttendees?: number;
  cumulativeInternalAttendees?: number;
  cumulativeExternalAttendees?: number;
  cumulativeParticipatingCompanies?: number;
  cumulativeCoveragePercent?: number;
}

export type IncidentType = 'accident' | 'near-miss' | 'unsafe-condition';

export interface IncidentRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: IncidentType;
  typeName: string; // อุบัติเหตุ | ใกล้เคียงอุบัติเหตุ | สภาพอันตราย
  description: string;
  companyName: string;
  location?: string;
  reporter?: string;
  createdAt: string;
}

export interface ProjectConfig {
  projectName: string;
  subTitle?: string;
  projectSubtitle?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  operatingDate?: string;
  location?: string;
  isCustomRange?: boolean;
}

export interface DateOption {
  value: string; // YYYY-MM-DD
  label: string; // Thai full label e.g. "16 ต.ค. 2026 (วันศุกร์)"
  short: string; // Thai short label e.g. "16 ต.ค."
  dayOfWeek?: string;
  isWithinProject?: boolean;
}


