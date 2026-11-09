import React, { useState, useEffect } from 'react';
import { SHUTDOWN_DATES } from '../data/initialData';
import { Company, CompanyType, DateOption, ProjectConfig } from '../types';
import { PlusCircle, CheckCircle2, AlertCircle, Building2, Calendar, Users, Layers, CalendarDays } from 'lucide-react';
import { isSameDate, toCanonicalDate, toThaiDateLabel, toThaiDateShort } from '../utils/dateUtils';

interface RecordFormProps {
  companies: Company[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  prefilledCompany?: Company | null;
  onClearPrefill?: () => void;
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
  availableDates?: DateOption[];
  projectConfig?: ProjectConfig;
}

export const RecordForm: React.FC<RecordFormProps> = ({
  companies,
  selectedDate,
  onDateChange,
  prefilledCompany,
  onClearPrefill,
  onSaveRecord,
  availableDates,
  projectConfig,
}) => {
  const [companyInput, setCompanyInput] = useState<string>('');
  const [companyType, setCompanyType] = useState<CompanyType>('internal');
  const [attendeesInput, setAttendeesInput] = useState<string>('10');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Handle prefilled company from Quick Record button in MasterTable
  useEffect(() => {
    if (prefilledCompany) {
      setCompanyInput(prefilledCompany.name);
      setCompanyType(prefilledCompany.type);
      setFeedback({ type: null, message: '' });
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefilledCompany, onClearPrefill]);

  // Auto-detect company type if company name matches existing list
  useEffect(() => {
    const trimmed = companyInput.trim().toLowerCase();
    if (!trimmed) return;
    const match = companies.find((c) => c.name.toLowerCase() === trimmed);
    if (match) {
      setCompanyType(match.type);
    }
  }, [companyInput, companies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = companyInput.trim();
    const count = parseInt(attendeesInput, 10);

    if (!trimmedName) {
      setFeedback({
        type: 'error',
        message: 'กรุณากรอกหรือเลือกชื่อบริษัท/หจก. คู่ธุรกิจ',
      });
      return;
    }

    if (isNaN(count) || count < 1) {
      setFeedback({
        type: 'error',
        message: 'กรุณาระบุจำนวนผู้เข้าร่วมเป็นตัวเลขอย่างน้อย 1 คน',
      });
      return;
    }

    const canonDate = toCanonicalDate(selectedDate);

    const result = onSaveRecord({
      date: canonDate,
      companyName: trimmedName,
      companyType,
      attendees: count,
    });

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `✓ บันทึกเรียบร้อยแล้ว: ข้อมูล Morning Talk "${trimmedName}" (${count} คน) ประจำวันที่ ${selectedDateObj.label} บันทึกและแสดงผลบนหน้าจอทันที`,
      });
      // Reset inputs for next entry
      setCompanyInput('');
      setAttendeesInput('10');
    } else {
      setFeedback({
        type: 'error',
        message: result.message,
      });
    }
  };

  const isExistingCompany = companies.some(
    (c) => c.name.toLowerCase() === companyInput.trim().toLowerCase()
  );

  const datesList = availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES;
  const hasSelectedDate = datesList.some((d) => isSameDate(d.value, selectedDate));
  const fullDates = hasSelectedDate
    ? datesList
    : [
        {
          value: toCanonicalDate(selectedDate),
          label: `${toThaiDateLabel(selectedDate)} [เลือกอิสระ]`,
          short: toThaiDateShort(selectedDate),
        },
        ...datesList,
      ].sort((a, b) => a.value.localeCompare(b.value));

  const selectedDateObj = fullDates.find((d) => isSameDate(d.value, selectedDate)) || {
    value: selectedDate,
    label: toThaiDateLabel(selectedDate),
    short: toThaiDateShort(selectedDate),
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-[#10b981] p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-slate-100 gap-2 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
            <PlusCircle className="w-5 h-5 text-[#10b981] shrink-0" />
            <span>ฟอร์มบันทึกข้อมูลการเข้าร่วม Morning Talk รายวัน</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 [word-break:keep-all] [line-break:strict]">
            <span>{projectConfig?.projectName || 'โครงการ Major Shutdown'} </span>
            <span className="whitespace-nowrap">ประจำวันที่ <strong className="text-slate-800 font-bold">{selectedDateObj.label}</strong></span>
          </p>
        </div>

        <div className="text-xs flex items-center gap-2 shrink-0">
          {companyInput.trim() && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
                isExistingCompany
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isExistingCompany ? '✓ มีในมาสเตอร์ลิสต์' : '+ จะ ADD เป็นบริษัทใหม่'}
            </span>
          )}
        </div>
      </div>

      {/* Datalist for Auto-suggest */}
      <datalist id="companies-master-datalist">
        {companies.map((c) => (
          <option key={c.id} value={c.name}>
            {c.type === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'} (สะสมโครงการ: {c.cumulativeAttendees ?? c.totalAttendees} คน)
          </option>
        ))}
      </datalist>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Field 1: วันที่ (เชื่อมต่อกับ State กลางของทั้งแดชบอร์ด) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>วันที่บันทึก</span>
              <span className="text-rose-500">*</span>
              <span className="text-[11px] text-slate-400 font-normal hidden xl:inline">(อัปเดตแดชบอร์ดทันที)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedDate}
                onChange={(e) => {
                  onDateChange(e.target.value);
                  setFeedback({ type: null, message: '' });
                }}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-colors font-medium text-slate-900 cursor-pointer truncate"
                required
              >
                {fullDates.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={toCanonicalDate(selectedDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    onDateChange(e.target.value);
                    setFeedback({ type: null, message: '' });
                  }
                }}
                className="w-10 px-1 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] cursor-pointer text-slate-700 hover:border-slate-400 transition-colors"
                title="เลือกวันที่บันทึกจากปฏิทินอิสระ (รองรับย้อนหลังและอนาคต)"
              />
            </div>
          </div>

          {/* Field 2: ชื่อบริษัท/หจก. */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ชื่อบริษัท / หจก.</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="companies-master-datalist"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="พิมพ์ชื่อหรือเลือกจากลิสต์..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-colors"
              autoComplete="off"
              required
            />
          </div>

          {/* Field 3: ประเภทคู่ธุรกิจ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ประเภทคู่ธุรกิจ</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value as CompanyType)}
              className={`w-full px-3 py-2 text-sm rounded-lg font-medium border focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-colors cursor-pointer ${
                companyType === 'internal'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}
            >
              <option value="internal">ภายในพื้นที่ (สีเขียว)</option>
              <option value="external">นอกพื้นที่ (สีน้ำเงิน)</option>
            </select>
          </div>

          {/* Field 4: จำนวนคน */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5 whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>จำนวนคน (อย่างน้อย 1)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              placeholder="เช่น 10"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-colors tabular-nums"
              required
            />
          </div>
        </div>

        {/* Submit row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
          <div className="text-xs text-slate-500 [word-break:keep-all] [line-break:strict]">
            <span>เมื่อบันทึกแล้ว ข้อมูลจะผูกกับวันที่ </span>
            <strong className="text-slate-800 whitespace-nowrap font-bold">{selectedDateObj.short}</strong>
            <span> และอัปเดต KPI รายวัน + กราฟ + ตารางทันที</span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>+ บันทึกข้อมูล ({selectedDateObj.short})</span>
          </button>
        </div>
      </form>

      {/* Result notification message */}
      {feedback.type && (
        <div
          className={`mt-4 p-3.5 rounded-lg flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border border-rose-200 text-rose-950'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium leading-relaxed">
            {feedback.message}
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
