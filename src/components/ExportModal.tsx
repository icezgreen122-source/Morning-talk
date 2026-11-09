import React, { useRef, useState, useEffect } from 'react';
import { toBlob, toPng } from 'html-to-image';
import {
  X,
  Download,
  FileSpreadsheet,
  Database,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  Calendar,
  Layers,
  Building,
  RotateCcw,
} from 'lucide-react';
import { Company, AttendanceRecord } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  records: AttendanceRecord[];
  onImportData: (data: { companies: Company[]; records: AttendanceRecord[] }) => void;
  onNotify?: (msg: string) => void;
  selectedDate?: string;
  summaryDateText?: string;
  onUpdateSummaryDateText?: (dateStr: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  companies,
  records,
  onImportData,
  onNotify,
  selectedDate = '2026-10-21',
  summaryDateText = '21 ตุลาคม 2569',
  onUpdateSummaryDateText,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [pngProgressStatus, setPngProgressStatus] = useState<string>('');
  const [exportError, setExportError] = useState<string | null>(null);

  // Local editable summary date text
  const [localSummaryDate, setLocalSummaryDate] = useState<string>(summaryDateText);

  // Sync when prop updates
  useEffect(() => {
    if (summaryDateText) {
      setLocalSummaryDate(summaryDateText);
    }
  }, [summaryDateText]);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    }
  };

  const handleDateChange = (newVal: string) => {
    setLocalSummaryDate(newVal);
    if (onUpdateSummaryDateText) {
      onUpdateSummaryDateText(newVal);
    }
  };

  const handleResetDefaultDate = () => {
    const defaultDate = '21 ตุลาคม 2569';
    setLocalSummaryDate(defaultDate);
    if (onUpdateSummaryDateText) {
      onUpdateSummaryDateText(defaultDate);
    }
  };

  // 1. High-Resolution PNG 16:9 Landscape Dashboard Export
  const handleExportPNG = async () => {
    if (isExportingPNG) return;

    const wrapper = document.getElementById('dashboard-export-wrapper');
    const originalLeft = wrapper ? wrapper.style.left : '-99999px';
    const originalZIndex = wrapper ? wrapper.style.zIndex : '-9999';

    try {
      setIsExportingPNG(true);
      setExportError(null);
      setPngProgressStatus('กำลังเตรียมข้อมูลและจัดโครงสร้างรายงาน 16:9 (1920x1080)...');

      // Find the dedicated export container
      const targetElement = document.getElementById('dashboard-export-container');
      if (!targetElement) {
        throw new Error('ไม่พบองค์ประกอบรายงาน Dashboard กรุณาลองใหม่อีกครั้ง');
      }

      // Temporarily bring wrapper into layout tree behind viewport for accurate CSS/font calculations
      if (wrapper) {
        wrapper.style.left = '0px';
        wrapper.style.top = '0px';
        wrapper.style.zIndex = '-9999';
        wrapper.style.visibility = 'visible';
      }

      setPngProgressStatus('กำลังเตรียมรูปภาพและโลโก้ SCGP / Care For All...');

      // Pre-load all images inside export container to guarantee they render
      const imgs = Array.from(targetElement.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            // Safety timeout after 1.5s
            setTimeout(() => resolve(false), 1500);
          });
        })
      );

      setPngProgressStatus('กำลังสร้างภาพความละเอียดสูง 16:9 Ultra HD (3840x2160)...');

      // Brief tick to allow browser layout to stabilize
      await new Promise((resolve) => setTimeout(resolve, 250));

      const contentWidth = 1920;
      const contentHeight = 1080; // Exact 16:9 landscape aspect ratio

      const dateStr = selectedDate || '2026-10-22';
      const filename = `SCGP_Safety_Morning_Talk_16x9_${dateStr}.png`;

      const downloadBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
          setIsExportingPNG(false);
          setPngProgressStatus('');
          notify(`ส่งออกไฟล์ภาพ ${filename} ความละเอียดสูง 16:9 สำเร็จเรียบร้อยแล้ว`);
        }, 500);
      };

      // 1. Try toBlob for highest performance & memory efficiency
      try {
        const blob = await toBlob(targetElement, {
          width: contentWidth,
          height: contentHeight,
          canvasWidth: contentWidth * 2,
          canvasHeight: contentHeight * 2,
          pixelRatio: 2,
          backgroundColor: '#f1f5f9',
          skipFonts: true,
          cacheBust: true,
        });

        if (blob && blob.size > 1000) {
          setPngProgressStatus('กำลังดาวน์โหลดไฟล์ภาพ PNG...');
          downloadBlob(blob);
          return;
        }
      } catch (blobError) {
        console.warn('toBlob fallback to toPng:', blobError);
      }

      // 2. Fallback to toPng data URL
      setPngProgressStatus('กำลังสร้างไฟล์ภาพความละเอียดสูง (โหมดสำรอง)...');
      const dataUrl = await toPng(targetElement, {
        width: contentWidth,
        height: contentHeight,
        canvasWidth: contentWidth * 2,
        canvasHeight: contentHeight * 2,
        pixelRatio: 2,
        backgroundColor: '#f1f5f9',
        skipFonts: true,
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const fallbackBlob = await res.blob();
      downloadBlob(fallbackBlob);
    } catch (err) {
      console.error('Error generating PNG:', err);
      setIsExportingPNG(false);
      setPngProgressStatus('');
      setExportError(
        'เกิดข้อผิดพลาดในการสร้างไฟล์ภาพ: ' + ((err as Error)?.message || 'โปรดลองใหม่อีกครั้ง')
      );
    } finally {
      // Always restore wrapper position
      if (wrapper) {
        wrapper.style.left = originalLeft;
        wrapper.style.zIndex = originalZIndex;
      }
    }
  };

  // 2. Export Records CSV with UTF-8 BOM
  const exportRecordsCSV = () => {
    const bom = '\uFEFF';
    const headers = [
      'ID รายการ',
      'วันที่',
      'รหัสบริษัท',
      'ชื่อบริษัท/หจก.',
      'ประเภทคู่ธุรกิจ',
      'จำนวนคนเข้าร่วม',
      'เป้าหมายตามแผน',
      'หัวข้อความปลอดภัย',
      'จป. ผู้ควบคุมงาน',
      'หมายเหตุ',
      'ยอดสะสมหลังบันทึก',
      'เวลาที่บันทึก',
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.companyId}"`,
      `"${r.companyName.replace(/"/g, '""')}"`,
      `"${r.companyType === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}"`,
      r.attendees,
      r.targetWorkers || r.attendees,
      `"${(r.safetyTopic || '').replace(/"/g, '""')}"`,
      `"${(r.supervisorName || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.totalAfter,
      `"${r.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `Morning_Talk_Records_${selectedDate}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`);
  };

  // 3. Export Company Summary CSV
  const exportCompaniesCSV = () => {
    const bom = '\uFEFF';
    const headers = [
      'ลำดับ',
      'รหัสบริษัท',
      'ชื่อบริษัท / หจก.',
      'ประเภทคู่ธุรกิจ',
      'ยอดผู้เข้าร่วมสะสม (คน)',
      'สถานะ',
    ];

    const rows = companies.map((c, i) => [
      i + 1,
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.type === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}"`,
      c.totalAttendees,
      `"${c.isCustom ? 'ADD เพิ่มใหม่' : 'มาสเตอร์ลิสต์เดิม'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `Morning_Talk_Companies_Summary_${selectedDate}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`);
  };

  // 4. Export JSON System Backup
  const exportJSONBackup = () => {
    const backupData = {
      project: 'PPPC Khon Kaen Major Shutdown 2026',
      activity: 'Safety Morning Talk',
      summaryDateText: localSummaryDate,
      selectedDate,
      exportedAt: new Date().toISOString(),
      companies,
      records,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `Morning_Talk_Backup_${selectedDate}.json`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    notify(`ส่งออกไฟล์ Backup ${filename} เรียบร้อยแล้ว`);
  };

  // 5. Import JSON Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.records)) {
          onImportData({
            companies: parsed.companies,
            records: parsed.records,
          });
          if (parsed.summaryDateText && onUpdateSummaryDateText) {
            onUpdateSummaryDateText(parsed.summaryDateText);
          }
          notify('กู้คืนข้อมูลจากไฟล์สำรองสำเร็จ');
          onClose();
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้อง กรุณาใช้ไฟล์ Backup จากระบบนี้เท่านั้น');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">ส่งออกรายงาน Dashboard</h2>
              <p className="text-xs text-slate-300">
                SCGP · PPPC ขอนแก่น Major Shutdown 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExportingPNG}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {exportError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* PRIMARY OPTION: Export Dashboard as Single High-Res PNG (16:9 Executive Frame) */}
          <div className="p-4.5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-blue-50/50 shadow-xs relative overflow-hidden transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                    <Sparkles className="w-3 h-3" />
                    โครงสร้างภาพ 16:9 แนวนอน (ความละเอียดสูง)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">สำหรับ LINE และ สไลด์</span>
                </div>

                <div className="font-extrabold text-slate-900 text-base mt-1.5 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ส่งออก Dashboard เป็นภาพ PNG (Executive Bounded Frame)</span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ดาวน์โหลดภาพเดี่ยวความคมชัดสูง <strong>SCGP_Safety_Morning_Talk_16x9_{selectedDate}.png</strong> (1920x1080 16:9)
                  แสดงเฉพาะ Header โลโก้ SCGP, การ์ด KPI 4 ช่อง, และกราฟแท่งทั้ง 2 ชุด (ตัดตารางและส่วนท้ายออกตามกรอบกำหนด)
                </p>

                {/* Date Customization Field */}
                <div className="mt-3.5 p-3 bg-white/95 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>วันที่สรุปข้อมูลบนภาพรายงาน (แก้ไขได้):</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleResetDefaultDate}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>รีเซ็ตเป็น 22 ต.ค. 2569</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={localSummaryDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      placeholder="เช่น 21 ตุลาคม 2569"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    * ข้อความนี้จะปรากฏที่มุมขวาบนและใต้ชื่อรายงาน: <strong>“สรุปข้อมูล ณ วันที่ {localSummaryDate}”</strong> (ไม่อ้างอิงวันที่ปัจจุบันของเครื่องคอมพิวเตอร์)
                  </p>
                </div>

                {/* Progress Status */}
                {isExportingPNG && (
                  <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-emerald-300 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                    <span className="text-xs font-semibold text-emerald-900">
                      {pngProgressStatus || 'กำลังสร้างไฟล์ภาพความละเอียดสูง...'}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleExportPNG}
                disabled={isExportingPNG}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isExportingPNG ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังสร้างภาพ...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด PNG</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              หรือเลือกส่งออกข้อมูลดิบ
            </span>
          </div>

          {/* Option 2: CSV Daily Records */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>รายงานบันทึกรายวัน (Daily Logs CSV)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                มี {records.length} รายการบันทึก · ข้อมูลรายวัน, หัวข้อ OHS, จำนวนคน (UTF-8 Excel)
              </p>
            </div>
            <button
              type="button"
              onClick={exportRecordsCSV}
              disabled={isExportingPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Option 3: CSV Company Summary */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>รายงานสรุปรายบริษัท (Companies CSV)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                มี {companies.length} บริษัท · ยอดสะสมแยกตามประเภทใน/นอกพื้นที่ (UTF-8 Excel)
              </p>
            </div>
            <button
              type="button"
              onClick={exportCompaniesCSV}
              disabled={isExportingPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด</span>
            </button>
          </div>

          {/* Option 4: Full JSON Backup */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span>สำรองข้อมูลระบบทั้งหมด (JSON Backup)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                สำรองข้อมูลครบถ้วนทั้งรายชื่อบริษัท ยอดคน และประวัติการบันทึก
              </p>
            </div>
            <button
              type="button"
              onClick={exportJSONBackup}
              disabled={isExportingPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>สำรองไฟล์</span>
            </button>
          </div>

          {/* Option 5: Import JSON Backup */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>กู้คืนข้อมูลจากไฟล์สำรอง (Import JSON)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกไฟล์ JSON Backup เพื่อโหลดข้อมูลกลับเข้าสู่ระบบ
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExportingPNG}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>เลือกไฟล์</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>สัดส่วนภาพแนวนอน 16:9 ความละเอียดสูง ไร้ส่วนเกิน</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExportingPNG}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
