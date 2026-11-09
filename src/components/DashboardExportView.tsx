import React, { forwardRef, useMemo } from 'react';
import { Company, AttendanceRecord, QuickStats, IncidentRecord } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { isSameDate, toCanonicalDate, toThaiDateShort, toThaiDateBuddhist, getDatesBetween } from '../utils/dateUtils';
import {
  ShieldCheck,
  Building,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';

export interface DashboardExportViewProps {
  companies: Company[];
  records: AttendanceRecord[];
  allRecords?: AttendanceRecord[];
  stats: QuickStats;
  selectedDate?: string;
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
  cumulativeStats?: QuickStats;
  exportTimestamp?: Date;
  summaryDateText?: string;
  incidents?: IncidentRecord[];
  rangeStartDate?: string;
  rangeEndDate?: string;
}

// ---------------------------------------------------------
// SVG Bar Chart for Export (Rotated 45° company names, Crisp Vector)
// ---------------------------------------------------------
interface SvgBarChartProps {
  companies: Company[];
  type: 'internal' | 'external';
  maxAttendees: number;
}

const SvgBarChart: React.FC<SvgBarChartProps> = ({ companies, type, maxAttendees }) => {
  const isInternal = type === 'internal';
  const width = 900;
  const height = 300;
  const baselineY = 205;
  const n = companies.length;
  const padLeft = 24;
  const padRight = 16;
  const colWidth = (width - padLeft - padRight) / Math.max(n, 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id={`grad-exp-${type}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isInternal ? '#10b981' : '#3b82f6'} />
          <stop offset="100%" stopColor={isInternal ? '#047857' : '#1d4ed8'} />
        </linearGradient>
      </defs>

      {/* Grid lines (light dashed) */}
      {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
        const lineY = baselineY - ratio * 155;
        return (
          <line
            key={ratio}
            x1={padLeft - 6}
            y1={lineY}
            x2={width - padRight + 6}
            y2={lineY}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
        );
      })}

      {/* Baseline Line */}
      <line
        x1={padLeft - 6}
        y1={baselineY}
        x2={width - padRight + 6}
        y2={baselineY}
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Bars, Values, and Rotated Labels */}
      {companies.map((comp, i) => {
        const cx = padLeft + (i + 0.5) * colWidth;
        const barWidth = Math.min(Math.max(colWidth * 0.65, 12), 26);
        const attendees = comp.totalAttendees;
        const hasAttendees = attendees > 0;
        const barH = maxAttendees > 0 ? (attendees / maxAttendees) * 150 : 0;
        const actualH = hasAttendees ? Math.max(barH, 6) : 2;
        const barY = baselineY - actualH;
        const barColor = hasAttendees ? `url(#grad-exp-${type})` : '#e2e8f0';
        const numColor = hasAttendees
          ? isInternal
            ? '#047857'
            : '#1d4ed8'
          : 'transparent';

        return (
          <g key={comp.id}>
            {/* Top Attendee Number */}
            {hasAttendees && (
              <text
                x={cx}
                y={barY - 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={numColor}
                fontFamily="'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif"
              >
                {attendees}
              </text>
            )}

            {/* Bar Rect */}
            <rect
              x={cx - barWidth / 2}
              y={barY}
              width={barWidth}
              height={actualH}
              rx={3}
              ry={3}
              fill={barColor}
            />

            {/* Company Name Label: rotated 45 deg */}
            <g transform={`translate(${cx}, ${baselineY + 10}) rotate(45)`}>
              <text
                x="0"
                y="0"
                textAnchor="start"
                dominantBaseline="hanging"
                fontSize="10"
                fontWeight={hasAttendees ? '800' : '600'}
                fill={hasAttendees ? '#0f172a' : '#64748b'}
                fontFamily="'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif"
                letterSpacing="0.01em"
              >
                {comp.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------
// SVG Daily Trend Line Chart (Filtered by Date Range, Internal & External lines)
// ---------------------------------------------------------
interface SvgTrendLineChartProps {
  records: AttendanceRecord[];
  selectedDate?: string;
  rangeStartDate?: string;
  rangeEndDate?: string;
}

const SvgTrendLineChart: React.FC<SvgTrendLineChartProps> = ({
  records,
  selectedDate,
  rangeStartDate = '2026-10-16',
  rangeEndDate = '2026-10-31',
}) => {
  const width = 900;
  const height = 240;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 26;
  const baselineY = 200;
  const chartH = baselineY - padTop;
  const chartW = width - padLeft - padRight;

  // Aggregate daily counts across dates within [rangeStartDate, rangeEndDate]
  const dailySeries = useMemo(() => {
    const activeDates = getDatesBetween(rangeStartDate, rangeEndDate);

    return activeDates.map((day, idx) => {
      const dayRecords = records.filter((r) => isSameDate(r.date, day.value));
      const internal = dayRecords
        .filter((r) => r.companyType === 'internal')
        .reduce((sum, r) => sum + (Number(r.attendees) || 0), 0);
      const external = dayRecords
        .filter((r) => r.companyType === 'external')
        .reduce((sum, r) => sum + (Number(r.attendees) || 0), 0);
      const total = internal + external;
      return {
        ...day,
        idx,
        internal,
        external,
        total,
        hasData: dayRecords.length > 0,
      };
    });
  }, [records, rangeStartDate, rangeEndDate]);

  const maxDaily = useMemo(() => {
    let max = 0;
    dailySeries.forEach((d) => {
      if (d.total > max) max = d.total;
    });
    return Math.max(max, 10);
  }, [dailySeries]);

  const stepX = dailySeries.length > 1 ? chartW / (dailySeries.length - 1) : 0;

  // Calculate points for total attendees
  const totalPoints = dailySeries.map((d, i) => {
    const x = dailySeries.length === 1 ? padLeft + chartW / 2 : padLeft + i * stepX;
    const y = baselineY - (d.total / maxDaily) * chartH;
    return { x, y, val: d.total, hasData: d.hasData, short: d.short, value: d.value };
  });

  const makeSvgPath = (points: { x: number; y: number }[]) => {
    if (!points.length) return '';
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  };

  const canonSelected = selectedDate ? toCanonicalDate(selectedDate) : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id="grad-exp-trend-total" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3a5f" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f3a5f" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Light dashed grid lines */}
      {[0.25, 0.5, 0.75, 1.0].map((r) => {
        const y = baselineY - r * chartH;
        const val = Math.round(r * maxDaily);
        return (
          <g key={r}>
            <line
              x1={padLeft - 6}
              y1={y}
              x2={width - padRight + 6}
              y2={y}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <text
              x={padLeft - 10}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
              fontWeight="600"
              fontFamily="'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Baseline */}
      <line
        x1={padLeft - 6}
        y1={baselineY}
        x2={width - padRight + 6}
        y2={baselineY}
        stroke="#cbd5e1"
        strokeWidth="1.5"
      />

      {/* Selected Date highlight column if active and within range */}
      {dailySeries.map((d, i) => {
        if (d.value === canonSelected) {
          const x = dailySeries.length === 1 ? padLeft + chartW / 2 : padLeft + i * stepX;
          return (
            <rect
              key={d.value}
              x={x - 14}
              y={padTop - 6}
              width={28}
              height={chartH + 12}
              fill="rgba(15, 58, 95, 0.12)"
              rx={6}
            />
          );
        }
        return null;
      })}

      {/* Area fill under total curve */}
      {totalPoints.length > 1 && (
        <polygon
          points={`${totalPoints[0].x},${baselineY} ${totalPoints.map((p) => `${p.x},${p.y}`).join(' ')} ${totalPoints[totalPoints.length - 1].x},${baselineY}`}
          fill="url(#grad-exp-trend-total)"
        />
      )}

      {/* Total Path (Navy #0f3a5f) */}
      {totalPoints.length > 1 && (
        <path
          d={makeSvgPath(totalPoints)}
          fill="none"
          stroke="#0f3a5f"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points and Values */}
      {totalPoints.map((pt, i) => {
        const isCurrent = pt.value === canonSelected;
        return (
          <g key={`total-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isCurrent ? 6 : 4.5}
              fill="#0f3a5f"
              stroke="#ffffff"
              strokeWidth={isCurrent ? 2.8 : 2}
            />
            <text
              x={pt.x}
              y={pt.y - 7}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill="#0f3a5f"
              fontFamily="'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif"
            >
              {pt.val}
            </text>
          </g>
        );
      })}

      {/* Date Labels along bottom */}
      {dailySeries.map((d, i) => {
        const x = dailySeries.length === 1 ? padLeft + chartW / 2 : padLeft + i * stepX;
        const isCurrent = d.value === canonSelected;
        return (
          <text
            key={d.value}
            x={x}
            y={baselineY + 16}
            textAnchor="middle"
            fontSize="9"
            fontWeight={isCurrent ? '800' : '600'}
            fill={isCurrent ? '#0369a1' : '#64748b'}
            fontFamily="'Sarabun', 'Plus Jakarta Sans', system-ui, sans-serif"
          >
            {d.short}
          </text>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------
// Main Export View Container (1920x1080 16:9 Landscape)
// ---------------------------------------------------------
export const DashboardExportView = forwardRef<HTMLDivElement, DashboardExportViewProps>(
  (
    {
      companies,
      records = [],
      allRecords,
      stats,
      selectedDate = '2026-10-21',
      selectedDateLabel = '21 ต.ค. 2026',
      viewMode = 'daily',
      cumulativeStats,
      summaryDateText = '21 ตุลาคม 2569',
      incidents = [],
      rangeStartDate = '2026-10-16',
      rangeEndDate = '2026-10-31',
    },
    ref
  ) => {
    const isDaily = viewMode === 'daily';
    const effectiveAllRecords = allRecords || records;

    // Separate companies by type
    const internalCompanies = companies.filter((c) => c.type === 'internal');
    const externalCompanies = companies.filter((c) => c.type === 'external');

    // Sort descending by total attendees for display in current viewMode
    const sortedInternal = [...internalCompanies].sort((a, b) => b.totalAttendees - a.totalAttendees);
    const sortedExternal = [...externalCompanies].sort((a, b) => b.totalAttendees - a.totalAttendees);

    const displayInternalCount = stats.internalAttendeesCount ?? 0;
    const displayExternalCount = stats.externalAttendeesCount ?? 0;
    const displayTotalCount = stats.totalAttendeesCount ?? 0;

    const displayInternalActive = stats.internalCompaniesWithAttendees ?? 0;
    const displayExternalActive = stats.externalCompaniesWithAttendees ?? 0;
    const displayTotalActive =
      stats.participatingCompaniesCount ?? displayInternalActive + displayExternalActive;

    const maxInternalAttendees = Math.max(...sortedInternal.map((c) => c.totalAttendees), 1);
    const maxExternalAttendees = Math.max(...sortedExternal.map((c) => c.totalAttendees), 1);

    const formattedSummaryDate = summaryDateText?.trim() || '21 ตุลาคม 2569';
    const incidentCount = incidents.length;
    const latestIncident = incidents.length > 0 ? incidents[0] : null;

    // Thai formatted Date Range labels
    const rangeShortText =
      rangeStartDate === rangeEndDate
        ? toThaiDateShort(rangeStartDate)
        : `${toThaiDateShort(rangeStartDate)} – ${toThaiDateShort(rangeEndDate)} 2569`;

    // ---------------------------------------------------------
    // Filter records strictly within [rangeStartDate, rangeEndDate]
    // ---------------------------------------------------------
    const rangeRecords = useMemo(() => {
      return effectiveAllRecords.filter((r) => {
        const canon = toCanonicalDate(r.date);
        return canon >= rangeStartDate && canon <= rangeEndDate;
      });
    }, [effectiveAllRecords, rangeStartDate, rangeEndDate]);

    // ---------------------------------------------------------
    // Top 10 Companies by participation frequency (จำนวนครั้ง) strictly within selected date range
    // ---------------------------------------------------------
    const top10Companies = useMemo(() => {
      const timesMap = new Map<string, number>();
      const attendeeMap = new Map<string, number>();
      rangeRecords.forEach((r) => {
        const keyId = r.companyId;
        const keyName = r.companyName.trim().toLowerCase();
        // Each record entry = 1 time
        timesMap.set(keyId, (timesMap.get(keyId) || 0) + 1);
        timesMap.set(keyName, (timesMap.get(keyName) || 0) + 1);

        const count = Number(r.attendees) || 0;
        attendeeMap.set(keyId, (attendeeMap.get(keyId) || 0) + count);
        attendeeMap.set(keyName, (attendeeMap.get(keyName) || 0) + count);
      });

      const list = companies.map((c) => ({
        ...c,
        rangeTimes:
          timesMap.get(c.id) ?? timesMap.get(c.name.trim().toLowerCase()) ?? 0,
        rangeAttendees:
          attendeeMap.get(c.id) ?? attendeeMap.get(c.name.trim().toLowerCase()) ?? 0,
      }));

      return list
        .sort((a, b) => {
          if (b.rangeTimes !== a.rangeTimes) {
            return b.rangeTimes - a.rangeTimes;
          }
          return b.rangeAttendees - a.rangeAttendees;
        })
        .slice(0, 10);
    }, [companies, rangeRecords]);

    const maxTop10Times = Math.max(...top10Companies.map((c) => c.rangeTimes), 1);
    const totalRangeTimes = useMemo(() => {
      return rangeRecords.length;
    }, [rangeRecords]);

    const top1 = top10Companies[0];
    const top1Share =
      totalRangeTimes > 0 && top1 && top1.rangeTimes > 0
        ? Math.round((top1.rangeTimes / totalRangeTimes) * 100)
        : 0;

    // Daily averages within selected range for Chart 3 footer
    const dailyAverages = useMemo(() => {
      const activeDaysMap = new Map<string, { internal: number; external: number }>();
      rangeRecords.forEach((r) => {
        const canon = toCanonicalDate(r.date);
        const curr = activeDaysMap.get(canon) || { internal: 0, external: 0 };
        if (r.companyType === 'internal') {
          curr.internal += Number(r.attendees) || 0;
        } else {
          curr.external += Number(r.attendees) || 0;
        }
        activeDaysMap.set(canon, curr);
      });

      const dayCount = Math.max(activeDaysMap.size, 1);
      let totalInt = 0;
      let totalExt = 0;
      activeDaysMap.forEach((v) => {
        totalInt += v.internal;
        totalExt += v.external;
      });

      const daysInRange = SHUTDOWN_DATES.filter(
        (d) => d.value >= rangeStartDate && d.value <= rangeEndDate
      ).length;

      return {
        avgInternal: Math.round(totalInt / dayCount),
        avgExternal: Math.round(totalExt / dayCount),
        avgTotal: Math.round((totalInt + totalExt) / dayCount),
        activeDaysCount: activeDaysMap.size,
        daysInRange: Math.max(daysInRange, 1),
      };
    }, [rangeRecords, rangeStartDate, rangeEndDate]);

    return (
      <div
        ref={ref}
        id="dashboard-export-container"
        style={{
          width: '1920px',
          height: '1080px',
          padding: '16px 24px',
          boxSizing: 'border-box',
          fontFamily: "'Sarabun', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          color: '#0f172a',
          backgroundColor: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          position: 'relative',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          wordBreak: 'keep-all',
          lineBreak: 'strict',
        }}
      >
        {/* ================= 1. แถบ HEADER (สีกรมท่า) ================= */}
        <div
          style={{
            backgroundColor: '#0c2340',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '10px 24px',
            boxShadow: '0 6px 14px -2px rgba(12, 35, 64, 0.3)',
            border: '1px solid rgba(30, 58, 138, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            marginBottom: '10px',
          }}
        >
          {/* Left: SCGP Logo, Title, OHS Badge, Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* SCGP Logo Badge on White */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '4px 12px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="/assets/aistudio/scgp_trimmed.png"
                alt="SCGP Logo"
                style={{ height: '30px', width: 'auto', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    '/assets/aistudio/New-SCGP_Logo_3_5535ee08.jpg';
                }}
              />
            </div>

            {/* Vertical Divider */}
            <div style={{ height: '28px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.25)' }} />

            {/* Safety Shield Icon */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                flexShrink: 0,
              }}
            >
              <ShieldCheck style={{ width: '18px', height: '18px', color: '#34d399' }} />
            </div>

            {/* Title & Subtitle */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                <span
                  style={{
                    fontSize: '17px',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Safety Morning Talk
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    backgroundColor: 'rgba(16, 185, 129, 0.25)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  OHS &amp; SAFETY
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  marginTop: '1px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#34d399' }} />
                  ระบบยอมรับได้
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  PPPC ขอนแก่น Major Shutdown 2026 (มาสเตอร์ลิสต์ 45 คู่ธุรกิจ)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Date Badge & CARE FOR ALL Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Summary Date Badge */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1.2px solid #38bdf8',
                borderRadius: '10px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Calendar style={{ width: '14px', height: '14px', color: '#38bdf8' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                ข้อมูลประจำวันที่: {selectedDateLabel} ({formattedSummaryDate})
              </span>
            </div>

            {/* GARE / CARE FOR ALL Logo on White Frame */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '4px 10px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="/assets/aistudio/care_for_all_transparent.png"
                alt="CARE FOR ALL"
                style={{ height: '30px', width: 'auto', objectFit: 'contain', display: 'block' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= 2. การ์ด KPI 4 ใบ (เรียงในแถวเดียวกัน) ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            flexShrink: 0,
            marginBottom: '10px',
          }}
        >
          {/* Card 1: คู่ธุรกิจภายในพื้นที่ (เขียว #10b981) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '12px 20px 12px 18px',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #10b981',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#059669',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Building style={{ width: '14px', height: '14px', color: '#10b981' }} />
                  คู่ธุรกิจภายในพื้นที่
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isDaily ? `ยอดวัน (${selectedDateLabel})` : 'ยอดสะสมโครงการ'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.1,
                  margin: '2px 0',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayInternalCount.toLocaleString()}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '5px' }}>
                  {isDaily ? 'คนวันนี้' : 'คนสะสม'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
                บริษัทที่มีคนเข้าร่วม:{' '}
                <strong style={{ color: '#059669', fontWeight: 800 }}>
                  {displayInternalActive}
                </strong>{' '}
                / {internalCompanies.length} แห่ง
              </div>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', marginBottom: '1px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>สัดส่วนในกลุ่มผู้เข้าร่วมวันนี้</span>
                <span style={{ fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap' }}>
                  {stats.internalSharePercent}%
                </span>
              </div>
              {cumulativeStats && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>สะสมรวมทั้งโครงการ</span>
                  <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                    {cumulativeStats.internalAttendeesCount.toLocaleString()} คน
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: คู่ธุรกิจนอกพื้นที่ (น้ำเงิน #2563ab) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '12px 20px 12px 18px',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #2563ab',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#1d4ed8',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Layers style={{ width: '14px', height: '14px', color: '#2563ab' }} />
                  คู่ธุรกิจนอกพื้นที่
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isDaily ? `ยอดวัน (${selectedDateLabel})` : 'ยอดสะสมโครงการ'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#0f172a',
                  lineHeight: 1.1,
                  margin: '2px 0',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayExternalCount.toLocaleString()}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '5px' }}>
                  {isDaily ? 'คนวันนี้' : 'คนสะสม'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
                บริษัทที่มีคนเข้าร่วม:{' '}
                <strong style={{ color: '#1d4ed8', fontWeight: 800 }}>
                  {displayExternalActive}
                </strong>{' '}
                / {externalCompanies.length} แห่ง
              </div>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', marginBottom: '1px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>สัดส่วนในกลุ่มผู้เข้าร่วมวันนี้</span>
                <span style={{ fontWeight: 800, color: '#2563ab', whiteSpace: 'nowrap' }}>
                  {stats.externalSharePercent}%
                </span>
              </div>
              {cumulativeStats && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>สะสมรวมทั้งโครงการ</span>
                  <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                    {cumulativeStats.externalAttendeesCount.toLocaleString()} คน
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: รวมผู้เข้าร่วมทั้งหมด (กรมท่า #0c2340) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '12px 20px 12px 18px',
              border: '1px solid #e2e8f0',
              borderTop: '4px solid #0c2340',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#0c2340',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Users style={{ width: '14px', height: '14px', color: '#0c2340' }} />
                  รวมผู้เข้าร่วมทั้งหมด
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isDaily ? `ยอดวัน (${selectedDateLabel})` : 'ยอดสะสมโครงการ'}
                </span>
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#0c2340',
                  lineHeight: 1.1,
                  margin: '2px 0',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayTotalCount.toLocaleString()}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '5px' }}>
                  {isDaily ? 'คนวันนี้' : 'คนสะสม'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
                คู่ธุรกิจที่บันทึกแล้ว:{' '}
                <strong style={{ color: '#0c2340', fontWeight: 800 }}>
                  {displayTotalActive}
                </strong>{' '}
                / {companies.length} แห่ง
              </div>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', marginBottom: '1px' }}>
                <span style={{ whiteSpace: 'nowrap' }}>เฉลี่ยต่อบริษัทที่เข้า</span>
                <span style={{ fontWeight: 800, color: '#0c2340', whiteSpace: 'nowrap' }}>
                  {stats.avgAttendeesPerCompany} คน/แห่ง
                </span>
              </div>
              {cumulativeStats && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>สะสมรวมทั้งโครงการ</span>
                  <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                    {cumulativeStats.totalAttendeesCount.toLocaleString()} คน
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: สรุปจำนวนอุบัติเหตุ (แดง #ef4444 หรือ เขียว #10b981) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '12px 20px 12px 18px',
              border: '1px solid #e2e8f0',
              borderTop: incidentCount === 0 ? '4px solid #10b981' : '4px solid #ef4444',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: incidentCount === 0 ? '#059669' : '#dc2626',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <AlertTriangle style={{ width: '14px', height: '14px', color: incidentCount === 0 ? '#10b981' : '#ef4444' }} />
                  สรุปจำนวนอุบัติเหตุ
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  อุบัติเหตุทั้งหมด
                </span>
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: incidentCount === 0 ? '#059669' : '#dc2626',
                  lineHeight: 1.1,
                  margin: '2px 0',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {incidentCount}
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginLeft: '5px' }}>
                  รายการ
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
                {incidentCount === 0 ? (
                  <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px', color: '#10b981' }} />
                    ไม่มีเหตุการณ์เกิดขึ้นในพื้นที่
                  </span>
                ) : (
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>
                    ล่าสุด: {latestIncident?.date} ({latestIncident?.typeName})
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '1px', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#475569', fontSize: '10px', flexShrink: 0 }}>สถานะความปลอดภัย:</span>
                {incidentCount === 0 ? (
                  <span style={{ fontWeight: 800, fontSize: '9.5px', color: '#059669', backgroundColor: '#d1fae5', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                    ✓ Zero Accident 100%
                  </span>
                ) : (
                  <span style={{ fontWeight: 800, fontSize: '9.5px', color: '#dc2626', backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
                    ⚠ มีรายการ {incidentCount} รายการ
                  </span>
                )}
              </div>
              <div style={{ color: '#64748b', fontSize: '10px', whiteSpace: 'nowrap' }}>
                {latestIncident ? (
                  <span>บริษัท: <strong style={{ color: '#334155' }}>{latestIncident.companyName}</strong></span>
                ) : (
                  <span>สถานะพื้นที่: ปลอดภัยตามมาตรฐาน</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. กราฟ 4 ใบ (2x2 Grid) ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '10px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Row 1, Left: กราฟแท่งคู่ธุรกิจภายในพื้นที่ (เขียว) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '10px 16px 8px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '4px',
                borderBottom: '1px solid #f1f5f9',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      padding: '1.5px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ภายในพื้นที่
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    คู่ธุรกิจภายในพื้นที่ ({internalCompanies.length} แห่ง)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isDaily ? `ยอดวัน (${selectedDateLabel})` : 'สะสมโครงการ'}:
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {displayInternalCount.toLocaleString()} คน
                </span>
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <SvgBarChart
                companies={sortedInternal}
                type="internal"
                maxAttendees={maxInternalAttendees}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '4px',
                borderTop: '1px solid #f8fafc',
                fontSize: '9.5px',
                color: '#64748b',
                flexShrink: 0,
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>แท่งกราฟเรียงลำดับจากมากไปน้อย (ชื่อบริษัทเอียง 45°)</span>
              <span style={{ fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                มีผู้เข้าร่วม {displayInternalActive} จาก {internalCompanies.length} แห่ง
              </span>
            </div>
          </div>

          {/* Row 1, Right: กราฟแท่งคู่ธุรกิจนอกพื้นที่ (น้ำเงิน) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '10px 16px 8px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '4px',
                borderBottom: '1px solid #f1f5f9',
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      backgroundColor: '#eff6ff',
                      color: '#1e40af',
                      padding: '1.5px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    นอกพื้นที่
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                    คู่ธุรกิจนอกพื้นที่ ({externalCompanies.length} แห่ง)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isDaily ? `ยอดวัน (${selectedDateLabel})` : 'สะสมโครงการ'}:
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#2563ab', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {displayExternalCount.toLocaleString()} คน
                </span>
              </div>
            </div>

            {/* SVG Chart Canvas */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <SvgBarChart
                companies={sortedExternal}
                type="external"
                maxAttendees={maxExternalAttendees}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '4px',
                borderTop: '1px solid #f8fafc',
                fontSize: '9.5px',
                color: '#64748b',
                flexShrink: 0,
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>แท่งกราฟเรียงลำดับจากมากไปน้อย (ชื่อบริษัทเอียง 45°)</span>
              <span style={{ fontWeight: 700, color: '#2563ab', whiteSpace: 'nowrap' }}>
                มีผู้เข้าร่วม {displayExternalActive} จาก {externalCompanies.length} แห่ง
              </span>
            </div>
          </div>

          {/* Row 2, Left: กราฟเส้นแนวโน้มจำนวนผู้เข้าร่วมรายวัน (Filtered by Date Range) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '10px 16px 8px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            {/* Header with Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '4px',
                borderBottom: '1px solid #f1f5f9',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp style={{ width: '14px', height: '14px' }} />
                </span>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
                    แนวโน้มจำนวนผู้เข้าร่วมรายวัน ({rangeShortText})
                  </h4>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f3a5f', whiteSpace: 'nowrap' }}>
                  <span style={{ width: '12px', height: '3.5px', backgroundColor: '#0f3a5f', borderRadius: '2px' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#0f3a5f' }} />
                  ยอดรวมผู้เข้าร่วมรายวัน
                </span>
              </div>
            </div>

            {/* SVG Trend Line Chart Canvas */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <SvgTrendLineChart
                records={effectiveAllRecords}
                selectedDate={selectedDate}
                rangeStartDate={rangeStartDate}
                rangeEndDate={rangeEndDate}
              />
            </div>

            {/* Footer Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '4px',
                borderTop: '1px solid #f8fafc',
                fontSize: '9.5px',
                color: '#64748b',
                flexShrink: 0,
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>
                เฉลี่ยรวมทั้งหมด: <strong style={{ color: '#0f3a5f', fontWeight: 900 }}>{dailyAverages.avgTotal}</strong> คน/วัน
              </span>
              <span style={{ fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                ช่วงเวลาที่เลือก: {dailyAverages.daysInRange} วัน
              </span>
            </div>
          </div>

          {/* Row 2, Right: อันดับบริษัทที่เข้าร่วม Morning Talk มากที่สุด (Top 10 ช่วงวันที่เลือก) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '10px 16px 8px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '4px',
                borderBottom: '1px solid #f1f5f9',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award style={{ width: '14px', height: '14px' }} />
                </span>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
                    อันดับบริษัทที่เข้าร่วม Morning Talk มากที่สุด
                  </h4>
                </div>
              </div>

              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Top 10 ช่วงวันที่ {rangeShortText} (นับจำนวนครั้ง)
              </span>
            </div>

            {/* Top 10 List */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                padding: '4px 0',
              }}
            >
              {top10Companies.map((comp, idx) => {
                const rank = idx + 1;
                const isRank1 = rank === 1;
                const isRank2 = rank === 2;
                const isRank3 = rank === 3;
                const isInt = comp.type === 'internal';
                const barPercent =
                  maxTop10Times > 0
                    ? Math.max((comp.rangeTimes / maxTop10Times) * 100, 2)
                    : 0;

                return (
                  <div
                    key={comp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '10px',
                      height: '18px',
                    }}
                  >
                    {/* Rank Badge */}
                    <div
                      style={{
                        width: '20px',
                        textAlign: 'center',
                        flexShrink: 0,
                        fontWeight: 900,
                        fontSize: isRank1 || isRank2 || isRank3 ? '12px' : '10px',
                      }}
                    >
                      {isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : rank}
                    </div>

                    {/* Company Name */}
                    <div
                      style={{
                        width: '130px',
                        fontWeight: 700,
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flexShrink: 0,
                      }}
                    >
                      {comp.name}
                    </div>

                    {/* Type pill */}
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: isInt ? '#ecfdf5' : '#eff6ff',
                        color: isInt ? '#047857' : '#1e40af',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {isInt ? 'ใน' : 'นอก'}
                    </span>

                    {/* Horizontal Bar */}
                    <div
                      style={{
                        flex: 1,
                        height: '9px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: `${barPercent}%`,
                          height: '100%',
                          backgroundColor: isInt ? '#10b981' : '#3b82f6',
                          borderRadius: '4px',
                        }}
                      />
                    </div>

                    {/* Attendance Times Count */}
                    <div
                      style={{
                        width: '50px',
                        textAlign: 'right',
                        fontWeight: 800,
                        color: '#0f172a',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {comp.rangeTimes.toLocaleString()} ครั้ง
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '4px',
                borderTop: '1px solid #f8fafc',
                fontSize: '9.5px',
                color: '#64748b',
                flexShrink: 0,
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>
                ช่วงวันที่ {rangeShortText} · 🏆 อันดับ 1:{' '}
                <strong style={{ color: '#0f172a' }}>{top1 && top1.rangeTimes > 0 ? top1.name : '-'}</strong> (
                {top1 && top1.rangeTimes > 0 ? (top1.type === 'internal' ? 'ภายใน' : 'นอกพื้นที่') : ''}){' '}
                <strong style={{ color: '#d97706' }}>
                  {top1 ? top1.rangeTimes.toLocaleString() : 0} ครั้ง
                </strong>
              </span>
              <span style={{ fontWeight: 700, color: '#0c2340', whiteSpace: 'nowrap' }}>
                {top1 && top1.rangeTimes > 0
                  ? `คิดเป็น ${top1Share}% ของการเข้าร่วมทั้งหมดในช่วงนี้ (${totalRangeTimes.toLocaleString()} ครั้ง)`
                  : `ยังไม่มีข้อมูลการเข้าร่วมในช่วงนี้`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DashboardExportView.displayName = 'DashboardExportView';
