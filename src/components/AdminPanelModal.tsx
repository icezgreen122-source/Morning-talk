import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  Building,
  Users,
  Activity,
  Calendar,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Lock,
  Unlock,
  FileUp,
  FileCheck2,
  HelpCircle,
  CalendarDays,
  Clock,
  Save,
  Check,
} from 'lucide-react';
import { Company, AttendanceRecord, QuickStats, ProjectConfig, DateOption } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { isSameDate, formatProjectPeriod, toThaiDateFull, getDatesBetween } from '../utils/dateUtils';
import { parseBackupFile, ParsedBackupResult } from '../utils/backupService';
import { isDateLocked, isRecordLocked } from '../utils/lockService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: QuickStats;
  companies: Company[];
  records: AttendanceRecord[];
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (record: AttendanceRecord) => void;
  onLoadSampleData: () => void;
  onResetToZero: () => void;
  onFactoryReset: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onRestoreData?: (records: AttendanceRecord[], mode: 'replace' | 'append') => void;
  lockedDates?: string[];
  unlockedDates?: string[];
  currentDate?: string;
  onToggleDateLock?: (date: string, lock: boolean) => void;
  onRequestUnlock?: (date: string) => void;
  projectConfig?: ProjectConfig;
  onUpdateProjectConfig?: (config: ProjectConfig) => Promise<{ success: boolean; message?: string }>;
  availableDates?: DateOption[];
}

type AdminTab = 'audit' | 'records' | 'project' | 'system' | 'role';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  stats,
  companies,
  records,
  onEditRecord,
  onDeleteRecord,
  onLoadSampleData,
  onResetToZero,
  onFactoryReset,
  onExportCSV,
  onExportJSON,
  onRestoreData,
  lockedDates = [],
  unlockedDates = [],
  currentDate,
  onToggleDateLock,
  onRequestUnlock,
  projectConfig,
  onUpdateProjectConfig,
  availableDates,
}) => {
  const activeDateOptions = availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES;
  const [activeTab, setActiveTab] = useState<AdminTab>('audit');
  const [recordFilterDate, setRecordFilterDate] = useState<string>('all');
  const [recordSearch, setRecordSearch] = useState<string>('');

  // Restore state
  const [restoreResult, setRestoreResult] = useState<ParsedBackupResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'append'>('replace');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const result = await parseBackupFile(file);
      if (!result.success || result.records.length === 0) {
        setRestoreError(result.message || 'ไม่พบข้อมูลที่ถูกต้องในไฟล์สำรอง');
        setRestoreResult(null);
      } else {
        setRestoreResult(result);
      }
    } catch (err: any) {
      setRestoreError(err?.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์สำรอง');
      setRestoreResult(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRestore = () => {
    if (!restoreResult || !onRestoreData) return;
    onRestoreData(restoreResult.records, restoreMode);
    const count = restoreResult.records.length;
    setRestoreSuccess(
      `✓ กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว (${count.toLocaleString()} รายการ) โดยระบบอัปเดตข้อมูลและคำนวณ KPI ทันที`
    );
    setRestoreResult(null);
  };

  // Project Config Form state
  const [cfgName, setCfgName] = useState<string>(projectConfig?.projectName || 'โครงการ PPPC Major Shutdown 2026');
  const [cfgSubtitle, setCfgSubtitle] = useState<string>(projectConfig?.projectSubtitle || 'รายงานสรุปความปลอดภัยประจำวัน OHS');
  const [cfgLocation, setCfgLocation] = useState<string>(projectConfig?.location || 'ขอนแก่น');
  const [cfgStartDate, setCfgStartDate] = useState<string>(projectConfig?.startDate || '2026-10-16');
  const [cfgEndDate, setCfgEndDate] = useState<string>(projectConfig?.endDate || '2026-10-31');
  const [cfgOperatingDate, setCfgOperatingDate] = useState<string>(projectConfig?.operatingDate || '2026-10-22');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if projectConfig updates from outside
  useEffect(() => {
    if (projectConfig) {
      setCfgName(projectConfig.projectName || '');
      setCfgSubtitle(projectConfig.projectSubtitle || '');
      setCfgLocation(projectConfig.location || '');
      setCfgStartDate(projectConfig.startDate || '2026-10-16');
      setCfgEndDate(projectConfig.endDate || '2026-10-31');
      setCfgOperatingDate(projectConfig.operatingDate || '2026-10-22');
    }
  }, [projectConfig]);

  const handleSaveProjectConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cfgStartDate || !cfgEndDate) {
      setConfigFeedback({ type: 'error', message: 'กรุณาระบุวันเริ่มต้นและวันสิ้นสุดของโครงการ' });
      return;
    }
    if (cfgStartDate > cfgEndDate) {
      setConfigFeedback({ type: 'error', message: 'วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุดของโครงการ' });
      return;
    }
    setIsSavingConfig(true);
    setConfigFeedback(null);
    try {
      const updatedCfg: ProjectConfig = {
        projectName: cfgName.trim() || 'โครงการ PPPC Major Shutdown 2026',
        projectSubtitle: cfgSubtitle.trim() || 'รายงานสรุปความปลอดภัยประจำวัน OHS',
        location: cfgLocation.trim() || 'ขอนแก่น',
        startDate: cfgStartDate,
        endDate: cfgEndDate,
        operatingDate: cfgOperatingDate || cfgStartDate,
      };
      if (onUpdateProjectConfig) {
        const res = await onUpdateProjectConfig(updatedCfg);
        if (res.success) {
          setConfigFeedback({ type: 'success', message: '✓ บันทึกการตั้งค่าระยะเวลาโครงการเรียบร้อยแล้ว ระบบอัปเดตและจำค่าถาวร' });
        } else {
          setConfigFeedback({ type: 'error', message: res.message || 'เกิดข้อผิดพลาดในการบันทึก' });
        }
      }
    } catch (err: any) {
      setConfigFeedback({ type: 'error', message: err?.message || 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePresetCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    setCfgStartDate(`${y}-${m}-01`);
    setCfgEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    setCfgOperatingDate(`${y}-${m}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const handlePresetNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const y = nextMonth.getFullYear();
    const m = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, nextMonth.getMonth() + 1, 0).getDate();
    setCfgStartDate(`${y}-${m}-01`);
    setCfgEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    setCfgOperatingDate(`${y}-${m}-01`);
  };

  const handlePresetShutdown2026 = () => {
    setCfgName('โครงการ PPPC Major Shutdown 2026');
    setCfgStartDate('2026-10-16');
    setCfgEndDate('2026-10-31');
    setCfgOperatingDate('2026-10-22');
  };

  const handlePresetYear2027 = () => {
    setCfgName('โครงการ Annual Turnaround PPPC 2027');
    setCfgStartDate('2027-10-01');
    setCfgEndDate('2027-10-31');
    setCfgOperatingDate('2027-10-01');
  };

  // Completeness stats
  const recordedCompanies = useMemo(() => companies.filter((c) => c.totalAttendees > 0), [companies]);
  const pendingCompanies = useMemo(() => companies.filter((c) => c.totalAttendees === 0), [companies]);

  // Filtered attendance records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesDate = recordFilterDate === 'all' || isSameDate(r.date, recordFilterDate);
        const matchesSearch =
          r.companyName.toLowerCase().includes(recordSearch.toLowerCase()) ||
          (r.safetyTopic && r.safetyTopic.toLowerCase().includes(recordSearch.toLowerCase())) ||
          (r.supervisorName && r.supervisorName.toLowerCase().includes(recordSearch.toLowerCase()));
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const cmp = b.date.localeCompare(a.date);
        return cmp !== 0 ? cmp : b.createdAt.localeCompare(a.createdAt);
      });
  }, [records, recordFilterDate, recordSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Admin Panel — แผงควบคุมระบบความปลอดภัย</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300">
                PPPC ขอนแก่น · OHS &amp; Safety Department · Major Shutdown 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ภาพรวม &amp; ตรวจสอบความครบถ้วน</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800">
              {stats.dataCoveragePercent}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'records'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>จัดการบันทึกทั้งหมด (CRUD)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
              {records.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('project')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'project'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>ตั้งค่าระยะเวลาโครงการ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
              ใหม่
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>จัดการฐานข้อมูล &amp; สำรองข้อมูล</span>
          </button>

          <button
            onClick={() => setActiveTab('role')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'role'
                ? 'border-purple-600 text-purple-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>สิทธิ์ผู้ใช้ &amp; System Info</span>
          </button>
        </div>

        {/* Tab 1: Audit & Completeness */}
        {activeTab === 'audit' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>คู่ธุรกิจทั้งหมด</span>
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums">
                  {companies.length} แห่ง
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ในพื้นที่ {companies.filter((c) => c.type === 'internal').length} / นอกพื้นที่ {companies.filter((c) => c.type === 'external').length}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกยอดแล้ว</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-900 mt-1 tabular-nums">
                  {recordedCompanies.length} แห่ง
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  ความครอบคลุม {stats.dataCoveragePercent}%
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>ยังไม่มีการบันทึก</span>
                </div>
                <div className="text-xl font-extrabold text-amber-900 mt-1 tabular-nums">
                  {pendingCompanies.length} แห่ง
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  รอลงข้อมูลรายวัน
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <div className="text-[11px] text-purple-700 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  <span>ยอดผู้เข้าร่วมสะสม</span>
                </div>
                <div className="text-xl font-extrabold text-purple-900 mt-1 tabular-nums">
                  {stats.totalAttendeesCount.toLocaleString()} คน
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  จาก {records.length} ครั้งที่บันทึก
                </div>
              </div>
            </div>

            {/* Completeness split list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recorded Companies */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>บริษัทที่มีบันทึกแล้ว ({recordedCompanies.length})</span>
                  </span>
                  <span className="text-emerald-700 font-normal">สถานะ: ครบถ้วน</span>
                </div>
                <div className="p-3 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {recordedCompanies.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">ยังไม่มีบริษัทที่บันทึก</div>
                  ) : (
                    recordedCompanies.map((c) => (
                      <div key={c.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{c.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({c.type === 'internal' ? 'ในพื้นที่' : 'นอกพื้นที่'})
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700 tabular-nums">
                          {c.totalAttendees} คน
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Companies */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>บริษัทที่ยังไม่ได้บันทึก ({pendingCompanies.length})</span>
                  </span>
                  <span className="text-amber-700 font-normal">รอข้อมูล</span>
                </div>
                <div className="p-3 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {pendingCompanies.length === 0 ? (
                    <div className="py-6 text-center text-emerald-600 font-semibold">
                      🎉 บันทึกครบทุกบริษัท 100% แล้ว!
                    </div>
                  ) : (
                    pendingCompanies.map((c) => (
                      <div key={c.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-700">{c.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({c.type === 'internal' ? 'ในพื้นที่' : 'นอกพื้นที่'})
                          </span>
                        </div>
                        <span className="text-slate-400 tabular-nums">0 คน</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manage All Records (Full CRUD) */}
        {activeTab === 'records' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>วันที่:</span>
                  <select
                    value={recordFilterDate}
                    onChange={(e) => setRecordFilterDate(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="all">ทุกวันที่ ({activeDateOptions.length} วัน)</option>
                    {activeDateOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="ค้นหาบริษัท, หัวข้อ, จป...."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium shrink-0">
                พบ {filteredRecords.length} จาก {records.length} รายการ
              </div>
            </div>

            {/* Records Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-24">วันที่</th>
                      <th className="py-2.5 px-4">บริษัท / หจก.</th>
                      <th className="py-2.5 px-3 text-center w-28">ประเภท</th>
                      <th className="py-2.5 px-3 text-right w-20">คนจริง</th>
                      <th className="py-2.5 px-4">หัวข้อความปลอดภัย</th>
                      <th className="py-2.5 px-3 text-center w-28">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {records.length === 0
                            ? 'ยังไม่มีรายการบันทึกในระบบ'
                            : 'ไม่พบรายการที่ตรงกับตัวกรอง'}
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => {
                        const isInternal = r.companyType === 'internal';
                        const isLocked = isRecordLocked(r, lockedDates, unlockedDates, currentDate);
                        return (
                          <tr
                            key={r.id}
                            className={`transition-colors ${
                              isLocked ? 'bg-slate-50/70 hover:bg-slate-100/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{r.date}</span>
                                {isLocked && (
                                  <span className="inline-flex items-center text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-bold" title="ข้อมูลล็อคแล้ว">
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-4 font-bold text-slate-900">
                              {r.companyName}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  isInternal
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">
                              +{r.attendees}
                            </td>
                            <td className="py-2 px-4 text-slate-600 truncate max-w-xs" title={r.safetyTopic}>
                              {r.safetyTopic || '-'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onRequestUnlock) onRequestUnlock(r.date);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-600 bg-slate-200/90 hover:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                                  title="รายการนี้ล็อคแล้ว (คลิกเพื่อปลดล็อคด้วย PIN)"
                                >
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>ล็อค</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onEditRecord(r);
                                    }}
                                    className="p-1 rounded text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                                    title="แก้ไขรายการนี้"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteRecord(r);
                                    }}
                                    className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="ลบรายการนี้"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Project Period & Settings (ตั้งค่าระยะเวลาโครงการ) */}
        {activeTab === 'project' && (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Header info banner */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    ตั้งค่าระยะเวลาและข้อมูลโครงการ (Project Period & Settings)
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                    อิสระข้ามเดือน/ข้ามปี
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  กำหนดวันเริ่มต้นและวันสิ้นสุดของโครงการได้อย่างอิสระตามความต้องการ สามารถใช้งานข้ามเดือนและข้ามปีได้ต่อเนื่อง
                  ระบบจะบันทึกลงฐานข้อมูลถาวร ซิงค์ไปยังทุกอุปกรณ์และลิงก์ Publish โดยอัตโนมัติ
                </p>
              </div>
            </div>

            {/* Zero Data Loss Guarantee Badge */}
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900 leading-snug">
                <strong>🔒 รับประกันความปลอดภัยของข้อมูล 100%:</strong> การเปลี่ยนระยะเวลาโครงการจะไม่ลบหรือเปลี่ยนแปลงข้อมูลเดิม
                คู่ธุรกิจทั้ง <strong>{companies.length} แห่ง</strong> และประวัติบันทึก <strong>{records.length} รายการ</strong> (ยอดสะสม {stats.totalAttendeesCount.toLocaleString()} คน) ยังคงอยู่ครบถ้วนสมบูรณ์เสมอ
              </div>
            </div>

            {configFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
                  configFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {configFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="flex-1">{configFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setConfigFeedback(null)}
                  className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Form Container */}
            <form onSubmit={handleSaveProjectConfig} className="space-y-4">
              {/* Presets */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>เทมเพลตช่วงเวลาด่วน (Quick Presets):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePresetShutdown2026}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    🏭 16–31 ต.ค. 2026 (Major Shutdown)
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetCurrentMonth}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    📅 ทั้งเดือนปัจจุบัน (1 ถึงสิ้นเดือน)
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetNextMonth}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    📆 เดือนถัดไป
                  </button>
                  <button
                    type="button"
                    onClick={handlePresetYear2027}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    🚀 ประจำปี 2027 (Turnaround)
                  </button>
                </div>
              </div>

              {/* Main Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <span>ข้อมูลและชื่อโครงการ</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ชื่อโครงการ (Project Name)
                    </label>
                    <input
                      type="text"
                      value={cfgName}
                      onChange={(e) => setCfgName(e.target.value)}
                      placeholder="เช่น โครงการ PPPC Major Shutdown 2026"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      คำบรรยายย่อย (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={cfgSubtitle}
                      onChange={(e) => setCfgSubtitle(e.target.value)}
                      placeholder="เช่น รายงานสรุปความปลอดภัยประจำวัน OHS"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สถานที่ปฏิบัติงาน (Location)
                    </label>
                    <input
                      type="text"
                      value={cfgLocation}
                      onChange={(e) => setCfgLocation(e.target.value)}
                      placeholder="เช่น ขอนแก่น"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Date Inputs */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>กำหนดช่วงเวลาโครงการ</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        วันเริ่มต้น (Start Date) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={cfgStartDate}
                        onChange={(e) => setCfgStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        วันสิ้นสุด (End Date) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={cfgEndDate}
                        onChange={(e) => setCfgEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>วันปฏิบัติการปัจจุบันเริ่มต้น (Default Operating Date)</span>
                      <span className="text-[10px] text-slate-400 font-normal">ใช้อ้างอิงเปิดหน้าแรก</span>
                    </label>
                    <input
                      type="date"
                      value={cfgOperatingDate}
                      onChange={(e) => setCfgOperatingDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Summary preview */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="text-slate-500">
                      ระยะเวลารวม:{' '}
                      <strong className="text-indigo-700 font-bold">
                        {formatProjectPeriod(cfgStartDate, cfgEndDate)}
                      </strong>
                    </div>
                    <div className="text-slate-500">
                      จำนวนวันปฏิบัติงาน:{' '}
                      <strong className="text-slate-900 font-bold">
                        {getDatesBetween(cfgStartDate, cfgEndDate).length} วัน
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (projectConfig) {
                      setCfgName(projectConfig.projectName || '');
                      setCfgSubtitle(projectConfig.projectSubtitle || '');
                      setCfgLocation(projectConfig.location || '');
                      setCfgStartDate(projectConfig.startDate || '2026-10-16');
                      setCfgEndDate(projectConfig.endDate || '2026-10-31');
                      setCfgOperatingDate(projectConfig.operatingDate || '2026-10-22');
                    }
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  คืนค่าเดิม
                </button>

                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingConfig ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่าโครงการ (ถาวร)'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: System Data & Operations */}
        {activeTab === 'system' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Status alerts */}
            {restoreSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <span>{restoreSuccess}</span>
                </div>
                <button
                  onClick={() => setRestoreSuccess(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {restoreError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-900 flex items-center gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="flex-1">
                  <span>{restoreError}</span>
                </div>
                <button
                  onClick={() => setRestoreError(null)}
                  className="text-rose-700 hover:text-rose-900 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 0. ระบบล็อคข้อมูลรายวัน (Daily Lock Management) */}
              <div className="p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 md:col-span-2 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span>ระบบล็อคข้อมูลรายวัน (Daily Lock Management)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    🔒 นโยบายความปลอดภัย OHS
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>กฎการล็อคอัตโนมัติ:</strong> รายการบันทึกของวันที่ผ่านไปแล้วจะถูกล็อคอัตโนมัติ ปิดปุ่มแก้ไขและลบเพื่อรักษาความถูกต้องของข้อมูล เฉพาะวันปัจจุบันเท่านั้นที่สามารถแก้ไขได้ Admin สามารถกดล็อควันปัจจุบันล่วงหน้า หรือปลดล็อควันที่ต้องการแก้ไขย้อนหลังได้จากตารางนี้
                </p>

                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>สถานะล็อครายวันตามปฏิทินโครงการ ({activeDateOptions.length} วัน):</span>
                    <span className="text-[10px] font-normal text-slate-500">วันปัจจุบัน: {currentDate || '2026-10-22'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {activeDateOptions.map((dateObj) => {
                      const isLocked = isDateLocked(dateObj.value, lockedDates, unlockedDates, currentDate);
                      return (
                        <div
                          key={dateObj.value}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col justify-between ${
                            isLocked
                              ? 'bg-slate-100/90 border-slate-300 text-slate-700'
                              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{dateObj.short}</div>
                          <div className="my-1.5">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                <Lock className="w-2.5 h-2.5" /> ล็อคแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-800">
                                🟢 แก้ไขได้
                              </span>
                            )}
                          </div>
                          {onToggleDateLock && (
                            <button
                              type="button"
                              onClick={() => onToggleDateLock(dateObj.value, !isLocked)}
                              className={`w-full py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                isLocked
                                  ? 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                              }`}
                            >
                              {isLocked ? '🔓 ปลดล็อค' : '🔒 ล็อค'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 1. กู้คืนข้อมูล (Restore Backup Card) - Highlighted */}
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 md:col-span-2 space-y-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span>กู้คืนข้อมูลจากไฟล์ (Restore Backup)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                    เฉพาะ Super Admin
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  นำเข้าไฟล์สำรอง (รองรับ <strong>.xlsx</strong>, <strong>.csv</strong>, หรือ <strong>.json</strong>) เพื่อกู้คืนข้อมูล Morning Talk ทั้งหมดกลับคืนสู่ฐานข้อมูล โดยระบบจะอ่านและแสดงผลสรุปยอดเพื่อให้ตรวจสอบก่อนยืนยัน
                </p>

                <div className="pt-1 flex items-center gap-3 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isParsing ? 'กำลังอ่านและตรวจสอบไฟล์...' : '📤 กู้คืนข้อมูลจากไฟล์ (Excel / CSV / JSON)'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    ✓ ป้องกันข้อมูลสูญหาย สามารถใช้ไฟล์สำรองที่ส่งออกจากแถบด้านบนได้ทันที
                  </span>
                </div>
              </div>

              {/* 2. Export / Backup */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>ส่งออกข้อมูล (Export Data)</span>
                </div>
                <p className="text-xs text-slate-500">
                  ดาวน์โหลดข้อมูลบันทึกทั้งหมด รองรับภาษาไทยใน Microsoft Excel และไฟล์ JSON สำรอง
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onExportCSV}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ส่งออก Excel / CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={onExportJSON}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>สำรองไฟล์ JSON</span>
                  </button>
                </div>
              </div>

              {/* 3. Sample Data Tool */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>โหลดข้อมูลตัวอย่าง (Sample Dataset)</span>
                </div>
                <p className="text-xs text-amber-800">
                  จำลองยอด Morning Talk ช่วง 16–21 ต.ค. 2026 ให้ทั้ง 37 บริษัท เพื่อดูการแสดงผลกราฟและ KPI ทันที
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>โหลดข้อมูลตัวอย่างเดี๋ยวนี้</span>
                  </button>
                </div>
              </div>

              {/* 4. Reset to Zero */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>รีเซ็ทศูนย์ (Reset to Zero)</span>
                </div>
                <p className="text-xs text-slate-500">
                  ล้างยอดจำนวนคนทั้งหมดเป็น 0 คน และล้างประวัติบันทึก โดยรายชื่อบริษัทยังคงอยู่ครบถ้วน
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onResetToZero}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>รีเซ็ทจำนวนคนเป็น 0</span>
                  </button>
                </div>
              </div>

              {/* 5. Factory Reset */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>ล้างข้อมูลระบบทั้งหมด (Factory Reset)</span>
                </div>
                <p className="text-xs text-rose-800">
                  คืนค่าเริ่มต้น 37 บริษัทเดิมของ PPPC ขอนแก่น และล้างบริษัทใหม่ที่เพิ่มออกทั้งหมด
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onFactoryReset}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>ล้างคืนค่าเริ่มต้นโรงงาน</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Role & System Info */}
        {activeTab === 'role' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">ข้อมูลผู้ใช้งานระบบ OHS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">ผู้ดูแลระบบ:</span> Safety Supervisor PPPC
                </div>
                <div>
                  <span className="font-semibold text-slate-800">ตำแหน่ง:</span> จป.วิชาชีพ ประจำโครงการ
                </div>
                <div>
                  <span className="font-semibold text-slate-800">หน่วยงาน:</span> ฝ่ายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม
                </div>
                <div>
                  <span className="font-semibold text-slate-800">โรงงาน:</span> PPPC ขอนแก่น (SCGP)
                </div>
                <div>
                  <span className="font-semibold text-slate-800">โครงการ:</span> Major Shutdown 2026 (16–31 ต.ค.)
                </div>
                <div>
                  <span className="font-semibold text-slate-800">สิทธิ์:</span> Super Admin (CRUD ข้อมูล, มาสเตอร์ลิสต์, กราฟ)
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="font-bold text-sm">การเชื่อมโยงข้อมูล &amp; การจัดเก็บ (Single Source of Truth)</div>
              <p className="leading-relaxed">
                ระบบจัดเก็บข้อมูลลงใน LocalStorage (คีย์: <code>mt_dash_v1</code>) เชื่อมโยงข้อมูลสองทางแบบ Real-time: ทุกการเพิ่ม แก้ไข หรือลบรายการบันทึกจะคำนวณยอดสะสมของบริษัทนั้น ๆ ใหม่ทันที และส่งผลต่อไปยัง KPI Cards, กราฟแท่งแนวตั้ง 2 ชุด, ตารางมาสเตอร์ และระบบพิมพ์รายงานอย่างแม่นยำ 100%
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ระบบความปลอดภัย PPPC พร้อมทำงาน (Zero Accident Target)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* Restore Confirmation Dialog Modal */}
        {restoreResult && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ยืนยันการกู้คืนข้อมูล (Restore Backup)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบความถูกต้องของข้อมูลจากไฟล์สำรองก่อนนำเข้าสู่ระบบ
                  </p>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">รายการบันทึกทั้งหมด</div>
                  <div className="text-lg font-black text-indigo-700 tabular-nums">
                    {restoreResult.summary.totalRecords.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-600">รายการ</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">ยอดคนเข้าร่วมรวม</div>
                  <div className="text-lg font-black text-emerald-700 tabular-nums">
                    {restoreResult.summary.totalAttendees.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-600">คน</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">บริษัทคู่ธุรกิจ</div>
                  <div className="text-lg font-black text-slate-800 tabular-nums">
                    {restoreResult.summary.companiesCount}{' '}
                    <span className="text-xs font-normal text-slate-600">แห่ง</span>
                  </div>
                  {restoreResult.newCompanies.length > 0 && (
                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                      + คู่ธุรกิจใหม่ {restoreResult.newCompanies.length} แห่ง
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">ช่วงวันที่ข้อมูล</div>
                  <div className="text-xs font-bold text-slate-800 mt-1 leading-tight">
                    {restoreResult.summary.dateSpan}
                  </div>
                </div>
              </div>

              {/* Restore Mode Selector */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-700">รูปแบบการกู้คืนข้อมูล:</div>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    restoreMode === 'replace'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreMode === 'replace'}
                    onChange={() => setRestoreMode('replace')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-900">
                      แทนที่ข้อมูลเดิมทั้งหมด (Replace All) — <span className="text-indigo-700">แนะนำ</span>
                    </div>
                    <div className="text-slate-500">
                      ล้างประวัติบันทึกเดิมและนำเข้าเฉพาะข้อมูลจากไฟล์สำรองนี้ เพื่อให้ตรงกับไฟล์สำรอง 100%
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    restoreMode === 'append'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="append"
                    checked={restoreMode === 'append'}
                    onChange={() => setRestoreMode('append')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-900">ผสานข้อมูลเดิม (Merge / Append)</div>
                    <div className="text-slate-500">
                      เก็บข้อมูลเดิมไว้ และเพิ่มข้อมูลจากไฟล์สำรอง (หากวันและบริษัทตรงกันจะอัปเดตข้อมูล)
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestoreResult(null)}
                  className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันกู้คืนข้อมูลเดี๋ยวนี้</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
