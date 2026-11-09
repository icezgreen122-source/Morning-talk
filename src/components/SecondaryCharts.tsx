import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { Company, AttendanceRecord, DateOption, ProjectConfig } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import {
  isSameDate,
  toCanonicalDate,
  toThaiDateShort,
  toThaiDateBuddhist,
  getDatesBetween,
} from '../utils/dateUtils';
import {
  TrendingUp,
  Trophy,
  CalendarRange,
  Calendar,
  Building,
  Layers,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface SecondaryChartsProps {
  companies: Company[];
  records: AttendanceRecord[];
  selectedDate?: string;
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
  rangeStartDate?: string;
  rangeEndDate?: string;
  onRangeChange?: (startDate: string, endDate: string) => void;
  availableDates?: DateOption[];
  projectConfig?: ProjectConfig;
}

export const SecondaryCharts: React.FC<SecondaryChartsProps> = ({
  companies,
  records,
  selectedDate = '2026-10-21',
  selectedDateLabel = '21 ต.ค. 2026',
  viewMode = 'daily',
  rangeStartDate: propRangeStartDate,
  rangeEndDate: propRangeEndDate,
  onRangeChange,
  availableDates,
  projectConfig,
}) => {
  const lineChartRef = useRef<HTMLDivElement | null>(null);
  const barChartRef = useRef<HTMLDivElement | null>(null);
  const lineInstance = useRef<echarts.ECharts | null>(null);
  const barInstance = useRef<echarts.ECharts | null>(null);

  const defaultStart = projectConfig?.startDate || '2026-10-16';
  const defaultEnd = projectConfig?.endDate || '2026-10-31';

  // 1. Internal/Controlled Date Range State
  const [internalStartDate, setInternalStartDate] = useState<string>(defaultStart);
  const [internalEndDate, setInternalEndDate] = useState<string>(defaultEnd);

  const startDate = propRangeStartDate ?? internalStartDate;
  const endDate = propRangeEndDate ?? internalEndDate;

  const handleUpdateRange = useCallback(
    (newStart: string, newEnd: string) => {
      // Ensure start <= end
      let validStart = newStart;
      let validEnd = newEnd;
      if (validStart > validEnd) {
        validEnd = validStart;
      }
      setInternalStartDate(validStart);
      setInternalEndDate(validEnd);
      if (onRangeChange) {
        onRangeChange(validStart, validEnd);
      }
    },
    [onRangeChange]
  );

  const handleStartChange = (val: string) => {
    handleUpdateRange(val, endDate);
  };

  const handleEndChange = (val: string) => {
    handleUpdateRange(startDate, val);
  };

  // Quick Preset Helper
  const setQuickPreset = (preset: 'all' | 'w1' | 'w2' | 'last3') => {
    if (preset === 'all') {
      handleUpdateRange('2026-10-16', '2026-10-31');
    } else if (preset === 'w1') {
      handleUpdateRange('2026-10-16', '2026-10-22');
    } else if (preset === 'w2') {
      handleUpdateRange('2026-10-23', '2026-10-31');
    } else if (preset === 'last3') {
      handleUpdateRange('2026-10-20', '2026-10-22');
    }
  };

  const isAllSelected = startDate === '2026-10-16' && endDate === '2026-10-31';
  const isW1Selected = startDate === '2026-10-16' && endDate === '2026-10-22';
  const isW2Selected = startDate === '2026-10-23' && endDate === '2026-10-31';

  // Format Thai dates for range summary
  const startThaiShort = toThaiDateShort(startDate);
  const endThaiShort = toThaiDateShort(endDate);
  const startThaiBuddhist = toThaiDateBuddhist(startDate);
  const endThaiBuddhist = toThaiDateBuddhist(endDate);
  const rangeSummaryText =
    startDate === endDate
      ? startThaiBuddhist
      : `${startThaiShort} – ${endThaiShort} 2569`;
  const rangeFullBuddhistText =
    startDate === endDate
      ? startThaiBuddhist
      : `${startThaiBuddhist} ถึง ${endThaiBuddhist}`;

  // 2. Filter Records Strictly within [startDate, endDate]
  const rangeRecords = useMemo(() => {
    return records.filter((r) => {
      const canon = toCanonicalDate(r.date);
      return canon >= startDate && canon <= endDate;
    });
  }, [records, startDate, endDate]);

  // Range KPI Summary Metrics
  const rangeKpiSummary = useMemo(() => {
    let intCount = 0;
    let extCount = 0;
    const recordedDates = new Set<string>();

    rangeRecords.forEach((r) => {
      const count = Number(r.attendees) || 0;
      recordedDates.add(toCanonicalDate(r.date));
      if (r.companyType === 'internal') {
        intCount += count;
      } else {
        extCount += count;
      }
    });

    const total = intCount + extCount;
    // Count total calendar days in range dynamically across any month/year
    const activeDatesList = getDatesBetween(startDate, endDate);
    const daysInRange = activeDatesList.length;

    return {
      totalAttendees: total,
      internalAttendees: intCount,
      externalAttendees: extCount,
      recordedDaysCount: recordedDates.size,
      totalDaysInRange: Math.max(daysInRange, 1),
    };
  }, [rangeRecords, startDate, endDate]);

  // 3. Calculate Daily Trend Data within selected date range
  const trendData = useMemo(() => {
    const dailyMap = new Map<string, { internal: number; external: number; total: number }>();

    // Dynamically iterate all dates within [startDate, endDate]
    const activeRangeDates = getDatesBetween(startDate, endDate);

    activeRangeDates.forEach((d) => {
      dailyMap.set(d.value, { internal: 0, external: 0, total: 0 });
    });

    rangeRecords.forEach((r) => {
      const canonDate = toCanonicalDate(r.date);
      const entry = dailyMap.get(canonDate);
      if (entry) {
        if (r.companyType === 'internal') {
          entry.internal += Number(r.attendees) || 0;
        } else {
          entry.external += Number(r.attendees) || 0;
        }
        entry.total = entry.internal + entry.external;
      }
    });

    const points = activeRangeDates.map((d) => {
      const stats = dailyMap.get(d.value) || { internal: 0, external: 0, total: 0 };
      return {
        date: d.value,
        shortLabel: d.short,
        fullLabel: d.label,
        internal: stats.internal,
        external: stats.external,
        total: stats.total,
        hasData: stats.total > 0,
      };
    });

    const activeDays = points.filter((d) => d.hasData);
    const countActive = Math.max(activeDays.length, 1);
    const sumInternal = activeDays.reduce((sum, d) => sum + d.internal, 0);
    const sumExternal = activeDays.reduce((sum, d) => sum + d.external, 0);
    const sumTotal = sumInternal + sumExternal;

    return {
      points,
      avgInternal: Math.round(sumInternal / countActive),
      avgExternal: Math.round(sumExternal / countActive),
      avgTotal: Math.round(sumTotal / countActive),
      totalRecordedDays: activeDays.length,
      daysInRange: points.length,
    };
  }, [rangeRecords, startDate, endDate]);

  // 4. Calculate Top 10 Companies by participation frequency (จำนวนครั้งการเข้าร่วม) within selected date range
  const top10Data = useMemo(() => {
    const timesMap = new Map<string, number>();
    const attendeeMap = new Map<string, number>();

    rangeRecords.forEach((r) => {
      const keyId = r.companyId;
      const keyName = r.companyName.trim().toLowerCase();
      // Each record entry = 1 time
      timesMap.set(keyId, (timesMap.get(keyId) || 0) + 1);
      timesMap.set(keyName, (timesMap.get(keyName) || 0) + 1);

      const att = Number(r.attendees) || 0;
      attendeeMap.set(keyId, (attendeeMap.get(keyId) || 0) + att);
      attendeeMap.set(keyName, (attendeeMap.get(keyName) || 0) + att);
    });

    const ranked = companies
      .map((c) => {
        const times =
          timesMap.get(c.id) ??
          timesMap.get(c.name.trim().toLowerCase()) ??
          0;
        const attendees =
          attendeeMap.get(c.id) ??
          attendeeMap.get(c.name.trim().toLowerCase()) ??
          0;
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          times,
          attendees,
        };
      })
      .sort((a, b) => {
        if (b.times !== a.times) {
          return b.times - a.times;
        }
        return b.attendees - a.attendees;
      })
      .slice(0, 10);

    const totalTimesAll = companies.reduce((sum, c) => {
      const t = timesMap.get(c.id) ?? timesMap.get(c.name.trim().toLowerCase()) ?? 0;
      return sum + t;
    }, 0);

    const top1 = ranked.length > 0 && ranked[0].times > 0 ? ranked[0] : null;
    const top1Share =
      totalTimesAll > 0 && top1
        ? Math.round((top1.times / totalTimesAll) * 100)
        : 0;

    return {
      companies: ranked,
      top1,
      top1Share,
      totalTimesAll,
    };
  }, [companies, rangeRecords]);

  // ---------------------------------------------------------
  // Render ECharts Line Chart (Daily Trend)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!lineChartRef.current) return;

    if (!lineInstance.current) {
      lineInstance.current = echarts.init(lineChartRef.current);
    }

    const chart = lineInstance.current;
    const dates = trendData.points.map((p) => p.shortLabel);
    const totals = trendData.points.map((p) => p.total);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: '#94a3b8', type: 'dashed' },
        },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const point = trendData.points[idx];
          const dateLabel = point?.shortLabel || params[0].axisValue;
          const totalVal = params[0]?.value ?? 0;
          return `
            <div style="font-family: Sarabun, sans-serif; padding: 4px 8px;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 13px;">
                ${point?.fullLabel || dateLabel}
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #0f3a5f;">
                วันที่ ${dateLabel}: รวมทั้งวัน <strong style="font-weight: 900; font-size: 13px; color: #0c2340;">${totalVal}</strong> คน
              </div>
            </div>
          `;
        },
      },
      legend: {
        right: 12,
        top: 0,
        textStyle: {
          color: '#0f3a5f',
          fontFamily: 'Sarabun, sans-serif',
          fontWeight: 'bold',
          fontSize: 11,
        },
        itemWidth: 14,
        itemHeight: 10,
        data: ['ยอดรวมผู้เข้าร่วมรายวัน'],
      },
      grid: {
        top: 36,
        left: 12,
        right: 20,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { alignWithLabel: true },
        axisLabel: {
          fontFamily: 'Sarabun, sans-serif',
          color: '#475569',
          fontSize: 11,
          fontWeight: 'bold',
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: {
          lineStyle: { color: '#f1f5f9', type: 'dashed' },
        },
        axisLabel: {
          fontFamily: 'Sarabun, sans-serif',
          color: '#64748b',
          fontSize: 11,
        },
      },
      series: [
        {
          name: 'ยอดรวมผู้เข้าร่วมรายวัน',
          type: 'line',
          data: totals,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#0f3a5f',
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          lineStyle: { width: 3.5, color: '#0f3a5f' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(15, 58, 95, 0.22)' },
              { offset: 1, color: 'rgba(15, 58, 95, 0.01)' },
            ]),
          },
          label: {
            show: true,
            position: 'top',
            color: '#0f3a5f',
            fontWeight: 'bold',
            fontSize: 11,
            fontFamily: 'Sarabun, sans-serif',
            formatter: (p) => `${p.value}`,
          },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trendData]);

  // ---------------------------------------------------------
  // Render ECharts Horizontal Bar Chart (Top 10)
  // ---------------------------------------------------------
  useEffect(() => {
    if (!barChartRef.current) return;

    if (!barInstance.current) {
      barInstance.current = echarts.init(barChartRef.current);
    }

    const chart = barInstance.current;
    const reversed = [...top10Data.companies].reverse();
    const names = reversed.map((c) => c.name);
    const values = reversed.map((c) => c.times);
    const types = reversed.map((c) => c.type);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!params || !params[0]) return '';
          const p = params[0];
          const c = reversed[p.dataIndex];
          return `
            <div style="font-family: Sarabun, sans-serif; padding: 4px 6px;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 13px;">${c?.name}</div>
              <div style="font-size: 12px; color: ${c?.type === 'internal' ? '#059669' : '#1d4ed8'}; font-weight: 700;">
                ประเภท: ${c?.type === 'internal' ? 'คู่ธุรกิจภายในพื้นที่' : 'คู่ธุรกิจนอกพื้นที่'}
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #0c2340; margin-top: 3px;">
                จำนวนครั้งการเข้าร่วม: ${p.value} ครั้ง
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 14,
        left: 12,
        right: 68,
        bottom: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: {
          fontFamily: 'Sarabun, sans-serif',
          color: '#64748b',
          fontSize: 11,
          formatter: '{value} ครั้ง',
        },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { alignWithLabel: true },
        axisLabel: {
          fontFamily: 'Sarabun, sans-serif',
          color: '#334155',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (val: string) => (val.length > 14 ? val.slice(0, 13) + '…' : val),
        },
      },
      series: [
        {
          name: 'จำนวนครั้งการเข้าร่วม',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: {
              color:
                types[idx] === 'internal'
                  ? new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                      { offset: 0, color: '#10b981' },
                      { offset: 1, color: '#047857' },
                    ])
                  : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                      { offset: 0, color: '#3b82f6' },
                      { offset: 1, color: '#1d4ed8' },
                    ]),
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barMaxWidth: 18,
          label: {
            show: true,
            position: 'right',
            color: '#0f172a',
            fontWeight: 'bold',
            fontSize: 11,
            fontFamily: 'Sarabun, sans-serif',
            formatter: '{c} ครั้ง',
          },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [top10Data]);

  return (
    <div className="mb-6">
      {/* ================= DATE RANGE PICKER (ตัวกรองช่วงวันที่) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Header Title & Info */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CalendarRange className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base whitespace-nowrap">
                  ตัวกรองช่วงวันที่วิเคราะห์ข้อมูล (Date Range Filter)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                  อัปเดตกราฟทันที
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 [word-break:keep-all] [line-break:strict]">
                เลือกช่วงวันที่เริ่มต้นและสิ้นสุด เพื่อคำนวณแนวโน้มรายวัน และจัดอันดับบริษัทที่เข้าร่วม Morning Talk มากที่สุดตามช่วงเวลานี้
              </p>
            </div>
          </div>

          {/* Date Range Inputs & Quick Presets */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* From Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">จากวันที่:</span>
              <select
                value={startDate}
                onChange={(e) => handleStartChange(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer pr-1 max-w-[140px] truncate"
              >
                {(availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.short}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={toCanonicalDate(startDate)}
                onChange={(e) => {
                  if (e.target.value) handleStartChange(e.target.value);
                }}
                className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer text-slate-700"
                title="เลือกจากปฏิทินอิสระ"
              />
            </div>

            <span className="text-slate-400 font-extrabold text-sm">→</span>

            {/* To Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">ถึงวันที่:</span>
              <select
                value={endDate}
                onChange={(e) => handleEndChange(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer pr-1 max-w-[140px] truncate"
              >
                {(availableDates && availableDates.length > 0 ? availableDates : SHUTDOWN_DATES).map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.short}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={toCanonicalDate(endDate)}
                onChange={(e) => {
                  if (e.target.value) handleEndChange(e.target.value);
                }}
                className="w-7 h-6 p-0 border-0 bg-transparent cursor-pointer text-slate-700"
                title="เลือกจากปฏิทินอิสระ"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 sm:ml-2">
              <button
                type="button"
                onClick={() => setQuickPreset('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                  startDate === defaultStart && endDate === defaultEnd
                    ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ตลอดโครงการ ({toThaiDateShort(defaultStart)}–{toThaiDateShort(defaultEnd)})
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset('w1')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                  isW1Selected
                    ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                สัปดาห์ 1 (16–22 ต.ค.)
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset('w2')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                  isW2Selected
                    ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                สัปดาห์ 2 (23–31 ต.ค.)
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Mini KPI Metrics Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-500">ช่วงวันที่กำลังวิเคราะห์:</span>
            <strong className="text-slate-900 font-extrabold whitespace-nowrap">
              {rangeSummaryText}
            </strong>
            <span className="text-slate-400 font-medium">({rangeKpiSummary.totalDaysInRange} วัน)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <span className="text-slate-600 whitespace-nowrap">
              ผู้เข้าร่วมรวมในช่วงนี้:{' '}
              <strong className="text-indigo-950 font-black tabular-nums text-sm">
                {rangeKpiSummary.totalAttendees.toLocaleString()}
              </strong>{' '}
              คน
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 whitespace-nowrap">
              ในพื้นที่:{' '}
              <strong className="text-emerald-700 font-extrabold tabular-nums">
                {rangeKpiSummary.internalAttendees.toLocaleString()}
              </strong>{' '}
              คน
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600 whitespace-nowrap">
              นอกพื้นที่:{' '}
              <strong className="text-blue-700 font-extrabold tabular-nums">
                {rangeKpiSummary.externalAttendees.toLocaleString()}
              </strong>{' '}
              คน
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 whitespace-nowrap">
              มีข้อมูลบันทึก:{' '}
              <strong className="text-slate-800 font-bold">
                {rangeKpiSummary.recordedDaysCount}
              </strong>{' '}
              / {rangeKpiSummary.totalDaysInRange} วัน
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2 CHARTS IN GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: แนวโน้มจำนวนผู้เข้าร่วมรายวัน (Line Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 whitespace-nowrap">
                    แนวโน้มตามช่วงเวลา
                  </span>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {rangeSummaryText}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 whitespace-nowrap">
                  แนวโน้มจำนวนผู้เข้าร่วมรายวัน
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                  ยอดรวมผู้เข้าร่วมฟัง Morning Talk ทั้งหมดในแต่ละวัน ({rangeSummaryText})
                </p>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full h-[280px] mt-2">
              <div ref={lineChartRef} className="w-full h-full" />
            </div>
          </div>

          {/* Bottom Averages Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0f3a5f]" />
              <span className="font-semibold text-slate-600">เฉลี่ยรวมทั้งหมด:</span>
              <strong className="text-[#0f3a5f] font-black tabular-nums text-sm">
                {trendData.avgTotal.toLocaleString()} คน/วัน
              </strong>
            </div>

            <div className="text-right text-slate-500 whitespace-nowrap text-[11px]">
              <span>บันทึกแล้ว:</span>{' '}
              <strong className="text-slate-800 font-bold tabular-nums">
                {trendData.totalRecordedDays}
              </strong>{' '}
              / {trendData.daysInRange} วันในช่วงนี้
            </div>
          </div>
        </div>

        {/* Chart 2: อันดับบริษัทที่เข้าร่วม Morning Talk มากที่สุด (Horizontal Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-50 text-amber-700">
                    <Trophy className="w-4 h-4 text-amber-600" />
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                    Top 10 ตามช่วงเวลา
                  </span>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {rangeSummaryText}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 whitespace-nowrap">
                  อันดับบริษัทที่เข้าร่วม Morning Talk มากที่สุด
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                  10 อันดับแรกที่มีจำนวนครั้งการเข้าร่วมสูงสุดในช่วงวันที่เลือก (เขียว = ในพื้นที่, น้ำเงิน = นอกพื้นที่)
                </p>
              </div>

              {/* Medal Summary Badge */}
              {top10Data.top1 && (
                <div className="text-right shrink-0 bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wider whitespace-nowrap">
                    🥇 อันดับ 1 ช่วงนี้
                  </div>
                  <div className="text-xs font-black text-amber-950 whitespace-nowrap">
                    {top10Data.top1.name} ({top10Data.top1.times} ครั้ง)
                  </div>
                </div>
              )}
            </div>

            {/* Top 3 Medals Pill List */}
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {top10Data.companies.slice(0, 3).map((comp, idx) => {
                const medals = [
                  { label: '1st', bg: 'bg-amber-50 border-amber-200 text-amber-800', medal: '🥇' },
                  { label: '2nd', bg: 'bg-slate-50 border-slate-200 text-slate-700', medal: '🥈' },
                  { label: '3rd', bg: 'bg-orange-50 border-orange-200 text-orange-800', medal: '🥉' },
                ];
                const m = medals[idx];
                return (
                  <div
                    key={comp.id}
                    className={`p-2 rounded-lg border ${m.bg} flex items-center justify-between text-xs whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{m.medal}</span>
                      <span className="font-bold truncate text-[11px]">{comp.name}</span>
                    </div>
                    <span className="font-extrabold tabular-nums ml-1 text-slate-900 shrink-0 text-[11px]">
                      {comp.times} ครั้ง
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Canvas */}
            <div className="relative w-full h-[230px] mt-1">
              <div ref={barChartRef} className="w-full h-full" />
            </div>
          </div>

          {/* Bottom Note */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500 whitespace-nowrap">
            {top10Data.top1 ? (
              <span className="whitespace-nowrap">
                ช่วงวันที่ {rangeSummaryText} · อันดับ 1:{' '}
                <strong className="text-slate-900 font-bold">
                  {top10Data.top1.name}
                </strong>{' '}
                ({top10Data.top1.times.toLocaleString()} ครั้ง) คิดเป็น{' '}
                <strong className="text-amber-700 font-extrabold">
                  {top10Data.top1Share}%
                </strong>{' '}
                ของการเข้าร่วมทั้งหมดในช่วงนี้ ({top10Data.totalTimesAll.toLocaleString()} ครั้ง)
              </span>
            ) : (
              <span className="whitespace-nowrap">
                ช่วงวันที่ {rangeSummaryText} · ยังไม่มีข้อมูลการเข้าร่วมในช่วงวันที่เลือก
              </span>
            )}

            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              รวมการเข้าร่วม {top10Data.totalTimesAll.toLocaleString()} ครั้ง
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
