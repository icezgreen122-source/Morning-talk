import React, { useState } from 'react';
import { ShieldCheck, RotateCcw, RefreshCw } from 'lucide-react';
import { ProjectConfig } from '../types';

interface NavbarProps {
  onResetToZero: () => void;
  onRefresh?: () => void;
  onOpenPublishSafety?: () => void;
  persistedRecordsCount?: number;
  projectConfig?: ProjectConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  onResetToZero,
  onRefresh,
  onOpenPublishSafety,
  persistedRecordsCount = 49,
  projectConfig,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <header className="w-full header-main bg-[#0c2340] text-white border-b border-[#133054] shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Left Section: SCGP Logo Badge, Divider, Shield Icon, Title & Subtitle */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
            {/* 1. SCGP Logo on White Rounded Badge */}
            <div className="scgp-logo-wrapper shadow-xs">
              <img
                src="/assets/aistudio/scgp_trimmed.png"
                alt="SCGP Logo"
                className="scgp-logo"
                onError={(e) => {
                  // Fallback if trimmed image is not loaded
                  (e.currentTarget as HTMLImageElement).src =
                    '/assets/aistudio/New-SCGP_Logo_3_5535ee08.jpg';
                }}
              />
            </div>

            {/* 2. Vertical Divider */}
            <div
              className="hidden sm:block h-8 w-[1px] bg-white/25 self-center"
              aria-hidden="true"
            />

            {/* 3. Safety Shield Icon */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>

            {/* 4. System Title & Subtitle */}
            <div className="flex flex-col justify-center">
              {/* Row 1: Title + OHS & SAFETY Badge */}
              <div className="flex items-center gap-2 flex-nowrap">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight whitespace-nowrap">
                  Safety Morning Talk
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs whitespace-nowrap">
                  OHS &amp; SAFETY
                </span>
              </div>

              {/* Row 2: Pulsing Dot, ระบบออนไลน์, Project Info (Single line, no break) */}
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 flex-nowrap whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium shrink-0 whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  ระบบออนไลน์
                </span>
                <span className="text-white/40 shrink-0" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-300/90 text-[11px] sm:text-xs whitespace-nowrap font-medium">
                  {projectConfig?.projectName || 'PPPC ขอนแก่น Major Shutdown'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: CARE FOR ALL Logo (White Rounded Badge) & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 pt-1 md:pt-0 border-t border-white/10 md:border-t-0 flex-wrap">
            {/* CARE FOR ALL Logo with white background badge */}
            <div className="logo-care-wrapper shadow-xs hidden sm:flex">
              <img
                src="/assets/aistudio/care_for_all_transparent.png"
                alt="CARE FOR ALL - ร่วมสร้างพฤติกรรมความปลอดภัย เพื่อทุกคนปลอดภัยไปด้วยกัน"
              />
            </div>

            {/* Action Buttons: Publish Status, Refresh & Reset to Zero */}
            <div className="flex items-center gap-2">
              {onOpenPublishSafety && (
                <button
                  type="button"
                  onClick={onOpenPublishSafety}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-100 bg-emerald-600/35 hover:bg-emerald-600/50 active:bg-emerald-600/60 border border-emerald-400/50 rounded-lg transition-all shadow-xs cursor-pointer"
                  title="ตรวจสอบความปลอดภัยและยืนยันข้อมูลก่อน/หลัง Publish (ป้องกันการสูญหาย 100%)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🛡️ พร้อม Publish ({persistedRecordsCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRefreshClick}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/20 rounded-lg transition-colors shadow-2xs backdrop-blur-xs cursor-pointer"
                title="รีเฟรชข้อมูลหน้าจอ"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-slate-200 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden xs:inline">รีเฟรชข้อมูล</span>
              </button>

              <button
                type="button"
                onClick={onResetToZero}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 border border-rose-400/40 rounded-lg transition-colors shadow-2xs cursor-pointer"
                title="ล้างจำนวนคนทั้งหมดเป็น 0 (รายชื่อบริษัทยังคงอยู่)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
                <span>⟲ รีเซ็ทศูนย์</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

