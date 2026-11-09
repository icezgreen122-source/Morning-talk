import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { X, Trash2, Calendar, Search, Filter, History, Download } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  onDeleteRecord: (recordId: string) => void;
  onExportCSV: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onDeleteRecord,
  onExportCSV,
}) => {
  const [filterDate, setFilterDate] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesDate = filterDate === 'all' || rec.date === filterDate;
        const matchesSearch =
          rec.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        // Sort descending by date, then createdAt
        const cmp = b.date.localeCompare(a.date);
        return cmp !== 0 ? cmp : b.createdAt.localeCompare(a.createdAt);
      });
  }, [records, filterDate, searchTerm]);

  const totalFilteredAttendees = filteredRecords.reduce((sum, r) => sum + r.attendees, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ประวัติการบันทึก Morning Talk รายวัน
              </h2>
              <p className="text-xs text-slate-500">
                รายการบันทึกสะสมทั้งหมด {records.length} รายการ (สามารถตรวจสอบหรือลบรายการที่บันทึกผิดได้)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Filters */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">ทุกวันที่ (16–31 ต.ค.)</option>
                {SHUTDOWN_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Company search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อบริษัท / บันทึก..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">
              พบ <strong className="text-slate-800">{filteredRecords.length}</strong> รายการ (รวม{' '}
              <strong className="text-emerald-700">{totalFilteredAttendees.toLocaleString()}</strong> คน)
            </span>
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Table Body */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่พบรายการบันทึกที่ตรงตามเงื่อนไข
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">วันที่</th>
                    <th className="py-2.5 px-3">ชื่อบริษัท / หจก.</th>
                    <th className="py-2.5 px-3">ประเภท</th>
                    <th className="py-2.5 px-3 text-right">จำนวนคน</th>
                    <th className="py-2.5 px-3">หัวข้อ / หมายเหตุ</th>
                    <th className="py-2.5 px-3 text-center w-16">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => {
                    const isInternal = record.companyType === 'internal';
                    const dateItem = SHUTDOWN_DATES.find((d) => d.value === record.date);

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                          {dateItem?.short || record.date}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {record.companyName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              isInternal
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                          {record.attendees} คน
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {record.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `ยืนยันลบรายการบันทึกของ "${record.companyName}" วันที่ ${dateItem?.short || record.date} (${record.attendees} คน) หรือไม่? ยอดสะสมจะถูกปรับลดโดยอัตโนมัติ`
                                )
                              ) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>เมื่อลบรายการ ระบบจะหักลบจำนวนคนสะสมของบริษัทนั้นออกให้ทันที</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
