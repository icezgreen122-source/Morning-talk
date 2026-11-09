import React from 'react';
import { AlertOctagon, Trash2, X, Calendar, Building2, Users } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AttendanceRecord | null;
  onConfirmDelete: (recordId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  record,
  onConfirmDelete,
}) => {
  if (!isOpen || !record) return null;

  const dateObj = SHUTDOWN_DATES.find((d) => d.value === record.date);

  const handleDelete = () => {
    onConfirmDelete(record.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50 text-rose-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">ยืนยันการลบข้อมูล</h2>
              <p className="text-xs text-rose-700">ลบรายการบันทึก Morning Talk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">
            คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่?
          </p>

          {/* Record Details Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>วันที่:</span>
              </span>
              <span className="font-bold text-slate-800">
                {dateObj?.label || record.date}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>บริษัท / หจก.:</span>
              </span>
              <span className="font-bold text-slate-900">
                {record.companyName}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>จำนวนที่บันทึก:</span>
              </span>
              <span className="font-bold text-rose-600">
                -{record.attendees} คน
              </span>
            </div>

            {record.safetyTopic && (
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <span className="font-semibold text-slate-700">หัวข้อ: </span>
                {record.safetyTopic}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            ⚠️ <strong>ผลกระทบ:</strong> เมื่อลบรายการนี้แล้ว ยอดผู้เข้าร่วม {record.attendees} คนจะถูกหักออกจากยอดสะสมของ &quot;{record.companyName}&quot; พร้อมอัปเดต KPI และกราฟทันที
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>ยืนยันการลบ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
