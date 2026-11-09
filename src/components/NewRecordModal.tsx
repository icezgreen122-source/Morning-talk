import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Calendar, Building2, Users, Target, Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Company, CompanyType, AttendanceRecord, DateOption } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { SAFETY_TOPICS } from '../data/sampleData';
import { isSameDate, toCanonicalDate } from '../utils/dateUtils';

interface NewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  records: AttendanceRecord[];
  onSaveRecord: (payload: {
    date: string;
    companyName: string;
    companyType: CompanyType;
    attendees: number;
    targetWorkers?: number;
    safetyTopic?: string;
    supervisorName?: string;
    notes?: string;
  }) => { success: boolean; message: string; isNewCompany: boolean };
  currentDate?: string;
  onDateChange?: (date: string) => void;
  availableDates?: DateOption[];
}

export const NewRecordModal: React.FC<NewRecordModalProps> = ({
  isOpen,
  onClose,
  companies,
  records,
  onSaveRecord,
  currentDate = '2026-10-22',
  onDateChange,
  availableDates,
}) => {
  const activeDateOptions = availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES;
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [companyInput, setCompanyInput] = useState<string>('');
  const [companyType, setCompanyType] = useState<CompanyType>('internal');
  const [attendees, setAttendees] = useState<number>(12);
  const [targetWorkers, setTargetWorkers] = useState<number>(15);
  const [supervisorName, setSupervisorName] = useState<string>('จป.วิชาชีพ สมชาย (OHS PPPC)');
  const [safetyTopic, setSafetyTopic] = useState<string>(SAFETY_TOPICS[0]);
  const [notes, setNotes] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentDate) {
      setSelectedDate(currentDate);
    }
  }, [isOpen, currentDate]);

  // Auto-detect existing company and sync its category
  useEffect(() => {
    const trimmed = companyInput.trim().toLowerCase();
    if (!trimmed) return;
    const match = companies.find((c) => c.name.toLowerCase() === trimmed);
    if (match) {
      setCompanyType(match.type);
    }
  }, [companyInput, companies]);

  if (!isOpen) return null;

  const isExistingCompany = companies.some(
    (c) => c.name.toLowerCase() === companyInput.trim().toLowerCase()
  );

  // Check if this company already has an entry on this date
  const hasExistingEntryOnDate = records.some(
    (r) =>
      isSameDate(r.date, selectedDate) &&
      r.companyName.toLowerCase() === companyInput.trim().toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const trimmedCompany = companyInput.trim();
    if (!trimmedCompany) {
      setErrorText('กรุณาระบุหรือเลือกชื่อบริษัท/หจก. คู่ธุรกิจ');
      return;
    }

    if (attendees < 1) {
      setErrorText('จำนวนผู้เข้าร่วมต้องมากกว่าหรือเท่ากับ 1 คน');
      return;
    }

    const canonDate = toCanonicalDate(selectedDate);

    const result = onSaveRecord({
      date: canonDate,
      companyName: trimmedCompany,
      companyType,
      attendees,
      targetWorkers: targetWorkers > 0 ? targetWorkers : attendees,
      safetyTopic: safetyTopic.trim() || undefined,
      supervisorName: supervisorName.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      // Trigger date change on parent dashboard so views switch immediately to recorded date
      if (onDateChange) {
        onDateChange(canonDate);
      }
      // Clear inputs for next time and close
      setCompanyInput('');
      setNotes('');
      onClose();
    } else {
      setErrorText(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <PlusCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">บันทึกข้อมูลการเข้าร่วม Morning Talk ใหม่</h2>
              <p className="text-xs text-slate-300">
                โครงการ Major Shutdown 2026 PPPC ขอนแก่น (16–31 ตุลาคม 2026)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorText && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorText}</span>
            </div>
          )}

          {hasExistingEntryOnDate && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>แจ้งเตือน:</strong> บริษัท &quot;{companyInput}&quot; มีบันทึกในวันที่เลือกแล้ว การบันทึกครั้งนี้จะบวกสะสมเพิ่มเติมในระบบ
              </span>
            </div>
          )}

          {/* Datalist for Auto-suggest */}
          <datalist id="new-record-companies-datalist">
            {companies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.type === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'} (สะสมปัจจุบัน: {c.totalAttendees} คน)
              </option>
            ))}
          </datalist>

          {/* Row 1: วันที่ & บริษัท */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* วันที่ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>วันที่ปฏิบัติงาน</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">เลือกจากลิสต์หรือพิมพ์ปฏิทิน</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                >
                  {activeDateOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                  {!activeDateOptions.some((d) => d.value === selectedDate) && (
                    <option value={selectedDate}>{selectedDate} (กำหนดเอง)</option>
                  )}
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="w-10 h-9 p-1 border border-slate-300 rounded-xl bg-slate-50 hover:bg-white cursor-pointer text-xs"
                  title="เปิดปฏิทินเลือกวันใดก็ได้ (ย้อนหลังหรืออนาคต)"
                />
              </div>
            </div>

            {/* บริษัท / หจก. */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>บริษัท / หจก. คู่ธุรกิจ</span>
                  <span className="text-rose-500">*</span>
                </label>
                {companyInput.trim() && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isExistingCompany
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {isExistingCompany ? '✓ ในมาสเตอร์ลิสต์' : '+ จะ ADD บริษัทใหม่'}
                  </span>
                )}
              </div>
              <input
                type="text"
                list="new-record-companies-datalist"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="พิมพ์ชื่อหรือเลือกจากรายชื่อ 37 แห่ง..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Row 2: ประเภท & จำนวนคน */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ประเภทคู่ธุรกิจ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span>ประเภทคู่ธุรกิจ</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompanyType('internal')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    companyType === 'internal'
                      ? 'bg-[#10b981] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ภายในพื้นที่
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyType('external')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    companyType === 'external'
                      ? 'bg-[#2563ab] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  นอกพื้นที่
                </button>
              </div>
            </div>

            {/* จำนวนผู้เข้าร่วมจริง */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>ยอดเข้าร่วมจริง (คน)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setAttendees((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-l-xl border border-r-0 border-slate-300 text-sm font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={attendees}
                  onChange={(e) => setAttendees(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full text-center py-2 text-sm font-bold bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setAttendees((prev) => prev + 1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-r-xl border border-l-0 border-slate-300 text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* ยอดเป้าหมายตามแผน */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>เป้าหมายตามแผน (คน)</span>
              </label>
              <input
                type="number"
                min="1"
                value={targetWorkers}
                onChange={(e) => setTargetWorkers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: หัวข้อความปลอดภัย Morning Talk */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>หัวข้อความปลอดภัยที่สื่อสาร (Safety Topic)</span>
            </label>
            <select
              value={safetyTopic}
              onChange={(e) => setSafetyTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              {SAFETY_TOPICS.map((topic, i) => (
                <option key={i} value={topic}>
                  {topic}
                </option>
              ))}
              <option value="กำหนดเอง">-- ระบุหัวข้ออื่น ๆ เอง --</option>
            </select>
            {safetyTopic === 'กำหนดเอง' && (
              <input
                type="text"
                placeholder="พิมพ์หัวข้อความปลอดภัย..."
                onChange={(e) => setSafetyTopic(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Row 4: จป. ผู้บันทึก & หมายเหตุ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>จป.วิชาชีพ / ผู้ควบคุมงาน</span>
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="ชื่อ-นามสกุล จป. ผู้ควบคุมงาน"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>หมายเหตุ / ข้อสังเกตความปลอดภัย</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ตรวจ PPE 100%, ทำงานบนที่สูง ฯลฯ"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
