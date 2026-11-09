import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Layers,
  CheckCircle2,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { DateOption, ProjectConfig } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { isSameDate, toThaiDateShort, toThaiDateLabel, toCanonicalDate } from '../utils/dateUtils';

interface DateFilterBarProps {
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  viewMode: 'daily' | 'cumulative';
  onViewModeChange: (mode: 'daily' | 'cumulative') => void;
  dailyRecordsCount: number;
  dailyAttendeesCount: number;
  cumulativeAttendeesCount: number;
  availableDates?: DateOption[];
  projectConfig?: ProjectConfig;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  dailyRecordsCount,
  dailyAttendeesCount,
  cumulativeAttendeesCount,
  availableDates,
  projectConfig,
}) => {
  const datesList = availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES;

  // Ensure selectedDate is always present in dropdown options
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

  const currentIndex = fullDates.findIndex((d) => isSameDate(d.value, selectedDate));
  const currentItem = fullDates[currentIndex] || {
    value: selectedDate,
    label: toThaiDateLabel(selectedDate),
    short: toThaiDateShort(selectedDate),
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onDateChange(fullDates[currentIndex - 1].value);
    }
  };

  const handleNext = () => {
    if (currentIndex < fullDates.length - 1) {
      onDateChange(fullDates[currentIndex + 1].value);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Date Selection Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0c2340] text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                ตัวกรองวันที่หลักของแดชบอร์ด
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                เลือกวันที่ต้องการดูข้อมูล
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-200 hidden sm:block mx-1" />

          {/* Date Dropdown & Stepper */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 py-1 px-2 focus:outline-none cursor-pointer max-w-[210px] sm:max-w-[280px] truncate"
            >
              {fullDates.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= fullDates.length - 1}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="วันถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Free Calendar Date Picker (Can pick any date across months and years!) */}
          <div className="relative flex items-center">
            <input
              type="date"
              id="date-filter-calendar-picker"
              value={toCanonicalDate(selectedDate)}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="เลือกวันที่จากปฏิทินแบบอิสระ"
            />
            <label
              htmlFor="date-filter-calendar-picker"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">เลือกจากปฏิทิน</span>
            </label>
          </div>

          {/* Daily Status Badge */}
          {dailyRecordsCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                มีข้อมูล {dailyRecordsCount} รายการ ({dailyAttendeesCount.toLocaleString()} คน)
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>ยังไม่มีข้อมูลสำหรับวันนี้</span>
            </span>
          )}
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline whitespace-nowrap">
            มุมมองการแสดงผล:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onViewModeChange('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'daily'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 shrink-0" />
              <span>เฉพาะรายวัน ({currentItem.short})</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('cumulative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'cumulative'
                  ? 'bg-[#0c2340] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>
                สะสมทั้งโครงการ ({cumulativeAttendeesCount.toLocaleString()} คน)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
