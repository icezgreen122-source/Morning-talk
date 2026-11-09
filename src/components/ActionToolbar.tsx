import React from 'react';
import {
  PlusCircle,
  Building2,
  ShieldCheck,
  Printer,
  FileSpreadsheet,
  Sparkles,
  UserCheck,
  Image as ImageIcon,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';

interface ActionToolbarProps {
  onOpenNewRecord: () => void;
  onOpenCompanyManagement: () => void;
  onOpenAdminPanel: () => void;
  onPrintReport: () => void;
  onOpenExport: () => void;
  onLoadSampleData: () => void;
  onOpenUserProfile: () => void;
  totalCompanies: number;
  totalRecords?: number;
  onDirectExportPNG?: () => void;
  isGeneratingPNG?: boolean;
  onOpenBackupExcel?: () => void;
  onOpenBackupCSV?: () => void;
  isTodayLocked?: boolean;
  onToggleDailyLock?: () => void;
  onOpenPublishSafety?: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onOpenNewRecord,
  onOpenCompanyManagement,
  onOpenAdminPanel,
  onPrintReport,
  onOpenExport,
  onLoadSampleData,
  onOpenUserProfile,
  totalCompanies,
  totalRecords = 0,
  onDirectExportPNG,
  isGeneratingPNG,
  onOpenBackupExcel,
  onOpenBackupCSV,
  isTodayLocked = false,
  onToggleDailyLock,
  onOpenPublishSafety,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-3.5 mb-5 transition-all">
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        {/* Left primary actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. บันทึกข้อมูลใหม่ (Bright Blue) */}
          <button
            type="button"
            onClick={onOpenNewRecord}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title="เปิดฟอร์มบันทึกยอด Morning Talk ใหม่"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>บันทึกข้อมูลใหม่</span>
          </button>

          {/* 2. บริษัท / หจก. (Navy / Slate) */}
          <button
            type="button"
            onClick={onOpenCompanyManagement}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300/80 border border-slate-300/80 rounded-xl transition-all cursor-pointer"
            title="จัดการรายชื่อและประเภทบริษัทคู่ธุรกิจ"
          >
            <Building2 className="w-4 h-4 text-slate-700" />
            <span>บริษัท / หจก.</span>
            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-white text-slate-700 border border-slate-200">
              {totalCompanies}
            </span>
          </button>

          {/* 3. Admin Panel (Purple) */}
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border border-purple-200 rounded-xl transition-all cursor-pointer"
            title="เปิดแผงควบคุมระบบและความสมบูรณ์ของข้อมูล"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Admin Panel</span>
            {totalRecords > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                {totalRecords}
              </span>
            )}
          </button>

          {/* 3.0 ตรวจสอบก่อน Publish (Publish Safety & Zero Data Loss) */}
          {onOpenPublishSafety && (
            <button
              type="button"
              onClick={onOpenPublishSafety}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="ตรวจสอบความปลอดภัยและยืนยันข้อมูลถาวรก่อนและหลัง Publish (Zero Data Loss Guard)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>🛡️ พร้อม Publish</span>
            </button>
          )}

          {/* 3.1 ปุ่มล็อคข้อมูลรายวัน (Daily Lock Button for Admin) */}
          {onToggleDailyLock && (
            <button
              type="button"
              onClick={onToggleDailyLock}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs ${
                isTodayLocked
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title={
                isTodayLocked
                  ? 'ข้อมูลวันนี้ถูกล็อคแล้ว (คลิกเพื่อปลดล็อคโดย Admin)'
                  : 'คลิกเพื่อล็อคข้อมูลประจำวันนี้ ป้องกันการแก้ไข/ลบ'
              }
            >
              {isTodayLocked ? (
                <>
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span className="text-amber-900 font-bold">🔒 วันนี้ถูกล็อค</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>🔒 ล็อควันนี้</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right secondary actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 4. พิมพ์รายงาน (Neutral) */}
          <button
            type="button"
            onClick={onPrintReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="พิมพ์รายงานสรุปผล Morning Talk"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden xs:inline">พิมพ์รายงาน</span>
          </button>

          {/* สรุปข้อมูลเป็น PNG (Primary Action requested by user) */}
          {onDirectExportPNG && (
            <button
              type="button"
              onClick={onDirectExportPNG}
              disabled={isGeneratingPNG}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 rounded-xl shadow-xs transition-all cursor-pointer"
              title="สรุปข้อมูลเป็นภาพ PNG ความคมชัด 2 เท่า (ตรงตามหน้า Dashboard)"
            >
              {isGeneratingPNG ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ImageIcon className="w-4 h-4 text-white" />
              )}
              <span>{isGeneratingPNG ? 'กำลังสร้าง PNG...' : 'สรุปข้อมูลเป็น PNG'}</span>
            </button>
          )}

          {/* 5.1 สำรองข้อมูล Excel */}
          {onOpenBackupExcel && (
            <button
              type="button"
              onClick={onOpenBackupExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="ดาวน์โหลดไฟล์สำรองข้อมูล Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>📥 สำรองข้อมูล Excel</span>
            </button>
          )}

          {/* 5.2 สำรองข้อมูล CSV */}
          {onOpenBackupCSV && (
            <button
              type="button"
              onClick={onOpenBackupCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-300 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
              title="ดาวน์โหลดไฟล์สำรองข้อมูล CSV (.csv) UTF-8"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
              <span>📥 สำรองข้อมูล CSV</span>
            </button>
          )}

          {/* 5. ส่งออกข้อมูล (Emerald) */}
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="ส่งออก Dashboard หรือบันทึกภาพ"
          >
            <span className="hidden xs:inline">ส่งออกข้อมูล</span>
            <span className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-bold bg-slate-600 text-white rounded">
              PNG / CSV
            </span>
          </button>

          {/* 6. โหลดข้อมูลตัวอย่าง (Amber / Orange) */}
          <button
            type="button"
            onClick={onLoadSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-300/80 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="โหลดข้อมูลตัวอย่างกิจกรรม 16-21 ต.ค. เพื่อทดสอบระบบ"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">โหลดข้อมูลตัวอย่าง</span>
          </button>

          {/* 7. ข้อมูลผู้ใช้งานและ System Admin (Indigo) */}
          <button
            type="button"
            onClick={onOpenUserProfile}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-indigo-900 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="ดูข้อมูลบัญชีผู้ใช้งาน และ System Admin"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
              SC
            </div>
            <span className="hidden lg:inline text-xs font-semibold">
              จป.วิชาชีพ PPPC
            </span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-600 hidden xs:inline" />
          </button>
        </div>
      </div>
    </div>
  );
};
