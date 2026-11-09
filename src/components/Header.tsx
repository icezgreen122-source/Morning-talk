import React, { useState } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Building2,
  Sliders,
  Printer,
  Download,
  RotateCcw,
  UserCheck,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface HeaderProps {
  totalCompanies: number;
  totalAttendees: number;
  onOpenHistory: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onOpenAdminPanel: () => void;
  onOpenAdminProfile: () => void;
  onOpenInfographic: () => void;
  onScrollToForm: () => void;
  onScrollToTable: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCompanies,
  totalAttendees,
  onOpenHistory,
  onExportCSV,
  onResetData,
  onOpenAdminPanel,
  onOpenAdminProfile,
  onOpenInfographic,
  onScrollToForm,
  onScrollToTable,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="w-full">
      {/* 1. TOP WHITE BAR FOR LOGOS */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-4">
          {/* Top Left: SCGP Logo (Preserve original white background, true to asset) */}
          <div className="flex items-center shrink-0">
            <img
              src="/assets/aistudio/New-SCGP_Logo_3_5535ee08.jpg"
              alt="SCGP Logo"
              className="h-9 sm:h-12 md:h-14 w-auto object-contain select-none"
              loading="eager"
            />
          </div>

          {/* Top Right: CARE FOR ALL Logo (White background removed, enlarged, Thai text crystal clear) */}
          <div className="flex items-center justify-end shrink-0">
            <img
              src="/assets/aistudio/care_for_all_transparent.png"
              alt="CARE FOR ALL - Safety Everywhere, Every Time - ร่วมสร้างความปลอดภัย ทุกที่ ทุกเวลา"
              className="h-14 sm:h-20 md:h-24 max-w-[220px] sm:max-w-[300px] md:max-w-[360px] w-auto object-contain select-none"
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN NAV BAR: SAFETY MORNING TALK (Dark Navy Blue Background) */}
      <nav className="bg-[#0c2340] text-white border-b border-blue-950 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2.5 sm:py-3 gap-3">
            {/* Brand Lockup: Shield Icon, Safety Morning Talk, OHS & Safety, Firestore Online */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Safety Morning Talk
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    OHS & Safety
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs">
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Firestore Online
                  </span>
                  <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
                  <span className="text-[11px] text-slate-300 hidden sm:inline">PPPC ขอนแก่น Major Shutdown 2026</span>
                </div>
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors no-print"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Desktop Menu Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs no-print shrink-0">
              {/* 1. บันทึกข้อมูลใหม่ (Featured CTA) */}
              <button
                onClick={onScrollToForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                title="เลื่อนไปที่ฟอร์มบันทึกข้อมูลรายวัน"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>บันทึกข้อมูลใหม่</span>
              </button>

              {/* 2. บริษัท / หจก. */}
              <button
                onClick={onScrollToTable}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={`ดูตารางมาสเตอร์ลิสต์คู่ธุรกิจ ${totalCompanies} บริษัท`}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>บริษัท / หจก. ({totalCompanies})</span>
              </button>

              {/* 3. Admin Panel */}
              <button
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="เปิดแผงควบคุมระบบ Admin Panel"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Panel</span>
              </button>

              {/* 4. พิมพ์รายงาน */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="พิมพ์รายงานสรุปผล หรือ Export PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>พิมพ์รายงาน</span>
              </button>

              {/* 5. ส่งออกข้อมูล */}
              <button
                onClick={onExportCSV}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="ดาวน์โหลดไฟล์ข้อมูล .CSV (UTF-8)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>ส่งออกข้อมูล</span>
              </button>

              {/* 6. ภาพอินโฟกราฟิก 16:9 */}
              <button
                onClick={onOpenInfographic}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-blue-200 bg-blue-900/60 hover:bg-blue-800/80 border border-blue-500/40 rounded-lg transition-colors shadow-2xs"
                title="เปิดภาพอินโฟกราฟิกนำเสนอ 16:9 และบันทึกเป็นภาพ PNG"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                <span>อินโฟกราฟิก 16:9</span>
              </button>

              {/* 6. โหลดข้อมูลตัวอย่าง */}
              <button
                onClick={onResetData}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-300 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
                title="โหลดข้อมูลตัวอย่างเริ่มต้นกลับมา"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>โหลดข้อมูลตัวอย่าง</span>
              </button>

              {/* Divider */}
              <span className="w-px h-5 bg-slate-700/80 mx-0.5" aria-hidden="true"></span>

              {/* 7. โปรไฟล์ผู้ดูแลระบบ */}
              <button
                onClick={onOpenAdminProfile}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-500/30 rounded-lg transition-colors"
                title="ดูโปรไฟล์ผู้ดูแลระบบความปลอดภัย"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>โปรไฟล์ผู้ดูแลระบบ</span>
              </button>

              {/* 8. ออกจากระบบ */}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1 px-2 py-1.5 font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">ออก</span>
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-slate-700/80 space-y-1 text-xs no-print animate-in fade-in duration-150">
              <button
                onClick={() => {
                  onScrollToForm();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-white bg-emerald-600 rounded-lg font-semibold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>บันทึกข้อมูลใหม่</span>
              </button>

              <button
                onClick={() => {
                  onScrollToTable();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-white/10 rounded-lg"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>บริษัท / หจก. ({totalCompanies})</span>
              </button>

              <button
                onClick={() => {
                  onOpenAdminPanel();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-white/10 rounded-lg"
              >
                <Sliders className="w-4 h-4 text-slate-400" />
                <span>Admin Panel</span>
              </button>

              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => {
                    handlePrint();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-200 hover:bg-white/10 rounded-lg"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>พิมพ์รายงาน</span>
                </button>

                <button
                  onClick={() => {
                    onExportCSV();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-200 hover:bg-white/10 rounded-lg"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>ส่งออกข้อมูล</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onOpenInfographic();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-200 bg-blue-900/60 border border-blue-500/40 rounded-lg font-semibold"
              >
                <ImageIcon className="w-4 h-4 text-blue-300" />
                <span>ภาพอินโฟกราฟิกนำเสนอ (16:9)</span>
              </button>

              <div className="grid grid-cols-2 gap-1 pt-1">
                <button
                  onClick={() => {
                    onResetData();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-300 hover:bg-white/10 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span>โหลดข้อมูลตัวอย่าง</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAdminProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-emerald-300 hover:bg-white/10 rounded-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>โปรไฟล์ผู้ดูแล</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700/80">
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-950/30 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
