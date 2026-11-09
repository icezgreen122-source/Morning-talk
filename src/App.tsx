import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Company, AttendanceRecord, QuickStats, CompanyType, IncidentRecord, ProjectConfig, DateOption } from './types';
import { getInitialCompanies, SHUTDOWN_DATES, DEFAULT_PROJECT_CONFIG } from './data/initialData';
import { generateSampleData } from './data/sampleData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ActionToolbar } from './components/ActionToolbar';
import { NoticeBanners } from './components/NoticeBanners';
import { DateFilterBar } from './components/DateFilterBar';
import { RecordForm } from './components/RecordForm';
import { KPICards } from './components/KPICards';
import { AttendanceCharts } from './components/AttendanceCharts';
import { MasterTable } from './components/MasterTable';
import { SecondaryCharts } from './components/SecondaryCharts';
import { RecentHistory } from './components/RecentHistory';
import { Footer } from './components/Footer';
import { Clock, AlertCircle } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import {
  isSameDate,
  toCanonicalDate,
  toThaiDateShort,
  toThaiDateFull,
  toThaiDateBuddhist,
  extractDay,
  getDatesBetween,
} from './utils/dateUtils';

// Modals
import { NewRecordModal } from './components/NewRecordModal';
import { EditRecordModal } from './components/EditRecordModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CompanyManagementModal } from './components/CompanyManagementModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ExportModal } from './components/ExportModal';
import { AdminProfileModal } from './components/AdminProfileModal';
import { InfographicModal } from './components/InfographicModal';
import { DashboardExportView } from './components/DashboardExportView';
import { AccidentModal } from './components/AccidentModal';
import { BackupModal } from './components/BackupModal';
import { AdminUnlockModal } from './components/AdminUnlockModal';
import { PublishSafetyModal } from './components/PublishSafetyModal';
import masterSnapshot from './data/publishedMasterSnapshot.json';
import { isDateLocked, isRecordLocked, getSystemTodayDate } from './utils/lockService';
import {
  fetchDashboardData,
  apiSaveRecord,
  apiUpdateRecord,
  apiDeleteRecord,
  apiAddCompany,
  apiUpdateCompany,
  apiDeleteCompany,
  apiAddIncident,
  apiDeleteIncident,
  apiResetToZero,
  apiFactoryReset,
  apiSyncData,
  apiLockDate,
  apiUpdateProjectConfig,
} from './utils/apiService';

const STORAGE_KEY = 'mt_dash_v1';

export default function App() {
  // 1. Initialize State with persistent database + masterSnapshot fallback + localStorage
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.companies) && parsed.companies.length > 0) {
          return parsed.companies;
        }
      }
    } catch (e) {
      console.error('Failed to load companies from localStorage:', e);
    }
    // Master persistent snapshot baseline: ALWAYS 45 companies, NEVER empty
    if (masterSnapshot && Array.isArray((masterSnapshot as any).companies) && (masterSnapshot as any).companies.length > 0) {
      return (masterSnapshot as any).companies;
    }
    return getInitialCompanies();
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
          // Normalize dates so '22 ต.ค.', '2026-10-22', etc. align to canonical 2026-10-XX
          const cleanRecords = parsed.records.map((r: AttendanceRecord) => ({
            ...r,
            date: toCanonicalDate(r.date),
          }));
          return cleanRecords;
        }
      }
    } catch (e) {
      console.error('Failed to load records from localStorage:', e);
    }
    // Master persistent snapshot baseline: Real records from database, NEVER 0 on publish!
    if (masterSnapshot && Array.isArray((masterSnapshot as any).records) && (masterSnapshot as any).records.length > 0) {
      return (masterSnapshot as any).records.map((r: any) => ({
        ...r,
        date: toCanonicalDate(r.date),
      }));
    }
    return [];
  });

  // Project Configuration State (Supports any date range cross-month and cross-year)
  const PROJECT_CONFIG_KEY = 'mt_project_config_v1';
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(() => {
    try {
      const saved = localStorage.getItem(PROJECT_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.startDate && parsed.endDate) {
          return parsed;
        }
      }
    } catch (e) {}
    if (masterSnapshot && (masterSnapshot as any).projectConfig) {
      return (masterSnapshot as any).projectConfig;
    }
    return DEFAULT_PROJECT_CONFIG;
  });

  // Dynamic available dates within project period + any dates where records exist
  const availableDates = useMemo<DateOption[]>(() => {
    const recordDates = records.map((r) => r.date).filter(Boolean);
    return getDatesBetween(projectConfig.startDate, projectConfig.endDate, recordDates);
  }, [projectConfig.startDate, projectConfig.endDate, records]);

  // Global Date and View Mode State (Defaulted to operating date or latest available date)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
          const dates = parsed.records
            .map((r: any) => toCanonicalDate(r.date))
            .filter(Boolean);
          if (dates.length > 0) {
            return dates.sort().reverse()[0];
          }
        }
      }
    } catch (e) {}
    if (masterSnapshot && Array.isArray((masterSnapshot as any).records) && (masterSnapshot as any).records.length > 0) {
      const dates = (masterSnapshot as any).records
        .map((r: any) => toCanonicalDate(r.date))
        .filter(Boolean);
      if (dates.length > 0) {
        return dates.sort().reverse()[0];
      }
    }
    return '2026-10-22';
  });

  const [summaryDateText, setSummaryDateText] = useState<string>(() => {
    return toThaiDateBuddhist('2026-10-22');
  });

  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');

  // Date Range state for Secondary Charts (Dynamically initialized with project dates)
  const [rangeStartDate, setRangeStartDate] = useState<string>(() => projectConfig.startDate || '2026-10-16');
  const [rangeEndDate, setRangeEndDate] = useState<string>(() => projectConfig.endDate || '2026-10-31');

  const handleRangeChange = useCallback((start: string, end: string) => {
    setRangeStartDate(start);
    setRangeEndDate(end);
  }, []);

  // Handler to update project configuration across app, localStorage, and persistent database
  const handleUpdateProjectConfig = useCallback(
    async (newConfig: ProjectConfig): Promise<{ success: boolean; message?: string }> => {
      setProjectConfig(newConfig);
      try {
        localStorage.setItem(PROJECT_CONFIG_KEY, JSON.stringify(newConfig));
      } catch (e) {}

      // Synchronize range start/end
      setRangeStartDate(newConfig.startDate);
      setRangeEndDate(newConfig.endDate);

      // If currently selected date is outside the new range and has no records, move to default operating date
      const activeList = getDatesBetween(newConfig.startDate, newConfig.endDate);
      const isDateActive = activeList.some((d) => isSameDate(d.value, selectedDate));
      if (!isDateActive) {
        const fallbackDate = newConfig.operatingDate || newConfig.startDate;
        setSelectedDate(fallbackDate);
        setSummaryDateText(toThaiDateBuddhist(fallbackDate));
      }

      const res = await apiUpdateProjectConfig(newConfig);
      if (res.success) {
        showToast(`✓ อัปเดตและบันทึกระยะเวลาโครงการ ${newConfig.startDate} ถึง ${newConfig.endDate} เรียบร้อยแล้ว`);
      }
      return res;
    },
    [selectedDate]
  );

  // Convert Gregorian date to Thai Buddhist date text
  const getThaiSummaryDate = (dateStr: string) => {
    return toThaiDateBuddhist(dateStr);
  };

  const handleDateChange = useCallback((newDate: string) => {
    const canon = toCanonicalDate(newDate);
    setSelectedDate(canon);
    setSummaryDateText(toThaiDateBuddhist(canon));
    setViewMode('daily');
  }, []);

  // Fetch persisted data from backend database on startup
  useEffect(() => {
    let isMounted = true;
    fetchDashboardData().then((serverData) => {
      if (!isMounted || !serverData) return;

      if (Array.isArray(serverData.companies) && serverData.companies.length > 0) {
        setCompanies(serverData.companies);
      }

      if (Array.isArray(serverData.records)) {
        const cleanRecords = serverData.records.map((r) => ({
          ...r,
          date: toCanonicalDate(r.date),
        }));
        setRecords(cleanRecords);

        // Auto-select latest recorded date with data, or fallback to 2026-10-21
        if (cleanRecords.length > 0) {
          const dates = cleanRecords.map((r) => r.date).filter(Boolean);
          if (dates.length > 0) {
            const latestDate = dates.sort().reverse()[0];
            setSelectedDate(latestDate);
            setSummaryDateText(toThaiDateBuddhist(latestDate));
          }
        }
      }

      if (Array.isArray(serverData.incidents)) {
        setIncidents(serverData.incidents);
      }

      if (serverData.summaryDateText) {
        setSummaryDateText(serverData.summaryDateText);
      }

      if (Array.isArray(serverData.lockedDates)) {
        setLockedDates(serverData.lockedDates);
      }

      if (Array.isArray(serverData.unlockedDates)) {
        setUnlockedDates(serverData.unlockedDates);
      }

      if (serverData.projectConfig && serverData.projectConfig.startDate && serverData.projectConfig.endDate) {
        setProjectConfig(serverData.projectConfig);
        setRangeStartDate(serverData.projectConfig.startDate);
        setRangeEndDate(serverData.projectConfig.endDate);
        try {
          localStorage.setItem('mt_project_config_v1', JSON.stringify(serverData.projectConfig));
        } catch (e) {}
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Quick Record prefilled company
  const [prefilledCompany, setPrefilledCompany] = useState<Company | null>(null);

  // Daily Lock States
  const LOCKED_DATES_KEY = 'mt_locked_dates_v1';
  const UNLOCKED_DATES_KEY = 'mt_unlocked_dates_v1';

  const [lockedDates, setLockedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mt_locked_dates_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (masterSnapshot && Array.isArray((masterSnapshot as any).lockedDates)) {
      return (masterSnapshot as any).lockedDates;
    }
    return ['2026-10-19'];
  });

  const [unlockedDates, setUnlockedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mt_unlocked_dates_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    if (masterSnapshot && Array.isArray((masterSnapshot as any).unlockedDates)) {
      return (masterSnapshot as any).unlockedDates;
    }
    return ['2026-10-22'];
  });

  // Active Operating Date: uses user-selected projectConfig operatingDate, or system date
  const currentOperatingDate = useMemo(() => {
    if (projectConfig.operatingDate) {
      return projectConfig.operatingDate;
    }
    const sys = getSystemTodayDate();
    return sys;
  }, [projectConfig.operatingDate]);

  // Is today currently locked?
  const isTodayLocked = useMemo(() => {
    return isDateLocked(currentOperatingDate, lockedDates, unlockedDates, currentOperatingDate);
  }, [currentOperatingDate, lockedDates, unlockedDates]);

  // Modal control states
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isCompanyManagementOpen, setIsCompanyManagementOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupInitialFormat, setBackupInitialFormat] = useState<'excel' | 'csv'>('excel');
  const [isPublishSafetyOpen, setIsPublishSafetyOpen] = useState(false);

  // Admin Unlock Modal State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockTargetDate, setUnlockTargetDate] = useState<string>('');

  // Active record targeted for Edit or Delete
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  // Accident / Incident Records (Zero Accident Tracking)
  const INCIDENTS_KEY = 'mt_incidents_v1';
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(INCIDENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load incidents from localStorage:', e);
    }
    if (masterSnapshot && Array.isArray((masterSnapshot as any).incidents)) {
      return (masterSnapshot as any).incidents;
    }
    return [];
  });

  const [isAccidentModalOpen, setIsAccidentModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    } catch (e) {
      console.error('Failed to save incidents to localStorage:', e);
    }
  }, [incidents]);

  // Persist lock states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCKED_DATES_KEY, JSON.stringify(lockedDates));
      localStorage.setItem(UNLOCKED_DATES_KEY, JSON.stringify(unlockedDates));
    } catch (e) {
      console.error('Failed to save lock states to localStorage:', e);
    }
  }, [lockedDates, unlockedDates]);

  // Daily Lock Action Handlers
  const handleToggleDailyLock = useCallback(() => {
    const isCurrentlyLocked = isDateLocked(currentOperatingDate, lockedDates, unlockedDates, currentOperatingDate);
    if (isCurrentlyLocked) {
      // Must verify Admin PIN to unlock
      setUnlockTargetDate(currentOperatingDate);
      setIsUnlockModalOpen(true);
    } else {
      // Lock today immediately
      const nextLocked = Array.from(new Set([...lockedDates, currentOperatingDate]));
      const nextUnlocked = unlockedDates.filter((d) => d !== currentOperatingDate);
      setLockedDates(nextLocked);
      setUnlockedDates(nextUnlocked);
      apiLockDate(currentOperatingDate, true, currentOperatingDate);
      showToast(`🔒 ล็อคข้อมูลประจำวันที่ ${toThaiDateBuddhist(currentOperatingDate)} เรียบร้อยแล้ว (ปิดการแก้ไข/ลบ)`);
    }
  }, [currentOperatingDate, lockedDates, unlockedDates]);

  const handleLockDate = useCallback((targetDate: string, lock: boolean) => {
    const canon = toCanonicalDate(targetDate);
    if (lock) {
      const nextLocked = Array.from(new Set([...lockedDates, canon]));
      const nextUnlocked = unlockedDates.filter((d) => d !== canon);
      setLockedDates(nextLocked);
      setUnlockedDates(nextUnlocked);
      apiLockDate(canon, true, currentOperatingDate);
      showToast(`🔒 ล็อคข้อมูลวันที่ ${toThaiDateBuddhist(canon)} เรียบร้อยแล้ว`);
    } else {
      const nextUnlocked = Array.from(new Set([...unlockedDates, canon]));
      const nextLocked = lockedDates.filter((d) => d !== canon);
      setLockedDates(nextLocked);
      setUnlockedDates(nextUnlocked);
      apiLockDate(canon, false, currentOperatingDate);
      showToast(`🔓 ปลดล็อคข้อมูลวันที่ ${toThaiDateBuddhist(canon)} เรียบร้อยแล้ว (สามารถแก้ไข/ลบได้)`);
    }
  }, [lockedDates, unlockedDates, currentOperatingDate]);

  const handleUnlockConfirm = useCallback((targetDate: string) => {
    const canon = toCanonicalDate(targetDate);
    const nextUnlocked = Array.from(new Set([...unlockedDates, canon]));
    const nextLocked = lockedDates.filter((d) => d !== canon);
    setLockedDates(nextLocked);
    setUnlockedDates(nextUnlocked);
    apiLockDate(canon, false, currentOperatingDate);
    showToast(`✓ ยืนยันสิทธิ์ Super Admin: ปลดล็อคข้อมูลวันที่ ${toThaiDateBuddhist(canon)} เรียบร้อยแล้ว`);
  }, [unlockedDates, lockedDates, currentOperatingDate]);

  const handleAddIncident = useCallback((payload: Omit<IncidentRecord, 'id' | 'createdAt'>) => {
    const newInc: IncidentRecord = {
      ...payload,
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setIncidents((prev) => [newInc, ...prev]);
    apiAddIncident(newInc);
    showToast(`✓ บันทึกรายการอุบัติเหตุ (${payload.typeName}) สำเร็จ`);
  }, []);

  const handleDeleteIncident = useCallback((id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    apiDeleteIncident(id);
    showToast('ลบรายการอุบัติเหตุเรียบร้อยแล้ว');
  }, []);

  // Quick feedback toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // 2. Persist to localStorage whenever companies or records change
  useEffect(() => {
    try {
      const dataToSave = {
        companies,
        records,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [companies, records]);

  // Selected date metadata (Unified match across ISO, Thai labels, and dynamic project dates)
  const selectedDateObj = useMemo<DateOption>(() => {
    return (
      availableDates.find((d) => isSameDate(d.value, selectedDate)) ||
      SHUTDOWN_DATES.find((d) => isSameDate(d.value, selectedDate)) || {
        value: toCanonicalDate(selectedDate),
        label: toThaiDateFull(selectedDate),
        short: toThaiDateShort(selectedDate),
        dayNum: extractDay(selectedDate) || 1,
      }
    );
  }, [selectedDate, availableDates]);

  // Filter records specifically for the currently selected date
  const dailyRecords = useMemo(() => {
    return records.filter((r) => isSameDate(r.date, selectedDate));
  }, [records, selectedDate]);

  // Compute attendee counts for each company both for selectedDate and cumulative
  const companiesWithMetrics: Company[] = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const cumulativeMap = new Map<string, number>();

    records.forEach((r) => {
      const keyId = r.companyId;
      const keyName = r.companyName.trim().toLowerCase();

      // Cumulative sum across all records
      cumulativeMap.set(keyId, (cumulativeMap.get(keyId) || 0) + r.attendees);
      cumulativeMap.set(keyName, (cumulativeMap.get(keyName) || 0) + r.attendees);

      // Daily sum for selectedDate (Flexible day matching: 2026-10-22 vs 22 ต.ค.)
      if (isSameDate(r.date, selectedDate)) {
        dailyMap.set(keyId, (dailyMap.get(keyId) || 0) + r.attendees);
        dailyMap.set(keyName, (dailyMap.get(keyName) || 0) + r.attendees);
      }
    });

    return companies.map((comp) => {
      const nameKey = comp.name.trim().toLowerCase();
      const dailyCount = dailyMap.get(comp.id) ?? dailyMap.get(nameKey) ?? 0;
      const cumulativeCount = cumulativeMap.get(comp.id) ?? cumulativeMap.get(nameKey) ?? 0;

      // When viewMode is 'daily', totalAttendees reflects dailyCount.
      // When viewMode is 'cumulative', totalAttendees reflects cumulativeCount.
      const displayTotal = viewMode === 'daily' ? dailyCount : cumulativeCount;

      return {
        ...comp,
        totalAttendees: displayTotal,
        dailyAttendees: dailyCount,
        cumulativeAttendees: cumulativeCount,
      };
    });
  }, [companies, records, selectedDate, viewMode]);

  // 3. Calculate Daily Stats for selectedDate
  const dailyStats: QuickStats = useMemo(() => {
    const internalCompanies = companiesWithMetrics.filter((c) => c.type === 'internal');
    const externalCompanies = companiesWithMetrics.filter((c) => c.type === 'external');

    const internalAttendees = internalCompanies.reduce((sum, c) => sum + (c.dailyAttendees ?? 0), 0);
    const externalAttendees = externalCompanies.reduce((sum, c) => sum + (c.dailyAttendees ?? 0), 0);
    const totalAttendees = internalAttendees + externalAttendees;

    const internalActive = internalCompanies.filter((c) => (c.dailyAttendees ?? 0) > 0).length;
    const externalActive = externalCompanies.filter((c) => (c.dailyAttendees ?? 0) > 0).length;
    const totalActive = companiesWithMetrics.filter((c) => (c.dailyAttendees ?? 0) > 0).length;

    const internalShare = totalAttendees > 0 ? Math.round((internalAttendees / totalAttendees) * 100) : 0;
    const externalShare = totalAttendees > 0 ? Math.round((externalAttendees / totalAttendees) * 100) : 0;
    const avg = totalActive > 0 ? Math.round(totalAttendees / totalActive) : 0;
    const coverage = companiesWithMetrics.length > 0 ? Math.round((totalActive / companiesWithMetrics.length) * 100) : 0;

    return {
      internalCompaniesWithAttendees: internalActive,
      internalAttendeesCount: internalAttendees,
      externalCompaniesWithAttendees: externalActive,
      externalAttendeesCount: externalAttendees,
      totalCompaniesCount: companiesWithMetrics.length,
      totalAttendeesCount: totalAttendees,
      participatingCompaniesCount: totalActive,
      internalSharePercent: internalShare,
      externalSharePercent: externalShare,
      avgAttendeesPerCompany: avg,
      dataCoveragePercent: coverage,
    };
  }, [companiesWithMetrics]);

  // Calculate Cumulative Stats for entire project
  const cumulativeStats: QuickStats = useMemo(() => {
    const internalCompanies = companiesWithMetrics.filter((c) => c.type === 'internal');
    const externalCompanies = companiesWithMetrics.filter((c) => c.type === 'external');

    const internalAttendees = internalCompanies.reduce((sum, c) => sum + (c.cumulativeAttendees ?? 0), 0);
    const externalAttendees = externalCompanies.reduce((sum, c) => sum + (c.cumulativeAttendees ?? 0), 0);
    const totalAttendees = internalAttendees + externalAttendees;

    const internalActive = internalCompanies.filter((c) => (c.cumulativeAttendees ?? 0) > 0).length;
    const externalActive = externalCompanies.filter((c) => (c.cumulativeAttendees ?? 0) > 0).length;
    const totalActive = companiesWithMetrics.filter((c) => (c.cumulativeAttendees ?? 0) > 0).length;

    const internalShare = totalAttendees > 0 ? Math.round((internalAttendees / totalAttendees) * 100) : 0;
    const externalShare = totalAttendees > 0 ? Math.round((externalAttendees / totalAttendees) * 100) : 0;
    const avg = totalActive > 0 ? Math.round(totalAttendees / totalActive) : 0;
    const coverage = companiesWithMetrics.length > 0 ? Math.round((totalActive / companiesWithMetrics.length) * 100) : 0;

    return {
      internalCompaniesWithAttendees: internalActive,
      internalAttendeesCount: internalAttendees,
      externalCompaniesWithAttendees: externalActive,
      externalAttendeesCount: externalAttendees,
      totalCompaniesCount: companiesWithMetrics.length,
      totalAttendeesCount: totalAttendees,
      participatingCompaniesCount: totalActive,
      internalSharePercent: internalShare,
      externalSharePercent: externalShare,
      avgAttendeesPerCompany: avg,
      dataCoveragePercent: coverage,
    };
  }, [companiesWithMetrics]);

  // Active stats to feed components based on active view mode
  const currentStats = viewMode === 'daily' ? dailyStats : cumulativeStats;

  // ================= CRUD Operations =================

  // 1. Create Record (New attendance log entry)
  const handleSaveRecord = useCallback(
    (payload: {
      date: string;
      companyName: string;
      companyType: CompanyType;
      attendees: number;
      targetWorkers?: number;
      safetyTopic?: string;
      supervisorName?: string;
      notes?: string;
    }) => {
      const {
        date,
        companyName,
        companyType,
        attendees,
        targetWorkers,
        safetyTopic,
        supervisorName,
        notes,
      } = payload;
      const canonDate = toCanonicalDate(date);
      const trimmedName = companyName.trim();

      const existingIndex = companies.findIndex(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
      );

      let targetCompanyId: string;
      let isNewCompany = false;
      let actualType = companyType;
      let updatedCompanyList = [...companies];

      if (existingIndex >= 0) {
        // Company exists
        const existing = companies[existingIndex];
        targetCompanyId = existing.id;
        actualType = existing.type;
      } else {
        // Company is new: ADD to masterlist
        isNewCompany = true;
        targetCompanyId = `custom-${Date.now()}`;

        const newCompany: Company = {
          id: targetCompanyId,
          name: trimmedName,
          type: companyType,
          totalAttendees: 0,
          isCustom: true,
        };

        updatedCompanyList = [newCompany, ...updatedCompanyList];
      }

      // Check if an attendance record already exists for this company on this specific date
      const existingRecordIndex = records.findIndex(
        (r) =>
          isSameDate(r.date, canonDate) &&
          (r.companyId === targetCompanyId ||
            r.companyName.trim().toLowerCase() === trimmedName.toLowerCase())
      );

      let nextRecords: AttendanceRecord[];
      const isUpdate = existingRecordIndex >= 0;

      const existingCompany = companiesWithMetrics.find((c) => c.id === targetCompanyId);
      const newTotalAfter = (existingCompany?.cumulativeAttendees || 0) + attendees;

      if (isUpdate) {
        const updatedRecord: AttendanceRecord = {
          ...records[existingRecordIndex],
          date: canonDate,
          companyName: trimmedName,
          companyType: actualType,
          attendees,
          targetWorkers: targetWorkers || attendees,
          safetyTopic: safetyTopic || records[existingRecordIndex].safetyTopic,
          supervisorName: supervisorName || records[existingRecordIndex].supervisorName,
          notes: notes !== undefined ? notes : records[existingRecordIndex].notes,
          totalAfter: newTotalAfter,
          createdAt: new Date().toISOString(),
        };
        nextRecords = records.map((r, idx) => (idx === existingRecordIndex ? updatedRecord : r));
      } else {
        const newRecord: AttendanceRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: canonDate,
          companyId: targetCompanyId,
          companyName: trimmedName,
          companyType: actualType,
          attendees,
          targetWorkers: targetWorkers || attendees,
          safetyTopic,
          supervisorName,
          notes,
          totalAfter: newTotalAfter,
          createdAt: new Date().toISOString(),
        };
        nextRecords = [newRecord, ...records];
        apiSaveRecord(newRecord);
        if (isNewCompany) {
          apiAddCompany(trimmedName, actualType);
        }
      }

      if (isUpdate) {
        const targetRec = nextRecords.find((r) => r.id === (records[existingRecordIndex]?.id));
        if (targetRec) apiSaveRecord(targetRec);
      }

      // Commit changes immediately to state and storage
      setCompanies(updatedCompanyList);
      setRecords(nextRecords);

      // Immediately switch view to the recorded date without requiring manual page refresh
      setSelectedDate(canonDate);
      setSummaryDateText(toThaiDateBuddhist(canonDate));
      setViewMode('daily');

      const thaiDateShort = toThaiDateShort(canonDate);
      const thaiDateFull = toThaiDateFull(canonDate);
      const message = `✓ ข้อมูลของคุณถูกบันทึกและสำรองเรียบร้อยแล้ว: ${
        isNewCompany
          ? `เพิ่มคู่ธุรกิจใหม่ "${trimmedName}" (${actualType === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}) ยอดเข้าร่วม ${attendees} คน`
          : isUpdate
          ? `อัปเดตข้อมูล Morning Talk "${trimmedName}" เป็น ${attendees} คน`
          : `ข้อมูล Morning Talk "${trimmedName}" (${attendees} คน)`
      } ประจำวันที่ ${thaiDateShort} (${thaiDateFull}) แสดงผลทันที`;

      showToast(message);

      return {
        success: true,
        isNewCompany,
        message,
      };
    },
    [companies, records, companiesWithMetrics]
  );

  // 2. Update Record (Edit existing attendance log)
  const handleUpdateRecord = useCallback(
    async (updatedRecord: AttendanceRecord) => {
      const canonDate = toCanonicalDate(updatedRecord.date);
      const fixedRecord = { ...updatedRecord, date: canonDate };

      // Daily Lock Check
      const isLocked = isRecordLocked(fixedRecord, lockedDates, unlockedDates, currentOperatingDate);
      if (isLocked) {
        showToast('🔒 ข้อมูลวันนี้ถูกล็อคแล้ว ติดต่อ Admin หากต้องการแก้ไข');
        setUnlockTargetDate(fixedRecord.date);
        setIsUnlockModalOpen(true);
        return;
      }

      const nextRecords = records.map((r) =>
        r.id === fixedRecord.id ? fixedRecord : r
      );

      setRecords(nextRecords);
      const res = await apiUpdateRecord(fixedRecord);
      if (!res.success && res.message) {
        showToast(`⚠️ ${res.message}`);
        return;
      }
      showToast(`✓ บันทึกเรียบร้อยแล้ว: แก้ไขข้อมูล Morning Talk ของ "${updatedRecord.companyName}" เรียบร้อยแล้ว`);
    },
    [records, lockedDates, unlockedDates, currentOperatingDate]
  );

  // 3. Delete Record (Remove attendance log and deduct attendees)
  const handleDeleteRecord = useCallback(
    async (recordId: string) => {
      const recordToDeleteItem = records.find((r) => r.id === recordId);
      if (recordToDeleteItem) {
        const isLocked = isRecordLocked(recordToDeleteItem, lockedDates, unlockedDates, currentOperatingDate);
        if (isLocked) {
          showToast('🔒 ข้อมูลวันนี้ถูกล็อคแล้ว ติดต่อ Admin หากต้องการแก้ไข');
          setUnlockTargetDate(recordToDeleteItem.date);
          setIsUnlockModalOpen(true);
          return;
        }
      }

      const nextRecords = records.filter((r) => r.id !== recordId);
      setRecords(nextRecords);
      const res = await apiDeleteRecord(recordId);
      if (!res.success && res.message) {
        showToast(`⚠️ ${res.message}`);
        return;
      }

      showToast(
        `🗑️ ลบรายการของ "${recordToDeleteItem?.companyName || 'รายการ'}" เรียบร้อยแล้ว`
      );
    },
    [records, lockedDates, unlockedDates, currentOperatingDate]
  );

  // 4. Add Company to Master List (with duplicate check)
  const handleAddCompany = useCallback(
    (newCompanyPayload: { name: string; type: CompanyType }) => {
      const trimmed = newCompanyPayload.name.trim();
      const duplicate = companies.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      );

      if (duplicate) {
        return {
          success: false,
          message: `มีบริษัท/หจก. ชื่อ "${trimmed}" อยู่ในระบบแล้ว`,
        };
      }

      const newCompany: Company = {
        id: `custom-${Date.now()}`,
        name: trimmed,
        type: newCompanyPayload.type,
        totalAttendees: 0,
        isCustom: true,
      };

      setCompanies((prev) => [newCompany, ...prev]);
      apiAddCompany(trimmed, newCompanyPayload.type);
      showToast(`+ เพิ่มบริษัท "${trimmed}" เข้าสู่มาสเตอร์ลิสต์เรียบร้อยแล้ว`);

      return {
        success: true,
        message: `เพิ่มบริษัท "${trimmed}" เรียบร้อยแล้ว`,
      };
    },
    [companies]
  );

  // 5. Update Company Name
  const handleUpdateCompanyName = useCallback(
    (companyId: string, newName: string) => {
      const trimmed = newName.trim();
      const duplicate = companies.some(
        (c) => c.id !== companyId && c.name.toLowerCase() === trimmed.toLowerCase()
      );

      if (duplicate) {
        return {
          success: false,
          message: `ชื่อ "${trimmed}" ซ้ำกับบริษัทอื่นในระบบ`,
        };
      }

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, name: trimmed } : c))
      );

      // Sync existing records with new name
      setRecords((prev) =>
        prev.map((r) =>
          r.companyId === companyId ? { ...r, companyName: trimmed } : r
        )
      );

      apiUpdateCompany(companyId, { name: trimmed });
      showToast(`✓ แก้ไขชื่อบริษัทเป็น "${trimmed}" เรียบร้อยแล้ว`);

      return {
        success: true,
        message: `แก้ไขชื่อบริษัทเรียบร้อยแล้ว`,
      };
    },
    [companies]
  );

  // 6. Toggle Company Type (Internal <-> External)
  const handleToggleCompanyType = useCallback(
    (companyId: string) => {
      let targetType: CompanyType = 'internal';

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id === companyId) {
            targetType = c.type === 'internal' ? 'external' : 'internal';
            return { ...c, type: targetType };
          }
          return c;
        })
      );

      setRecords((prev) =>
        prev.map((r) => {
          if (r.companyId === companyId) {
            return {
              ...r,
              companyType: targetType,
            };
          }
          return r;
        })
      );

      apiUpdateCompany(companyId, { type: targetType });
      showToast(`สลับประเภทบริษัทเป็น "${targetType === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}" แล้ว`);
    },
    []
  );

  // 7. Delete Company (Universal for any company, persisted to backend database)
  const handleDeleteCompany = useCallback(
    async (
      companyId: string,
      deleteRecords: boolean
    ): Promise<{ success: boolean; message: string }> => {
      const comp = companies.find((c) => c.id === companyId);
      const compName = comp?.name || companyId;
      console.log(
        `[App] Deleting company id=${companyId}, name=${compName}, deleteRecords=${deleteRecords}`
      );

      try {
        // Call backend API first
        const apiRes = await apiDeleteCompany(companyId, deleteRecords);
        if (!apiRes.success) {
          console.error('[App] Backend delete failed:', apiRes.message);
          showToast(`❌ ลบไม่สำเร็จ: ${apiRes.message}`);
          return apiRes;
        }

        // Remove from companies list in React state
        const nextCompanies = companies.filter(
          (c) =>
            c.id !== companyId &&
            c.name.trim().toLowerCase() !== compName.trim().toLowerCase()
        );
        setCompanies(nextCompanies);

        // If deleteRecords is true, remove its records too
        let nextRecords = records;
        if (deleteRecords) {
          nextRecords = records.filter(
            (r) =>
              r.companyId !== companyId &&
              r.companyName.trim().toLowerCase() !== compName.trim().toLowerCase()
          );
          setRecords(nextRecords);
        }

        // Immediate persistence to localStorage
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              companies: nextCompanies,
              records: nextRecords,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.error('[App] Failed to update localStorage on company delete:', e);
        }

        const msg = deleteRecords
          ? `✓ ลบบริษัท "${compName}" และประวัติที่เกี่ยวข้องออกจากฐานข้อมูลเรียบร้อยแล้ว`
          : `✓ ลบบริษัท "${compName}" ออกจากระบบเรียบร้อยแล้ว (เก็บประวัติบันทึกไว้)`;

        console.log(
          `[App] Company deleted successfully: ${compName}. Remaining companies: ${nextCompanies.length}`
        );
        showToast(msg);
        return { success: true, message: msg };
      } catch (err: any) {
        const errorMsg = err?.message || 'เกิดข้อผิดพลาดในการลบบริษัท';
        console.error('[App] Exception in handleDeleteCompany:', err);
        showToast(`❌ เกิดข้อผิดพลาด: ${errorMsg}`);
        return { success: false, message: errorMsg };
      }
    },
    [companies, records]
  );

  // 8. Load Sample Data (16-20 Oct 2026 realistic shutdown progress - explicitly triggered by user)
  const handleLoadSampleData = useCallback(() => {
    const isConfirmed = window.confirm(
      'โหลดข้อมูลตัวอย่างกิจกรรม Morning Talk หรือไม่?\n\n- ระบบจะจำลองข้อมูลช่วง 16–20 ต.ค. 2026 ให้ทั้ง 37 บริษัท\n- ตัวเลขกราฟ KPI และประวัติจะแสดงผลครบถ้วนทันที\n- บันทึกลงฐานข้อมูลถาวร สามารถกู้คืนหรือรีเซ็ทศูนย์ได้ตลอดเวลา'
    );

    if (isConfirmed) {
      const sample = generateSampleData();
      setCompanies(sample.companies);
      setRecords(sample.records);
      setSelectedDate('2026-10-20');
      setSummaryDateText(toThaiDateBuddhist('2026-10-20'));
      apiSyncData({
        companies: sample.companies,
        records: sample.records,
        incidents: [],
        summaryDateText: toThaiDateBuddhist('2026-10-20'),
      });
      showToast('⚡ โหลดข้อมูลตัวอย่าง 16–20 ต.ค. 2026 เรียบร้อยแล้ว! ข้อมูลถูกบันทึกลงฐานข้อมูล');
    }
  }, []);

  // 9. Reset to Zero handler (Keeps company names, resets attendee counts to 0)
  const handleResetToZero = useCallback(() => {
    const isConfirmed = window.confirm(
      'ยืนยันการรีเซ็ทศูนย์หรือไม่?\n\n- จำนวนผู้เข้าร่วมทั้งหมดจะถูกล้างเป็น 0 คน\n- รายชื่อบริษัท/หจก. ทั้งหมดยังคงอยู่ครบถ้วน\n- ประวัติการบันทึกจะถูกล้างเริ่มต้นใหม่'
    );

    if (isConfirmed) {
      setCompanies((prev) =>
        prev.map((c) => ({
          ...c,
          totalAttendees: 0,
        }))
      );
      setRecords([]);
      setSelectedDate('2026-10-21');
      setSummaryDateText(toThaiDateBuddhist('2026-10-21'));
      apiResetToZero();
      showToast('⟲ รีเซ็ทศูนย์เรียบร้อยแล้ว: ยอดคนทั้งหมดเป็น 0 โดยรายชื่อบริษัทยังคงอยู่ครบ');
    }
  }, []);

  // 10. Factory Reset (Restores original 37 companies, clears custom ones)
  const handleFactoryReset = useCallback(() => {
    const isConfirmed = window.confirm(
      '⚠️ ยืนยันคืนค่าเริ่มต้นโรงงาน (Factory Reset) หรือไม่?\n\n- ล้างบริษัทที่เพิ่มใหม่ทั้งหมด\n- คืนค่ารายชื่อ 37 บริษัทเริ่มต้นของ PPPC ขอนแก่น\n- จำนวนผู้เข้าร่วมทั้งหมดจะเริ่มที่ 0'
    );

    if (isConfirmed) {
      setCompanies(getInitialCompanies());
      setRecords([]);
      setIncidents([]);
      setSelectedDate('2026-10-21');
      setSummaryDateText(toThaiDateBuddhist('2026-10-21'));
      apiFactoryReset();
      showToast('คืนค่าเริ่มต้น 37 บริษัทของ PPPC ขอนแก่นเรียบร้อยแล้ว');
    }
  }, []);

  // 11. Import JSON Backup
  const handleImportData = useCallback(
    (imported: { companies: Company[]; records: AttendanceRecord[] }) => {
      setCompanies(imported.companies);
      setRecords(imported.records);
      apiSyncData(imported);
      showToast('✓ นำเข้าข้อมูลระบบจากไฟล์สำรองเรียบร้อยแล้ว (บันทึกลงฐานข้อมูลถาวร)');
    },
    []
  );

  // 11.1 Restore Data from Backup File (Excel, CSV, JSON)
  const handleRestoreData = useCallback(
    (restoredRecords: AttendanceRecord[], mode: 'replace' | 'append') => {
      const canonRecords = restoredRecords.map((r) => ({
        ...r,
        date: toCanonicalDate(r.date),
      }));

      let nextCompanies = [...companies];
      const ensureCompanies = (recs: AttendanceRecord[]) => {
        recs.forEach((r) => {
          const trimmed = r.companyName.trim();
          const exists = nextCompanies.some(
            (c) => c.name.toLowerCase() === trimmed.toLowerCase()
          );
          if (!exists && trimmed) {
            nextCompanies.push({
              id: r.companyId || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: trimmed,
              type: r.companyType || 'external',
              totalAttendees: 0,
              isCustom: true,
            });
          }
        });
      };

      let nextRecords: AttendanceRecord[];

      if (mode === 'replace') {
        ensureCompanies(canonRecords);
        nextRecords = canonRecords;
      } else {
        // Append / Merge
        ensureCompanies(canonRecords);
        const merged = [...records];
        canonRecords.forEach((newRec) => {
          const idx = merged.findIndex(
            (r) =>
              isSameDate(r.date, newRec.date) &&
              r.companyName.trim().toLowerCase() === newRec.companyName.trim().toLowerCase()
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...newRec };
          } else {
            merged.unshift(newRec);
          }
        });
        nextRecords = merged;
      }

      setCompanies(nextCompanies);
      setRecords(nextRecords);

      // Pick latest date from restored records if available
      if (canonRecords.length > 0) {
        const dates = canonRecords.map((r) => r.date).filter(Boolean).sort().reverse();
        if (dates[0]) {
          setSelectedDate(dates[0]);
          setSummaryDateText(toThaiDateBuddhist(dates[0]));
        }
      }

      // Persist to backend and localStorage
      apiSyncData({
        companies: nextCompanies,
        records: nextRecords,
        incidents,
        summaryDateText,
      });

      showToast(
        mode === 'replace'
          ? `✓ กู้คืนข้อมูลสำเร็จ: นำเข้าข้อมูลสำรองแทนที่ทั้งหมด ${nextRecords.length} รายการ`
          : `✓ ผสานข้อมูลสำรองสำเร็จ: รวมข้อมูลทั้งหมดเป็น ${nextRecords.length} รายการ`
      );
    },
    [companies, records, incidents, summaryDateText]
  );

  // 12. Quick Record for a specific company
  const handleQuickRecord = useCallback((company: Company) => {
    setPrefilledCompany(company);
    const formElem = document.getElementById('daily-record-form-section');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // 13. Refresh screen
  const handleRefresh = useCallback(() => {
    showToast('รีเฟรชข้อมูลเรียบร้อยแล้ว: ข้อมูลในระบบเป็นปัจจุบัน');
  }, []);

  // 13.1 Sync Database manually to persistent snapshot
  const handleSyncDatabase = useCallback(async () => {
    try {
      const res = await apiSyncData({
        companies,
        records,
        incidents,
        summaryDateText,
        lockedDates,
        unlockedDates,
        currentOperatingDate,
      });
      if (res) {
        showToast(
          `✓ ซิงค์และบันทึกข้อมูล ${companies.length} บริษัท และ ${records.length} รายการลงฐานข้อมูลถาวรเรียบร้อยแล้ว (พร้อม Publish)`
        );
      } else {
        showToast('⚠️ ไม่สามารถซิงค์ข้อมูลกับเซิร์ฟเวอร์ได้');
      }
    } catch (e) {
      showToast('❌ การซิงค์ข้อมูลขัดข้อง');
    }
  }, [
    companies,
    records,
    incidents,
    summaryDateText,
    lockedDates,
    unlockedDates,
    currentOperatingDate,
  ]);

  // 14. Print Report (Opens the Infographic Modal which has print & download capabilities)
  const handlePrintReport = useCallback(() => {
    setIsInfographicOpen(true);
  }, []);

  // 15. Quick CSV Export
  const handleExportCSV = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const handleExportJSON = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  // 16. Fixed Layout PNG Export (High-Resolution 16:9 Single-Page Landscape from dedicated view)
  const [isDirectExportingPNG, setIsDirectExportingPNG] = useState(false);

  const handleDirectExportPNG = useCallback(async () => {
    if (isDirectExportingPNG) return;

    const wrapper = document.getElementById('dashboard-export-wrapper');
    const targetElement = document.getElementById('dashboard-export-container');

    if (!wrapper || !targetElement) {
      showToast('ไม่พบองค์ประกอบรายงาน Dashboard สำหรับสร้างภาพ PNG');
      return;
    }

    setIsDirectExportingPNG(true);
    showToast('กำลังจัดเตรียมโครงสร้างรายงาน 16:9 สำหรับสร้างภาพ PNG...');

    const originalLeft = wrapper.style.left;
    const originalZIndex = wrapper.style.zIndex;

    try {
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      wrapper.style.zIndex = '-9999';
      wrapper.style.visibility = 'visible';

      // Pre-load images inside export container to guarantee sharp rendering
      const imgs = Array.from(targetElement.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            setTimeout(() => resolve(false), 1500);
          });
        })
      );

      // Brief pause to allow layout and SVG font rendering to stabilize
      await new Promise((resolve) => setTimeout(resolve, 300));

      const contentWidth = 1920;
      const contentHeight = 1080;
      const dateStr = selectedDate || '2026-10-22';
      const filename = `SCGP_Safety_Morning_Talk_16x9_${dateStr}.png`;

      const downloadBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
          showToast(`✓ บันทึกภาพ ${filename} (16:9 ความละเอียดสูง) สำเร็จ`);
        }, 500);
      };

      try {
        const blob = await toBlob(targetElement, {
          width: contentWidth,
          height: contentHeight,
          canvasWidth: contentWidth * 2,
          canvasHeight: contentHeight * 2,
          pixelRatio: 2,
          backgroundColor: '#f1f5f9',
          skipFonts: true,
          cacheBust: true,
        });

        if (blob && blob.size > 1000) {
          downloadBlob(blob);
          return;
        }
      } catch (blobErr) {
        console.warn('toBlob fallback to toPng:', blobErr);
      }

      const dataUrl = await toPng(targetElement, {
        width: contentWidth,
        height: contentHeight,
        canvasWidth: contentWidth * 2,
        canvasHeight: contentHeight * 2,
        pixelRatio: 2,
        backgroundColor: '#f1f5f9',
        skipFonts: true,
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const fallbackBlob = await res.blob();
      downloadBlob(fallbackBlob);
    } catch (err: any) {
      console.error('Export PNG failed:', err);
      showToast('เกิดข้อผิดพลาดในการสร้าง PNG: ' + (err?.message || 'โปรดลองอีกครั้ง'));
    } finally {
      if (wrapper) {
        wrapper.style.left = originalLeft;
        wrapper.style.zIndex = originalZIndex;
      }
      setIsDirectExportingPNG(false);
    }
  }, [isDirectExportingPNG, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0c2340] text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Navbar (Navy Blue, SCGP badge & CARE FOR ALL badge) */}
      <Navbar
        onResetToZero={handleResetToZero}
        onRefresh={handleRefresh}
        onOpenPublishSafety={() => setIsPublishSafetyOpen(true)}
        persistedRecordsCount={records.length}
        projectConfig={projectConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div id="dashboard" className="w-full">
          {/* Hero Section */}
          <HeroSection
            totalCompanies={companies.length}
            lastUpdatedText={summaryDateText}
            projectConfig={projectConfig}
          />

          {/* Top Action Toolbar (The 7 Industrial Action Buttons + สรุปข้อมูลเป็น PNG + สำรองข้อมูล + ล็อควันนี้) */}
          <ActionToolbar
            onOpenNewRecord={() => setIsNewRecordModalOpen(true)}
            onOpenCompanyManagement={() => setIsCompanyManagementOpen(true)}
            onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
            onPrintReport={handlePrintReport}
            onOpenExport={() => setIsExportModalOpen(true)}
            onLoadSampleData={handleLoadSampleData}
            onOpenUserProfile={() => setIsUserProfileOpen(true)}
            totalCompanies={companies.length}
            totalRecords={records.length}
            onDirectExportPNG={handleDirectExportPNG}
            isGeneratingPNG={isDirectExportingPNG}
            onOpenBackupExcel={() => {
              setBackupInitialFormat('excel');
              setIsBackupModalOpen(true);
            }}
            onOpenBackupCSV={() => {
              setBackupInitialFormat('csv');
              setIsBackupModalOpen(true);
            }}
            isTodayLocked={isTodayLocked}
            onToggleDailyLock={handleToggleDailyLock}
            onOpenPublishSafety={() => setIsPublishSafetyOpen(true)}
          />

          {/* Safety Notice Banners */}
          <NoticeBanners />

          {/* Date Filter Bar - The Global Date Selector for all dashboard views */}
          <DateFilterBar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            dailyRecordsCount={dailyRecords.length}
            dailyAttendeesCount={dailyStats.totalAttendeesCount}
            cumulativeAttendeesCount={cumulativeStats.totalAttendeesCount}
            availableDates={availableDates}
            projectConfig={projectConfig}
          />

        {/* Informative Banner when the selected date has no attendance records */}
        {viewMode === 'daily' && dailyRecords.length === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <p className="font-extrabold text-sm text-amber-950 whitespace-nowrap">
                  ยังไม่มีข้อมูลสำหรับวันที่เลือก กรุณากรอกและบันทึกข้อมูล
                </p>
                <p className="text-xs text-amber-800/90 mt-0.5 [word-break:keep-all] [line-break:strict]">
                  <span>วันที่ </span>
                  <strong className="font-bold text-amber-950 whitespace-nowrap">{selectedDateObj.label}</strong>
                  <span> ยังไม่มีการบันทึกข้อมูล Morning Talk (ยอดผู้เข้าร่วม 0 คน, กราฟแสดงสถานะว่างเปล่า) — สามารถกรอกข้อมูลผ่านฟอร์มด้านล่างนี้</span>
                </p>
              </div>
            </div>
            <a
              href="#daily-record-form-section"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs whitespace-nowrap"
            >
              กรอกข้อมูลตอนนี้
            </a>
          </div>
        )}

        {/* In-page Daily Record Form */}
        <div id="daily-record-form-section">
          <RecordForm
            companies={companiesWithMetrics}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            prefilledCompany={prefilledCompany}
            onClearPrefill={() => setPrefilledCompany(null)}
            onSaveRecord={handleSaveRecord}
            availableDates={availableDates}
            projectConfig={projectConfig}
          />
        </div>

        {/* KPI Summary Cards (4 Cards) with selectedDate context and Accident summary */}
        <KPICards
          stats={currentStats}
          viewMode={viewMode}
          selectedDateLabel={selectedDateObj.label}
          cumulativeStats={cumulativeStats}
          incidents={incidents}
          onOpenAccidentModal={() => setIsAccidentModalOpen(true)}
        />

        {/* 2 Vertical Bar Charts (Internal vs External) */}
        <AttendanceCharts
          companies={companiesWithMetrics}
          selectedDateLabel={selectedDateObj.short}
          viewMode={viewMode}
        />

        {/* 2 New Summary Charts (Daily Trend & Top 10 with Date Range Picker) */}
        <SecondaryCharts
          companies={companiesWithMetrics}
          records={records}
          selectedDate={selectedDate}
          selectedDateLabel={selectedDateObj.short}
          viewMode={viewMode}
          rangeStartDate={rangeStartDate}
          rangeEndDate={rangeEndDate}
          onRangeChange={handleRangeChange}
          availableDates={availableDates}
          projectConfig={projectConfig}
        />

        {/* Master Table of 37+ Companies (Sticky Header, Sort, Search, Filter, Quick Record) */}
        <MasterTable
          companies={companiesWithMetrics}
          onToggleCompanyType={handleToggleCompanyType}
          onQuickRecord={handleQuickRecord}
          selectedDate={selectedDate}
          selectedDateLabel={selectedDateObj.short}
          viewMode={viewMode}
        />

        {/* Recent Attendance History (With Edit and Delete buttons for each record, protected by Daily Lock) */}
        <RecentHistory
          records={records}
          lockedDates={lockedDates}
          unlockedDates={unlockedDates}
          currentDate={currentOperatingDate}
          onEditRecord={(rec) => setRecordToEdit(rec)}
          onDeleteRecord={(rec) => setRecordToDelete(rec)}
          onViewAll={() => setIsAdminPanelOpen(true)}
          onRequestUnlock={(date) => {
            setUnlockTargetDate(date);
            setIsUnlockModalOpen(true);
          }}
          onNotify={showToast}
        />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* ================= MODALS ================= */}

      {/* 1. New Attendance Entry Modal */}
      <NewRecordModal
        isOpen={isNewRecordModalOpen}
        onClose={() => setIsNewRecordModalOpen(false)}
        companies={companiesWithMetrics}
        records={records}
        onSaveRecord={handleSaveRecord}
        currentDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
      />

      {/* 2. Edit Record Modal */}
      <EditRecordModal
        isOpen={Boolean(recordToEdit)}
        onClose={() => setRecordToEdit(null)}
        record={recordToEdit}
        onUpdateRecord={handleUpdateRecord}
        availableDates={availableDates}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        record={recordToDelete}
        onConfirmDelete={() => {
          if (recordToDelete) {
            handleDeleteRecord(recordToDelete.id);
            setRecordToDelete(null);
          }
        }}
      />

      {/* 4. Company Master Management Modal */}
      <CompanyManagementModal
        isOpen={isCompanyManagementOpen}
        onClose={() => setIsCompanyManagementOpen(false)}
        companies={companiesWithMetrics}
        records={records}
        onAddCompany={handleAddCompany}
        onUpdateCompanyName={handleUpdateCompanyName}
        onToggleCompanyType={handleToggleCompanyType}
        onDeleteCompany={handleDeleteCompany}
        onQuickRecord={handleQuickRecord}
      />

      {/* 5. Admin Panel (Full CRUD, Master Reset, Daily Lock Management, Project Period Settings) */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        stats={currentStats}
        records={records}
        companies={companiesWithMetrics}
        onEditRecord={(rec) => {
          setIsAdminPanelOpen(false);
          setRecordToEdit(rec);
        }}
        onDeleteRecord={(rec) => {
          setIsAdminPanelOpen(false);
          setRecordToDelete(rec);
        }}
        onLoadSampleData={handleLoadSampleData}
        onResetToZero={handleResetToZero}
        onFactoryReset={handleFactoryReset}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onRestoreData={handleRestoreData}
        lockedDates={lockedDates}
        unlockedDates={unlockedDates}
        currentDate={currentOperatingDate}
        onToggleDateLock={handleLockDate}
        onRequestUnlock={(date) => {
          setUnlockTargetDate(date);
          setIsUnlockModalOpen(true);
        }}
        projectConfig={projectConfig}
        onUpdateProjectConfig={handleUpdateProjectConfig}
        availableDates={availableDates}
      />

      {/* 5.1 Admin PIN Unlock Modal */}
      <AdminUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        targetDate={unlockTargetDate || currentOperatingDate}
        onConfirmUnlock={handleUnlockConfirm}
      />

      {/* 6. Export and Backup Modal (With High-Resolution PNG & CSV/JSON) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        companies={companiesWithMetrics}
        records={records}
        onImportData={handleImportData}
        onNotify={showToast}
        selectedDate={selectedDate}
        summaryDateText={summaryDateText}
        onUpdateSummaryDateText={setSummaryDateText}
      />

      {/* 7. User Profile & System Admin Modal */}
      <AdminProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        onLogout={() => {
          showToast('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      {/* 8. Infographic & Print Report Modal */}
      <InfographicModal
        isOpen={isInfographicOpen}
        onClose={() => setIsInfographicOpen(false)}
        companies={companiesWithMetrics}
        selectedDate={selectedDate}
        selectedDateLabel={selectedDateObj.label}
        viewMode={viewMode}
        summaryDateText={summaryDateText}
        stats={currentStats}
      />

      {/* 9. Accident / Incident Tracking Modal */}
      <AccidentModal
        isOpen={isAccidentModalOpen}
        onClose={() => setIsAccidentModalOpen(false)}
        incidents={incidents}
        onAddIncident={handleAddIncident}
        onDeleteIncident={handleDeleteIncident}
        companies={companiesWithMetrics}
        selectedDate={selectedDate}
      />

      {/* 10. Backup Modal (Excel .xlsx & CSV with scope selection) */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        records={records}
        rangeStartDate={rangeStartDate}
        rangeEndDate={rangeEndDate}
        initialFormat={backupInitialFormat}
        onNotify={showToast}
      />

      {/* 11. Publish Safety & Data Integrity Modal (MUST: Zero Data Loss Guard) */}
      <PublishSafetyModal
        isOpen={isPublishSafetyOpen}
        onClose={() => setIsPublishSafetyOpen(false)}
        companies={companiesWithMetrics}
        records={records}
        totalAttendees={cumulativeStats.totalAttendeesCount}
        onSyncDatabase={handleSyncDatabase}
        onShowToast={showToast}
      />

      {/* Dedicated Off-Screen High-Resolution Container for PNG Export (16:9 Landscape Frame) */}
      <div
        id="dashboard-export-wrapper"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: '1920px',
          height: '1080px',
          pointerEvents: 'none',
          zIndex: -9999,
        }}
        aria-hidden="true"
      >
        <DashboardExportView
          companies={companiesWithMetrics}
          records={viewMode === 'daily' ? dailyRecords : records}
          allRecords={records}
          stats={currentStats}
          selectedDate={selectedDate}
          selectedDateLabel={selectedDateObj.label}
          viewMode={viewMode}
          cumulativeStats={cumulativeStats}
          summaryDateText={summaryDateText}
          incidents={incidents}
          rangeStartDate={rangeStartDate}
          rangeEndDate={rangeEndDate}
        />
      </div>
    </div>
  );
}
