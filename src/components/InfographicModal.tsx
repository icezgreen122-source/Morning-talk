import React, { useRef, useState } from 'react';
import { toBlob, toPng } from 'html-to-image';
import { Company, QuickStats } from '../types';
import {
  Download,
  X,
  Maximize2,
  Minimize2,
  Printer,
  CheckCircle2,
  Building,
  Layers,
  Users,
  Target,
  Image as ImageIcon,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface InfographicModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  selectedDate?: string;
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
  summaryDateText?: string;
  stats?: QuickStats;
}

export const InfographicModal: React.FC<InfographicModalProps> = ({
  isOpen,
  onClose,
  companies,
  selectedDate = '2026-10-21',
  selectedDateLabel = '21 ต.ค. 2026',
  viewMode = 'daily',
  summaryDateText = '21 ตุลาคม 2569',
  stats,
}) => {
  const infographicRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDaily = viewMode === 'daily';

  // Split and sort internal and external companies descending
  const internalCompanies = companies
    .filter((c) => c.type === 'internal')
    .sort((a, b) => b.totalAttendees - a.totalAttendees);

  const externalCompanies = companies
    .filter((c) => c.type === 'external')
    .sort((a, b) => b.totalAttendees - a.totalAttendees);

  // Exact benchmark totals or calculated totals
  const internalAttendees = stats?.internalAttendeesCount !== undefined
    ? stats.internalAttendeesCount
    : internalCompanies.reduce((sum, c) => sum + c.totalAttendees, 0);

  const externalAttendees = stats?.externalAttendeesCount !== undefined
    ? stats.externalAttendeesCount
    : externalCompanies.reduce((sum, c) => sum + c.totalAttendees, 0);

  const totalAttendees = stats?.totalAttendeesCount !== undefined
    ? stats.totalAttendeesCount
    : (internalAttendees + externalAttendees);

  const internalActiveCount = stats?.internalCompaniesWithAttendees !== undefined
    ? stats.internalCompaniesWithAttendees
    : internalCompanies.filter((c) => c.totalAttendees > 0).length;

  const externalActiveCount = stats?.externalCompaniesWithAttendees !== undefined
    ? stats.externalCompaniesWithAttendees
    : externalCompanies.filter((c) => c.totalAttendees > 0).length;

  const totalActiveCompanies = stats?.participatingCompaniesCount !== undefined
    ? stats.participatingCompaniesCount
    : (internalActiveCount + externalActiveCount);

  const coveragePercent = stats?.dataCoveragePercent !== undefined
    ? stats.dataCoveragePercent
    : (companies.length > 0 ? Math.round((totalActiveCompanies / companies.length) * 100) : 0);

  const internalShare = totalAttendees > 0 ? Math.round((internalAttendees / totalAttendees) * 100) : 0;
  const externalShare = totalAttendees > 0 ? Math.round((externalAttendees / totalAttendees) * 100) : 0;

  // Max value for scaling chart bars
  const maxInternal = Math.max(...internalCompanies.map((c) => c.totalAttendees), 1);
  const maxExternal = Math.max(...externalCompanies.map((c) => c.totalAttendees), 1);

  const formattedSummaryDate = summaryDateText?.trim() || '21 ตุลาคม 2569';

  const handleDownloadImage = async () => {
    if (!infographicRef.current) return;
    try {
      setIsExporting(true);
      setExportNotice('กำลังสร้างภาพอินโฟกราฟิกความละเอียดสูง (16:9)...');

      const filename = `SCGP_Safety_Morning_Talk_Infographic_${selectedDate}.png`;

      // Try toBlob first for best performance
      try {
        const blob = await toBlob(infographicRef.current, {
          pixelRatio: 2,
          backgroundColor: '#f1f5f9',
          skipFonts: true,
          cacheBust: true,
        });

        if (blob && blob.size > 1000) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setExportNotice('บันทึกภาพอินโฟกราฟิกเรียบร้อยแล้ว!');
          setTimeout(() => setExportNotice(null), 3500);
          return;
        }
      } catch (blobErr) {
        console.warn('toBlob fallback to toPng:', blobErr);
      }

      // Fallback to toPng
      const dataUrl = await toPng(infographicRef.current, {
        pixelRatio: 2,
        backgroundColor: '#f1f5f9',
        skipFonts: true,
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice('บันทึกภาพอินโฟกราฟิกเรียบร้อยแล้ว!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('Failed to export infographic image:', err);
      setExportNotice('เกิดข้อผิดพลาดในการบันทึกภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className={`relative bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-7xl max-h-[96vh]'
        }`}
      >
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/90 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>แดชบอร์ดสรุปผลการเข้าร่วมกิจกรรม Safety Morning Talk</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  16:9 Presentation Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                SCGP · PPPC ขอนแก่น Major Shutdown 2026 · สรุปข้อมูล ณ วันที่ {formattedSummaryDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {exportNotice && (
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md hidden md:inline">
                {exportNotice}
              </span>
            )}

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors shadow-xs cursor-pointer"
              title="บันทึกภาพอินโฟกราฟิกความละเอียดสูง (PNG 16:9)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'กำลังบันทึก...' : 'บันทึกภาพ PNG (16:9)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:inline-flex cursor-pointer"
              title="พิมพ์เอกสาร"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'ย่อขนาด' : 'แสดงเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport with Aspect Ratio 16:9 Canvas */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-center justify-center bg-slate-950/40">
          {/* THE 16:9 INFOGRAPHIC CONTAINER */}
          <div
            ref={infographicRef}
            className="w-full max-w-[1400px] aspect-[16/9] min-w-[1100px] bg-[#f1f5f9] text-slate-900 p-6 sm:p-8 flex flex-col justify-between rounded-2xl border border-slate-200 shadow-2xl overflow-hidden font-sans select-none"
            style={{
              fontFamily: "'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            {/* 1. TOP CORPORATE HEADER */}
            <div className="bg-[#0c2340] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-900/60 relative overflow-hidden shrink-0">
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                {/* Left: SCGP Logo & Badges */}
                <div className="flex items-center gap-3.5">
                  <div className="bg-white px-3.5 py-1.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                    <img
                      src="/assets/aistudio/scgp_trimmed.png"
                      alt="SCGP Logo"
                      className="h-9 w-auto object-contain"
                    />
                  </div>

                  <div className="h-7 w-px bg-white/20 hidden sm:block" />

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                        <ShieldCheck className="w-3 h-3 text-slate-950" />
                        OHS & SAFETY FIRST
                      </span>
                      <span className="text-[11px] font-semibold text-blue-200 hidden md:inline">
                        PPPC ขอนแก่น · Major Shutdown 2026
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      บริษัท ผลิตภัณฑ์กระดาษไทย จำกัด (PPPC)
                    </div>
                  </div>
                </div>

                {/* Right: Requirement 2 - Professional Dark Navy Summary Date Box & CARE FOR ALL Logo */}
                <div className="flex items-center gap-3">
                  <div className="bg-[#0a1d37] border-2 border-[#38bdf8] rounded-xl px-4 py-2 shadow-sm text-right flex flex-col justify-center">
                    <div className="text-[10px] uppercase font-bold text-sky-200 tracking-wider flex items-center justify-end gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      <span>เอกสารสรุปผลทางการ OHS PPPC</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white flex items-center justify-end gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-[#38bdf8]" />
                      <span>สรุปข้อมูล ณ วันที่ {formattedSummaryDate}</span>
                    </div>
                  </div>

                  <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-white/80 flex items-center justify-center">
                    <img
                      src="/assets/aistudio/care_for_all_transparent.png"
                      alt="Care For All"
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Under-title Date Pill */}
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className="text-xl sm:text-2xl font-black text-white tracking-tight"
                    style={{ lineHeight: 1.3 }}
                  >
                    Dashboard สรุปผลการเข้าร่วมกิจกรรม Safety<br />
                    <span
                      className="gradient-text"
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #38bdf8 0%, #34d399 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Morning Talk
                    </span>
                  </h1>
                  <p className="subtitle flex items-center gap-3 text-xs" style={{ marginTop: '8px' }}>
                    <span className="font-bold text-emerald-400">
                      โครงการ Major Shutdown ประจำปี 2026 โรงงาน PPPC ขอนแก่น
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="inline-flex items-center gap-1.5 bg-[#0a1d37] border border-[#38bdf8] px-2.5 py-0.5 rounded-full text-white font-bold text-[11px]">
                      <Calendar className="w-3 h-3 text-[#38bdf8]" />
                      <span>สรุปข้อมูล ณ วันที่ {formattedSummaryDate}</span>
                    </span>
                  </p>
                </div>

                <div className="hidden sm:block text-right bg-blue-950/60 border border-blue-500/40 px-3 py-1.5 rounded-xl">
                  <div className="text-[10px] font-bold text-blue-300 uppercase">เป้าหมายความปลอดภัย</div>
                  <div className="text-sm font-black text-emerald-400">100% Zero Accident Target</div>
                </div>
              </div>
            </div>

            {/* 2. FOUR KPI SUMMARY CARDS (Exact match: 263, 169, 432, 58%) */}
            <div className="grid grid-cols-4 gap-3.5 my-3 shrink-0">
              {/* Card 1: ภายในพื้นที่ */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 p-3.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-600" />
                      คู่ธุรกิจภายในพื้นที่
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full">
                      {internalCompanies.length} บริษัท
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums my-1">
                    {internalAttendees.toLocaleString()}
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    เข้าร่วม: <strong className="text-emerald-700 font-bold">{internalActiveCount}</strong> จาก {internalCompanies.length} แห่ง
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">สัดส่วน</span>
                  <span className="font-extrabold text-emerald-700 tabular-nums">{internalShare}%</span>
                </div>
              </div>

              {/* Card 2: ภายนอกพื้นที่ */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-blue-600 p-3.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      คู่ธุรกิจภายนอกพื้นที่
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full">
                      {externalCompanies.length} บริษัท
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums my-1">
                    {externalAttendees.toLocaleString()}
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    เข้าร่วม: <strong className="text-blue-700 font-bold">{externalActiveCount}</strong> จาก {externalCompanies.length} แห่ง
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">สัดส่วน</span>
                  <span className="font-extrabold text-blue-700 tabular-nums">{externalShare}%</span>
                </div>
              </div>

              {/* Card 3: รวมผู้เข้าร่วมทั้งหมด */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-[#0c2340] p-3.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#0c2340] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0c2340]" />
                      รวมผู้เข้าร่วมทั้งหมด
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                      Grand Total
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0c2340] tabular-nums my-1">
                    {totalAttendees.toLocaleString()}
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">คน</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    เข้าร่วมแล้ว: <strong className="text-[#0c2340] font-bold">{totalActiveCompanies}</strong> จาก {companies.length} บริษัท
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">เฉลี่ยต่อบริษัท</span>
                  <span className="font-extrabold text-[#0c2340] tabular-nums">
                    {totalActiveCompanies > 0 ? Math.round(totalAttendees / totalActiveCompanies) : 0} คน/แห่ง
                  </span>
                </div>
              </div>

              {/* Card 4: การมีส่วนร่วมตามแผนงาน */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-amber-500 p-3.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      สรุปการมีส่วนร่วมตามแผน
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full">
                      KPI Target
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums my-1">
                    Coverage {coveragePercent}%
                  </div>
                  <div className="text-[11px] text-slate-600">
                    เข้าร่วม: <strong className="text-amber-700 font-bold">{totalActiveCompanies}</strong> จาก 36 บริษัทเป้าหมาย
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">สถานะ OHS</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                    100% Zero Accident
                  </span>
                </div>
              </div>
            </div>

            {/* 3. TWO VERTICAL BAR CHARTS (ENHANCED LABEL CLARITY) */}
            <div className="grid grid-cols-2 gap-3.5 flex-1 min-h-0 mb-2">
              {/* Left Chart: คู่ธุรกิจภายในพื้นที่ (Green) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ผู้เข้าร่วม — คู่ธุรกิจภายในพื้นที่ ({internalCompanies.length} แห่ง)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-emerald-700 tabular-nums">
                      {internalAttendees.toLocaleString()} คน
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({internalActiveCount} แห่ง)
                    </span>
                  </div>
                </div>

                {/* Bars & Labels Canvas Area */}
                <div className="flex-1 flex flex-col justify-end min-h-0 relative">
                  {internalActiveCount === 0 ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 min-h-[220px]">
                      <Building className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        ยังไม่มีข้อมูลสำหรับวันที่เลือก กรุณากรอกและบันทึกข้อมูล
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        (ยอดเข้าร่วมคู่ธุรกิจภายในพื้นที่สำหรับ {formattedSummaryDate}: 0 คน)
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Bars Columns */}
                      <div className="w-full flex-1 flex items-end justify-between gap-1 px-1 border-b-2 border-slate-300 min-h-[140px]">
                        {internalCompanies.map((c) => {
                          const hasAttendees = c.totalAttendees > 0;
                          const heightPercent = Math.max(7, Math.round((c.totalAttendees / maxInternal) * 88));

                          return (
                            <div
                              key={c.id}
                              className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                            >
                              <span
                                className={`text-[10px] sm:text-[11px] font-black tabular-nums mb-1 leading-none ${
                                  hasAttendees ? 'text-emerald-800' : 'text-slate-400'
                                }`}
                              >
                                {c.totalAttendees}
                              </span>
                              <div
                                style={{ height: `${hasAttendees ? heightPercent : 4}%` }}
                                className={`w-full max-w-[28px] sm:max-w-[34px] rounded-t-sm shadow-2xs ${
                                  hasAttendees
                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-500'
                                    : 'bg-slate-200'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Requirement 1: Clear, full-name company labels unclipped at -45deg */}
                      <div className="w-full flex justify-between gap-1 pt-2 px-1 h-28 sm:h-32 overflow-visible relative">
                        {internalCompanies.map((c) => (
                          <div
                            key={c.id}
                            className="flex-1 min-w-0 flex items-start justify-center overflow-visible relative"
                          >
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold origin-top-left -rotate-45 whitespace-nowrap inline-block tracking-tight ${
                                c.totalAttendees > 0 ? 'text-slate-900' : 'text-slate-500'
                              }`}
                              style={{
                                fontFamily: "'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif",
                              }}
                              title={c.name}
                            >
                              {c.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500 shrink-0">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    แท่งสีเขียวแสดงยอดผู้เข้าร่วม (เรียงลำดับจากมากไปน้อย)
                  </span>
                  <span className="font-bold text-slate-800">
                    {internalActiveCount} / {internalCompanies.length} บริษัท
                  </span>
                </div>
              </div>

              {/* Right Chart: คู่ธุรกิจภายนอกพื้นที่ (Blue) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      ผู้เข้าร่วม — คู่ธุรกิจภายนอกพื้นที่ ({externalCompanies.length} แห่ง)
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-black text-blue-700 tabular-nums">
                      {externalAttendees.toLocaleString()} คน
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({externalActiveCount} แห่ง)
                    </span>
                  </div>
                </div>

                {/* Bars & Labels Canvas Area */}
                <div className="flex-1 flex flex-col justify-end min-h-0 relative">
                  {externalActiveCount === 0 ? (
                    <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 min-h-[220px]">
                      <Layers className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        ยังไม่มีข้อมูลสำหรับวันที่เลือก กรุณากรอกและบันทึกข้อมูล
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        (ยอดเข้าร่วมคู่ธุรกิจภายนอกพื้นที่สำหรับ {formattedSummaryDate}: 0 คน)
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Bars Columns */}
                      <div className="w-full flex-1 flex items-end justify-between gap-1.5 px-1 border-b-2 border-slate-300 min-h-[140px]">
                        {externalCompanies.map((c) => {
                          const hasAttendees = c.totalAttendees > 0;
                          const heightPercent = Math.max(7, Math.round((c.totalAttendees / maxExternal) * 88));

                          return (
                            <div
                              key={c.id}
                              className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                            >
                              <span
                                className={`text-[10px] sm:text-[11px] font-black tabular-nums mb-1 leading-none ${
                                  hasAttendees ? 'text-blue-800' : 'text-slate-400'
                                }`}
                              >
                                {c.totalAttendees}
                              </span>
                              <div
                                style={{ height: `${hasAttendees ? heightPercent : 4}%` }}
                                className={`w-full max-w-[32px] sm:max-w-[38px] rounded-t-sm shadow-2xs ${
                                  hasAttendees
                                    ? 'bg-gradient-to-t from-blue-700 to-blue-500'
                                    : 'bg-slate-200'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Requirement 1: Clear, full-name company labels unclipped at -45deg */}
                      <div className="w-full flex justify-between gap-1.5 pt-2 px-1 h-28 sm:h-32 overflow-visible relative">
                        {externalCompanies.map((c) => (
                          <div
                            key={c.id}
                            className="flex-1 min-w-0 flex items-start justify-center overflow-visible relative"
                          >
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold origin-top-left -rotate-45 whitespace-nowrap inline-block tracking-tight ${
                                c.totalAttendees > 0 ? 'text-slate-900' : 'text-slate-500'
                              }`}
                              style={{
                                fontFamily: "'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif",
                              }}
                              title={c.name}
                            >
                              {c.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500 shrink-0">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-xs bg-blue-600" />
                    แท่งสีน้ำเงินแสดงยอดผู้เข้าร่วม (เรียงลำดับจากมากไปน้อย)
                  </span>
                  <span className="font-bold text-slate-800">
                    {externalActiveCount} / {externalCompanies.length} บริษัท
                  </span>
                </div>
              </div>
            </div>

            {/* 4. FOOTER NOTE */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>SCGP · โรงงาน PPPC ขอนแก่น · มุ่งสู่เป้าหมายความปลอดภัย 100% Zero Accident</span>
              </div>
              <div className="font-bold text-sky-800">
                สรุปข้อมูล ณ วันที่ {formattedSummaryDate}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400 flex items-center justify-between shrink-0">
          <span>สัดส่วน 16:9 สำหรับนำเสนอบนจอภาพขนาดใหญ่ และสามารถคลิกดาวน์โหลดเป็นภาพ PNG ได้ทันที</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
