import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Database,
  FileText,
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import { exportBackupExcel, exportBackupCSV, getBackupDateString } from '../utils/backupService';
import { toThaiDateShort, toCanonicalDate } from '../utils/dateUtils';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  rangeStartDate?: string;
  rangeEndDate?: string;
  initialFormat?: 'excel' | 'csv';
  onNotify?: (msg: string) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  records,
  rangeStartDate = '2026-10-16',
  rangeEndDate = '2026-10-31',
  initialFormat = 'excel',
  onNotify,
}) => {
  const [format, setFormat] = useState<'excel' | 'csv'>(initialFormat);
  const [scope, setScope] = useState<'all' | 'range'>('all');

  useEffect(() => {
    if (isOpen) {
      setFormat(initialFormat);
    }
  }, [initialFormat, isOpen]);

  // Filter records if range selected
  const rangeRecords = useMemo(() => {
    return records.filter((r) => {
      const canon = toCanonicalDate(r.date);
      return canon >= rangeStartDate && canon <= rangeEndDate;
    });
  }, [records, rangeStartDate, rangeEndDate]);

  const targetRecords = scope === 'all' ? records : rangeRecords;
  const todayStr = getBackupDateString();
  const currentFileName = `SCGP_MorningTalk_Backup_${todayStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;

  const rangeLabel =
    rangeStartDate === rangeEndDate
      ? toThaiDateShort(rangeStartDate)
      : `${toThaiDateShort(rangeStartDate)} – ${toThaiDateShort(rangeEndDate)} 2569`;

  if (!isOpen) return null;

  const handleDownload = () => {
    const isAll = scope === 'all';
    let result: { filename: string; count: number };

    if (format === 'excel') {
      result = exportBackupExcel(records, {
        isAll,
        rangeStartDate,
        rangeEndDate,
      });
    } else {
      result = exportBackupCSV(records, {
        isAll,
        rangeStartDate,
        rangeEndDate,
      });
    }

    if (onNotify) {
      onNotify(`✓ ดาวน์โหลดไฟล์สำรอง "${result.filename}" (${result.count.toLocaleString()} รายการ) เรียบร้อยแล้ว`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">สำรองข้อมูลความปลอดภัย (Backup Data)</h3>
              <p className="text-xs text-slate-300">
                ดาวน์โหลดไฟล์สำรองป้องกันข้อมูลสูญหาย (เปิดได้ใน Microsoft Excel)
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* 1. Format Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. เลือกรูปแบบไฟล์สำรอง
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    format === 'excel' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">Microsoft Excel</div>
                  <div className="text-[11px] text-slate-500">ไฟล์ .xlsx พร้อมจัดคอลัมน์</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  format === 'csv'
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    format === 'csv' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">ไฟล์ CSV (UTF-8)</div>
                  <div className="text-[11px] text-slate-500">มี BOM ภาษาไทยไม่เพี้ยน</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Scope Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. เลือกขอบเขตข้อมูลที่ต้องการสำรอง
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  scope === 'all'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="backupScope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      สำรองข้อมูลทั้งหมดในระบบ
                    </div>
                    <div className="text-[11px] text-slate-500">
                      รวมประวัติการบันทึก Morning Talk ทุกวันที่มีในฐานข้อมูล
                    </div>
                  </div>
                </div>
                <span className="font-black text-sm text-indigo-900 bg-white px-2 py-1 rounded-lg border border-indigo-200 tabular-nums">
                  {records.length} รายการ
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  scope === 'range'
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="backupScope"
                    checked={scope === 'range'}
                    onChange={() => setScope('range')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      สำรองเฉพาะช่วงวันที่เลือก ({rangeLabel})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ตามช่วงเวลาที่ตัวกรองหน้า Dashboard เลือกอยู่
                    </div>
                  </div>
                </div>
                <span className="font-black text-sm text-indigo-900 bg-white px-2 py-1 rounded-lg border border-indigo-200 tabular-nums">
                  {rangeRecords.length} รายการ
                </span>
              </label>
            </div>
          </div>

          {/* 3. Filename & Columns Info Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">ชื่อไฟล์ที่จะดาวน์โหลด:</span>
              <strong className="text-slate-900 font-mono text-[11px] font-extrabold bg-white px-2 py-0.5 rounded border border-slate-200">
                {currentFileName}
              </strong>
            </div>
            <div className="text-[11px] text-slate-600 [word-break:keep-all] [line-break:strict]">
              <span className="font-semibold text-slate-700">คอลัมน์ในไฟล์:</span> ลำดับ, วันที่, ชื่อบริษัท/หจก., ประเภทคู่ธุรกิจ (ภายใน/นอก), จำนวนคน, เวลาบันทึก, ผู้บันทึก, หัวข้อความปลอดภัย, หมายเหตุ
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
              format === 'excel'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดไฟล์สำรอง ({targetRecords.length} รายการ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
