import React from 'react';
import { QuickStats, IncidentRecord } from '../types';
import {
  Users,
  Building,
  Target,
  Layers,
  Calendar,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface KPICardsProps {
  stats: QuickStats;
  viewMode?: 'daily' | 'cumulative';
  selectedDateLabel?: string;
  cumulativeStats?: QuickStats;
  incidents?: IncidentRecord[];
  onOpenAccidentModal?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  stats,
  viewMode = 'daily',
  selectedDateLabel = '16 ต.ค. 2026',
  cumulativeStats,
  incidents = [],
  onOpenAccidentModal,
}) => {
  const isDaily = viewMode === 'daily';
  const incidentCount = incidents.length;
  const latestIncident = incidents.length > 0 ? incidents[0] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. คู่ธุรกิจภายในพื้นที่ (ขีดบนสีเขียว #10b981) */}
      <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-[#10b981] p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#10b981] block whitespace-nowrap">
                คู่ธุรกิจภายในพื้นที่
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5 [word-break:keep-all] [line-break:strict]">
                {isDaily ? (
                  <>
                    <span className="whitespace-nowrap">ยอดประจำวัน</span>{' '}
                    <span className="whitespace-nowrap">({selectedDateLabel})</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">ยอดสะสมรวมทั้งโครงการ</span>
                )}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#10b981] shrink-0">
              <Building className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums my-1 whitespace-nowrap">
            {stats.internalAttendeesCount.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1.5 whitespace-nowrap">
              {isDaily ? 'คนวันนี้' : 'คนสะสม'}
            </span>
          </div>

          <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
            บริษัทที่มีคนเข้าร่วม:{' '}
            <strong className="text-slate-800 tabular-nums font-bold">
              {stats.internalCompaniesWithAttendees}
            </strong>{' '}
            แห่ง
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="whitespace-nowrap">สัดส่วนในกลุ่มผู้เข้าวันนี้</span>
            <span className="font-bold text-[#10b981] tabular-nums whitespace-nowrap">
              {stats.internalSharePercent}%
            </span>
          </div>
          {isDaily && cumulativeStats && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 gap-1">
              <span className="whitespace-nowrap">สะสมรวมทั้งโครงการ</span>
              <span className="font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                {cumulativeStats.internalAttendeesCount.toLocaleString()} คน
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. คู่ธุรกิจนอกพื้นที่ (ขีดบนสีน้ำเงิน #2563ab) */}
      <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-[#2563ab] p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563ab] block whitespace-nowrap">
                คู่ธุรกิจนอกพื้นที่
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5 [word-break:keep-all] [line-break:strict]">
                {isDaily ? (
                  <>
                    <span className="whitespace-nowrap">ยอดประจำวัน</span>{' '}
                    <span className="whitespace-nowrap">({selectedDateLabel})</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">ยอดสะสมรวมทั้งโครงการ</span>
                )}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563ab] shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums my-1 whitespace-nowrap">
            {stats.externalAttendeesCount.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1.5 whitespace-nowrap">
              {isDaily ? 'คนวันนี้' : 'คนสะสม'}
            </span>
          </div>

          <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
            บริษัทที่มีคนเข้าร่วม:{' '}
            <strong className="text-slate-800 tabular-nums font-bold">
              {stats.externalCompaniesWithAttendees}
            </strong>{' '}
            แห่ง
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="whitespace-nowrap">สัดส่วนในกลุ่มผู้เข้าวันนี้</span>
            <span className="font-bold text-[#2563ab] tabular-nums whitespace-nowrap">
              {stats.externalSharePercent}%
            </span>
          </div>
          {isDaily && cumulativeStats && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 gap-1">
              <span className="whitespace-nowrap">สะสมรวมทั้งโครงการ</span>
              <span className="font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                {cumulativeStats.externalAttendeesCount.toLocaleString()} คน
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. รวมผู้เข้าร่วมทั้งหมด (ขีดบนสีกรมท่า #0c2340) */}
      <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-[#0c2340] p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0c2340] block whitespace-nowrap">
                รวมผู้เข้าร่วมทั้งหมด
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5 [word-break:keep-all] [line-break:strict]">
                {isDaily ? (
                  <>
                    <span className="whitespace-nowrap">ยอดประจำวัน</span>{' '}
                    <span className="whitespace-nowrap">({selectedDateLabel})</span>
                  </>
                ) : (
                  <span className="whitespace-nowrap">ยอดสะสมรวมทั้งโครงการ</span>
                )}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#0c2340] shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-[#0c2340] tabular-nums my-1 whitespace-nowrap">
            {stats.totalAttendeesCount.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1.5 whitespace-nowrap">
              {isDaily ? 'คนวันนี้' : 'คนสะสม'}
            </span>
          </div>

          <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
            คู่ธุรกิจที่บันทึกแล้ว:{' '}
            <strong className="text-slate-800 tabular-nums font-bold">
              {stats.participatingCompaniesCount}
            </strong>{' '}
            / {stats.totalCompaniesCount} แห่ง
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between text-slate-500 gap-1">
            <span className="whitespace-nowrap">เฉลี่ยต่อบริษัทที่เข้า</span>
            <span className="font-bold text-[#0c2340] tabular-nums whitespace-nowrap">
              {stats.avgAttendeesPerCompany} คน/แห่ง
            </span>
          </div>
          {isDaily && cumulativeStats && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 gap-1">
              <span className="whitespace-nowrap">สะสมรวมทั้งโครงการ</span>
              <span className="font-semibold text-slate-600 tabular-nums whitespace-nowrap text-[10px] sm:text-[11px]">
                {cumulativeStats.totalAttendeesCount.toLocaleString()} คน ({cumulativeStats.participatingCompaniesCount} แห่ง)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. สรุปจำนวนอุบัติเหตุ (ขีดบนสีแดง #ef4444 หรือ เขียว #10b981) */}
      <div
        className={`bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between ${
          incidentCount === 0 ? 'border-t-[#10b981]' : 'border-t-[#ef4444]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5 gap-2">
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider block whitespace-nowrap ${
                  incidentCount === 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                สรุปจำนวนอุบัติเหตุ
              </span>
              <span className="text-[10px] text-slate-400 font-medium block whitespace-nowrap">
                อุบัติเหตุทั้งหมด
              </span>
            </div>
            {/* Edit / Record button ✏️ at top right */}
            {onOpenAccidentModal && (
              <button
                type="button"
                onClick={onOpenAccidentModal}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                title="บันทึกหรือแก้ไขรายการอุบัติเหตุ"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-baseline gap-2 my-1 whitespace-nowrap">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
                incidentCount === 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {incidentCount}
            </span>
            <span className="text-xs font-normal text-slate-500 whitespace-nowrap">
              รายการ
            </span>
          </div>

          <div className="text-xs text-slate-500 mt-1">
            {incidentCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ไม่มีเหตุการณ์เกิดขึ้น</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold whitespace-nowrap truncate max-w-full">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>ล่าสุด: {latestIncident?.date} ({latestIncident?.typeName})</span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
            <span className="text-slate-500 whitespace-nowrap">สถานะความปลอดภัย:</span>
            {incidentCount === 0 ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200 flex items-center gap-1 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>✓ Zero Accident 100%</span>
              </span>
            ) : (
              <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-200 flex items-center gap-1 whitespace-nowrap">
                <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                <span>⚠️ มีรายการ {incidentCount} รายการ</span>
              </span>
            )}
          </div>
          {latestIncident && (
            <div className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="shrink-0">บริษัท:</span>{' '}
              <span className="font-semibold text-slate-700 truncate">{latestIncident.companyName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
