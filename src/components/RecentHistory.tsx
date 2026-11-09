import React from 'react';
import { AttendanceRecord } from '../types';
import { History, PlusCircle, ArrowUpRight, Edit2, Trash2, Lock, ShieldCheck } from 'lucide-react';
import { toThaiDateShort } from '../utils/dateUtils';
import { isRecordLocked } from '../utils/lockService';

interface RecentHistoryProps {
  records: AttendanceRecord[];
  lockedDates?: string[];
  unlockedDates?: string[];
  currentDate?: string;
  onEditRecord?: (record: AttendanceRecord) => void;
  onDeleteRecord?: (record: AttendanceRecord) => void;
  onViewAll?: () => void;
  onRequestUnlock?: (date: string) => void;
  onNotify?: (msg: string) => void;
}

export const RecentHistory: React.FC<RecentHistoryProps> = ({
  records,
  lockedDates = [],
  unlockedDates = [],
  currentDate,
  onEditRecord,
  onDeleteRecord,
  onViewAll,
  onRequestUnlock,
  onNotify,
}) => {
  // Show 8 latest records
  const latestRecords = records.slice(0, 8);

  const handleLockedClick = (date: string) => {
    if (onRequestUnlock) {
      onRequestUnlock(date);
    } else if (onNotify) {
      onNotify('🔒 ข้อมูลวันนี้ถูกล็อคแล้ว ติดต่อ Admin หากต้องการแก้ไข');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              ประวัติการบันทึกล่าสุด
            </h2>
            <p className="text-xs text-slate-500">
              แสดง 8 รายการล่าสุด (เฉพาะวันปัจจุบันที่ยังไม่ล็อคเท่านั้นที่สามารถแก้ไข/ลบได้)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            บันทึกแล้วทั้งหมด {records.length} ครั้ง
          </span>
          {onViewAll && records.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 transition-colors cursor-pointer"
            >
              ดูทั้งหมด (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Daily Lock Notice Banner */}
      <div className="mb-4 p-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-medium">
            🔒 วันที่ผ่านไปแล้วถูกล็อคแล้ว ไม่สามารถแก้ไขได้
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          (ปลดล็อคได้เฉพาะ Super Admin)
        </span>
      </div>

      {latestRecords.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 p-4">
          <PlusCircle className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">ยังไม่มีประวัติการบันทึก</p>
          <p className="text-xs text-slate-400 mt-0.5">
            เมื่อลงข้อมูลผ่านฟอร์มหรือปุ่ม &quot;บันทึกข้อมูลใหม่&quot; รายการจะปรากฏที่นี่ทันที
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {latestRecords.map((rec) => {
            const isInternal = rec.companyType === 'internal';
            const isLocked = isRecordLocked(rec, lockedDates, unlockedDates, currentDate);

            return (
              <div
                key={rec.id}
                className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all text-xs group relative shadow-2xs ${
                  isLocked
                    ? 'bg-slate-100/90 hover:bg-slate-100 border-slate-300/80 text-slate-600'
                    : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-bold text-slate-800 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      {toThaiDateShort(rec.date)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isLocked && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-0.5"
                          title="ข้อมูลรายการนี้ถูกล็อคแล้ว ไม่สามารถแก้ไขได้"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>ล็อค</span>
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isInternal
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่'}
                      </span>
                    </div>
                  </div>

                  <div className="font-bold text-slate-900 text-sm truncate" title={rec.companyName}>
                    {rec.companyName}
                  </div>

                  {rec.safetyTopic && (
                    <div className="text-[11px] text-slate-500 truncate mt-1" title={rec.safetyTopic}>
                      🛡️ {rec.safetyTopic}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-emerald-700 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+{rec.attendees} คน</span>
                  </div>

                  {/* Actions: Edit & Delete buttons or Lock Indicator */}
                  <div className="flex items-center gap-1">
                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => handleLockedClick(rec.date)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/70 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer text-[10px] font-semibold"
                        title="ข้อมูลถูกล็อคแล้ว (คลิกเพื่อขอปลดล็อค Admin)"
                      >
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>ล็อค</span>
                      </button>
                    ) : (
                      <>
                        {onEditRecord && (
                          <button
                            type="button"
                            onClick={() => onEditRecord(rec)}
                            className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="แก้ไขรายการนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteRecord && (
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
