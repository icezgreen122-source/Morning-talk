import React from 'react';
import { Target, Shield, Clock, Building2 } from 'lucide-react';
import { ProjectConfig } from '../types';
import { formatProjectPeriod } from '../utils/dateUtils';

interface HeroSectionProps {
  totalCompanies: number;
  lastUpdatedText?: string;
  projectConfig?: ProjectConfig;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalCompanies,
  lastUpdatedText = '21 ตุลาคม 2569',
  projectConfig,
}) => {
  const periodText = projectConfig
    ? `ช่วงเวลา ${formatProjectPeriod(projectConfig.startDate, projectConfig.endDate)} · โรงงาน PPPC ${projectConfig.location || 'ขอนแก่น'}`
    : 'ช่วงเวลา 16 – 31 ตุลาคม 2026 · โรงงาน PPPC ขอนแก่น';

  const projectTag = projectConfig
    ? `PPPC ${projectConfig.location || 'ขอนแก่น'} · ${projectConfig.projectName.toUpperCase()}`
    : 'PPPC ขอนแก่น · โครงการ MAJOR SHUTDOWN 2026';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs mb-5 transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Titles & Project Overview */}
        <div className="space-y-1.5">
          {/* Project tag banner */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{projectTag}</span>
          </div>

          {/* Main Title: Section 1.1 */}
          <h1
            className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0c2340] tracking-tight [word-break:keep-all] [line-break:strict]"
            style={{ lineHeight: 1.3 }}
          >
            <span>แดชบอร์ดสรุปผลการเข้าร่วมกิจกรรม </span>
            <span
              className="gradient-text text-[#10b981] whitespace-nowrap"
              style={{
                display: 'inline-block',
                color: '#10b981',
                fontWeight: 900,
              }}
            >
              Morning Talk
            </span>
          </h1>

          {/* Subtitle: Section 1.1 */}
          <p className="subtitle text-xs sm:text-sm font-semibold text-emerald-800 whitespace-nowrap" style={{ marginTop: '8px' }}>
            {periodText}
          </p>

          {/* Latest update timestamp & Real-time notice */}
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>ข้อมูลอัปเดตล่าสุด: <strong className="font-bold">{lastUpdatedText}</strong></span>
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              ระบบออนไลน์แบบเรียลไทม์
            </span>
            <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
              ·
            </span>
            <span className="text-slate-600 whitespace-nowrap">
              มาสเตอร์ลิสต์คู่ธุรกิจ{' '}
              <strong className="text-slate-900 font-bold tabular-nums">
                {totalCompanies}
              </strong>{' '}
              แห่ง
            </span>
          </div>
        </div>

        {/* Right: Target & Safety Status Badges */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0 pt-2 lg:pt-0">
          {/* Company Target Badge (Soft Amber) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-amber-100/90 flex items-center justify-center text-amber-700 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">
                เป้าหมายรายชื่อ
              </div>
              <div className="text-slate-900 font-bold leading-tight">
                <span className="tabular-nums">{totalCompanies}</span> บริษัท
              </div>
            </div>
          </div>

          {/* Zero Accident Target Badge (Soft Emerald Green) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-100/90 flex items-center justify-center text-emerald-700 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">
                เป้าหมายความปลอดภัย
              </div>
              <div className="text-emerald-950 font-extrabold leading-tight">
                Zero Accident
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
