import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Company } from '../types';
import { BarChart3, Calendar } from 'lucide-react';

interface AttendanceChartsProps {
  companies: Company[];
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
}

interface SingleChartProps {
  title: string;
  badgeText: string;
  badgeBg: string;
  badgeTextColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
  companies: Company[];
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
}

const SingleChart: React.FC<SingleChartProps> = ({
  title,
  badgeText,
  badgeBg,
  badgeTextColor,
  accentColor,
  gradientStart,
  gradientEnd,
  companies,
  selectedDateLabel = '16 ต.ค. 2026',
  viewMode = 'daily',
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Filter only companies that have attendees (> 0) and sort descending
  const activeCompanies = companies
    .filter((c) => c.totalAttendees > 0)
    .sort((a, b) => b.totalAttendees - a.totalAttendees);

  const totalAttendees = companies.reduce((sum, c) => sum + c.totalAttendees, 0);

  useEffect(() => {
    if (!chartRef.current) return;

    if (activeCompanies.length === 0) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
      return;
    }

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;
    const names = activeCompanies.map((c) => c.name);
    const values = activeCompanies.map((c) => c.totalAttendees);

    const endPercent = names.length > 8 ? Math.min(100, Math.round((8 / names.length) * 100)) : 100;

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: { color: 'rgba(0, 0, 0, 0.04)' },
        },
        formatter: (params: any) => {
          if (!params || !params[0]) return '';
          const p = params[0];
          return `
            <div style="font-family: Sarabun, sans-serif; padding: 2px 4px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px; font-size: 13px;">${p.name}</div>
              <div style="font-size: 12px; color: #64748b;">
                ${badgeText}: <span style="font-weight: 700; color: ${accentColor}; font-size: 14px;">${p.value} คน</span>
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                ${viewMode === 'daily' ? `ประจำวันที่ ${selectedDateLabel}` : 'ยอดสะสมโครงการ'}
              </div>
            </div>
          `;
        },
      },
      grid: {
        top: 36,
        left: 20,
        right: 18,
        bottom: 120,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          rotate: 45,
          fontSize: 10,
          color: '#334155',
          fontFamily: 'Sarabun, sans-serif',
          margin: 12,
          overflow: 'none',
          formatter: (val: string) => val,
        },
        axisLine: {
          lineStyle: { color: '#cbd5e1' },
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          fontFamily: 'Sarabun, sans-serif',
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed',
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: endPercent,
          zoomOnMouseWheel: false,
          moveOnMouseMove: true,
        },
        {
          type: 'slider',
          start: 0,
          end: endPercent,
          height: 14,
          bottom: 4,
          borderColor: 'transparent',
          backgroundColor: '#f1f5f9',
          fillerColor: accentColor + '33',
          handleStyle: {
            color: accentColor,
            borderColor: accentColor,
          },
          showDetail: false,
        },
      ],
      series: [
        {
          name: badgeText,
          type: 'bar',
          data: values,
          barMaxWidth: 38,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: gradientStart },
              { offset: 1, color: gradientEnd },
            ]),
          },
          label: {
            show: true,
            position: 'top',
            color: '#0f172a',
            fontWeight: 'bold',
            fontSize: 11,
            formatter: '{c}',
          },
        },
      ],
    };

    chart.setOption(option, true);

    // Register instance for export synchronization
    (window as any).__mt_echarts_instances = (window as any).__mt_echarts_instances || new Set();
    (window as any).__mt_echarts_instances.add(chart);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      (window as any).__mt_echarts_instances?.delete(chart);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeCompanies, accentColor, gradientStart, gradientEnd, badgeText, viewMode, selectedDateLabel]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Header of each chart */}
      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
              style={{ backgroundColor: badgeBg, color: badgeTextColor }}
            >
              {badgeText}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{viewMode === 'daily' ? `ประจำวัน ${selectedDateLabel}` : 'ยอดสะสมโครงการ'}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-1 whitespace-nowrap">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
            {viewMode === 'daily'
              ? `จำนวนผู้เข้าร่วมในวันที่มีข้อมูล (${activeCompanies.length} จาก ${companies.length} แห่ง)`
              : `จำนวนผู้เข้าร่วมสะสม (${activeCompanies.length} จาก ${companies.length} แห่ง)`}
          </p>
        </div>

        {/* Right side: total in group (Large text in accent color) */}
        <div className="text-right shrink-0">
          <div className="text-2xl sm:text-3xl font-extrabold tabular-nums whitespace-nowrap" style={{ color: accentColor }}>
            {totalAttendees.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 whitespace-nowrap">
            {viewMode === 'daily' ? 'คนในกลุ่มวันนี้' : 'คนรวมในกลุ่มนี้'}
          </div>
        </div>
      </div>

      {/* Chart Canvas or Empty State with generous height */}
      <div className="relative w-full h-[340px] mt-2">
        {activeCompanies.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs sm:text-sm bg-slate-50/70 rounded-lg border border-dashed border-slate-200 p-4">
            <BarChart3 className="w-9 h-9 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm text-center [word-break:keep-all] [line-break:strict]">
              ยังไม่มีข้อมูลสำหรับวันที่เลือก กรุณากรอกและบันทึกข้อมูล
            </p>
            <p className="text-slate-400 text-xs mt-1 text-center max-w-sm [word-break:keep-all] [line-break:strict]">
              {viewMode === 'daily' ? (
                <>
                  <span>(วันที่ </span>
                  <span className="whitespace-nowrap font-medium text-slate-600">{selectedDateLabel}</span>
                  <span> ยังไม่มีบันทึกข้อมูล)</span>
                </>
              ) : (
                'กรุณาลงข้อมูลผ่านฟอร์มเพื่อแสดงกราฟแท่ง'
              )}
            </p>
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-full" />
        )}
      </div>

      {/* Footer helper */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500 whitespace-nowrap">
        <span className="whitespace-nowrap font-medium text-slate-600">
          แท่งกราฟเรียงลำดับจากมากไปน้อย ({activeCompanies.length} จาก {companies.length} แห่ง)
        </span>
        <span className="whitespace-nowrap text-slate-400">
          {activeCompanies.length > 8 ? 'ลากแถบสไลเดอร์ด้านล่างเพื่อเลื่อนดูบริษัท' : 'แสดงผลครบทุกบริษัท'}
        </span>
      </div>
    </div>
  );
};

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  companies,
  selectedDateLabel = '16 ต.ค. 2026',
  viewMode = 'daily',
}) => {
  const internalCompanies = companies.filter((c) => c.type === 'internal');
  const externalCompanies = companies.filter((c) => c.type === 'external');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* กราฟซ้าย — คู่ธุรกิจภายในพื้นที่ (สีเขียว gradient #10b981) */}
      <SingleChart
        title="คู่ธุรกิจภายในพื้นที่"
        badgeText="ภายในพื้นที่"
        badgeBg="#ecfdf5"
        badgeTextColor="#047857"
        accentColor="#10b981"
        gradientStart="#10b981"
        gradientEnd="#059669"
        companies={internalCompanies}
        selectedDateLabel={selectedDateLabel}
        viewMode={viewMode}
      />

      {/* กราฟขวา — คู่ธุรกิจนอกพื้นที่ (สีน้ำเงิน gradient #2563ab) */}
      <SingleChart
        title="คู่ธุรกิจนอกพื้นที่"
        badgeText="นอกพื้นที่"
        badgeBg="#eff6ff"
        badgeTextColor="#1e40af"
        accentColor="#2563ab"
        gradientStart="#3b82f6"
        gradientEnd="#2563ab"
        companies={externalCompanies}
        selectedDateLabel={selectedDateLabel}
        viewMode={viewMode}
      />
    </div>
  );
};
