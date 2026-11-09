import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, Building2, Users, Target, Shield, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AttendanceRecord, CompanyType, DateOption } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { SAFETY_TOPICS } from '../data/sampleData';
import { toCanonicalDate } from '../utils/dateUtils';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onUpdateRecord: (updatedRecord: AttendanceRecord) => void;
  availableDates?: DateOption[];
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onUpdateRecord,
  availableDates,
}) => {
  const activeDateOptions = availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES;
  const [date, setDate] = useState<string>('2026-10-22');
  const [attendees, setAttendees] = useState<number>(1);
  const [targetWorkers, setTargetWorkers] = useState<number>(1);
  const [safetyTopic, setSafetyTopic] = useState<string>('');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [companyType, setCompanyType] = useState<CompanyType>('internal');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setDate(toCanonicalDate(record.date));
      setAttendees(record.attendees);
      setTargetWorkers(record.targetWorkers || record.attendees);
      setSafetyTopic(record.safetyTopic || SAFETY_TOPICS[0]);
      setSupervisorName(record.supervisorName || '');
      setNotes(record.notes || '');
      setCompanyType(record.companyType);
      setErrorText(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (attendees < 1) {
      setErrorText('จำนวนผู้เข้าร่วมต้องมากกว่าหรือเท่ากับ 1 คน');
      return;
    }

    const canonDate = toCanonicalDate(date);

    const updated: AttendanceRecord = {
      ...record,
      date: canonDate,
      attendees,
      targetWorkers: targetWorkers > 0 ? targetWorkers : attendees,
      safetyTopic: safetyTopic.trim() || undefined,
      supervisorName: supervisorName.trim() || undefined,
      notes: notes.trim() || undefined,
      companyType,
    };

    onUpdateRecord(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">แก้ไขข้อมูลการเข้าร่วม Morning Talk</h2>
              <p className="text-xs text-slate-300">
                รหัสรายการ: {record.id} · {record.companyName}
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

          {/* Company Read-only Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-xs text-slate-500">บริษัท / หจก. คู่ธุรกิจ</div>
                <div className="font-bold text-slate-900 text-sm">{record.companyName}</div>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                companyType === 'internal'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {companyType === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}
            </span>
          </div>

          {/* Row 1: วันที่ & ประเภท */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {activeDateOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                  {!activeDateOptions.some((d) => d.value === date) && (
                    <option value={date}>{date} (กำหนดเอง)</option>
                  )}
                </select>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="w-10 h-9 p-1 border border-slate-300 rounded-xl bg-slate-50 hover:bg-white cursor-pointer text-xs"
                  title="เปิดปฏิทินเลือกวันใดก็ได้ (ย้อนหลังหรืออนาคต)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สลับประเภทคู่ธุรกิจ
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
          </div>

          {/* Row 2: ผู้เข้าร่วม & เป้าหมาย */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>ยอดผู้เข้าร่วมจริง (คน)</span>
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
                  className="w-full text-center py-2 text-sm font-bold bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Row 3: หัวข้อความปลอดภัย */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              <span>หัวข้อความปลอดภัย (Safety Topic)</span>
            </label>
            <input
              type="text"
              value={safetyTopic}
              onChange={(e) => setSafetyTopic(e.target.value)}
              placeholder="หัวข้อความปลอดภัย..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Row 4: จป. & หมายเหตุ */}
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
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>หมายเหตุ</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Buttons */}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
