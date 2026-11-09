import React, { useState, useMemo } from 'react';
import { Company, CompanyType } from '../types';
import {
  Search,
  ArrowUpDown,
  Building2,
  RefreshCw,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';

interface MasterTableProps {
  companies: Company[];
  onToggleCompanyType: (companyId: string) => void;
  onQuickRecord?: (company: Company) => void;
  selectedDate?: string;
  selectedDateLabel?: string;
  viewMode?: 'daily' | 'cumulative';
}

type SortField = 'name' | 'attendees' | 'cumulative' | 'type';
type SortOrder = 'asc' | 'desc';

const STORAGE_KEY_EXPANDED = 'mt_master_table_expanded_v1';

export const MasterTable: React.FC<MasterTableProps> = ({
  companies,
  onToggleCompanyType,
  onQuickRecord,
  selectedDate = '2026-10-16',
  selectedDateLabel = '16 ต.ค. 2026',
  viewMode = 'daily',
}) => {
  // Collapsible state (Default collapsed as requested; remembers user choice in localStorage)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXPANDED);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return false;
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | CompanyType>('all');
  const [sortField, setSortField] = useState<SortField>('attendees');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // Optional 10 vs All toggle when expanded
  const [showAllRows, setShowAllRows] = useState<boolean>(true);

  const isDaily = viewMode === 'daily';

  // Check if any company has attendees in current view
  const totalViewAttendees = companies.reduce((sum, c) => sum + c.totalAttendees, 0);

  // Filter and sort companies (Thai alphabetical order or attendee count)
  const filteredCompanies = useMemo(() => {
    let result = companies.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || c.type === filterType;
      return matchesSearch && matchesType;
    });

    const thaiCollator = new Intl.Collator('th', { sensitivity: 'base', numeric: true });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = thaiCollator.compare(a.name, b.name);
      } else if (sortField === 'attendees') {
        cmp = a.totalAttendees - b.totalAttendees;
      } else if (sortField === 'cumulative') {
        const cumA = a.cumulativeAttendees ?? a.totalAttendees;
        const cumB = b.cumulativeAttendees ?? b.totalAttendees;
        cmp = cumA - cumB;
      } else if (sortField === 'type') {
        cmp = a.type.localeCompare(b.type);
      }

      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [companies, searchTerm, filterType, sortField, sortOrder]);

  const displayedCompanies = useMemo(() => {
    if (!showAllRows && filteredCompanies.length > 10) {
      return filteredCompanies.slice(0, 10);
    }
    return filteredCompanies;
  }, [filteredCompanies, showAllRows]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const internalCount = companies.filter((c) => c.type === 'internal').length;
  const externalCount = companies.filter((c) => c.type === 'external').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6 transition-all">
      {/* Header Bar (Always visible with summary and Expand/Collapse toggle) */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${isExpanded ? 'pb-4 border-b border-slate-100' : ''}`}>
        {/* Left: Title, Date Badge & Quick Summary Stats */}
        <div
          onClick={toggleExpanded}
          className="flex-1 cursor-pointer select-none group"
          title="คลิกเพื่อย่อ/ขยายตาราง"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 group-hover:text-blue-900 transition-colors">
              <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 transition-colors">
                <Building2 className="w-5 h-5" />
              </span>
              <span>ตารางมาสเตอร์ลิสต์บริษัท/หจก. คู่ธุรกิจ ({companies.length} แห่ง)</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                isDaily
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{isDaily ? `ยอดประจำวัน: ${selectedDateLabel}` : 'ยอดสะสมโครงการ'}</span>
            </span>
            <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>

          {/* Quick Summary Badges (Visible even when collapsed) */}
          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              <span>ทั้งหมด {companies.length} แห่ง</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span>ภายใน {internalCount} แห่ง</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#2563ab]" />
              <span>นอกพื้นที่ {externalCount} แห่ง</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-extrabold">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>ยอดรวมผู้เข้าร่วม: {totalViewAttendees.toLocaleString()} คน</span>
            </span>
          </div>
        </div>

        {/* Right: Expand / Collapse Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleExpanded}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap ${
              isExpanded
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:bg-blue-800'
            }`}
            title={isExpanded ? 'คลิกเพื่อย่อตาราง (ประหยัดพื้นที่หน้าจอ)' : 'คลิกเพื่อขยายตารางและดูรายการบริษัททั้งหมด'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-600" />
                <span>➖ ย่อตาราง</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-white" />
                <span>➕ แสดงตาราง / ขยาย ({companies.length} แห่ง)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Table Body */}
      {isExpanded && (
        <div className="mt-4 animate-in fade-in duration-200">
          {/* Search, Filter Tabs, and Row Count Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-3 flex-wrap">
            {/* Search box */}
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อบริษัท..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter tabs & 10 vs All toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter segment tabs */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({companies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('internal')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterType === 'internal'
                      ? 'bg-[#10b981] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ภายใน ({internalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('external')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterType === 'external'
                      ? 'bg-[#2563ab] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  นอกพื้นที่ ({externalCount})
                </button>
              </div>

              {/* 10 Rows vs All Rows Toggle */}
              {filteredCompanies.length > 10 && (
                <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAllRows(false)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      !showAllRows
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    10 อันดับแรก
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllRows(true)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      showAllRows
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด ({filteredCompanies.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date-specific empty banner if current selected date has 0 records */}
          {isDaily && totalViewAttendees === 0 && (
            <div className="mb-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>ยังไม่มีข้อมูลสำหรับวันที่ {selectedDateLabel}:</strong> ยอดผู้เข้าร่วมของทุกบริษัทเป็น 0 คน สามารถกรอกผ่านฟอร์มด้านบนหรือกด &quot;+บันทึก&quot; ที่แถวบริษัทได้ทันที
                </span>
              </div>
            </div>
          )}

          {/* Table Component */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 scrollable">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 select-none">
                  <th className="py-2.5 px-3 w-14 text-center whitespace-nowrap">ลำดับ</th>
                  <th
                    className="py-2.5 px-4 min-w-[280px] cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>ชื่อบริษัท / หจก. คู่ธุรกิจ</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 w-44 text-center cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <span>ประเภท (กดสลับได้)</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-4 w-36 text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('attendees')}
                  >
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <span>{isDaily ? `ยอดวัน (${selectedDateLabel})` : 'ยอดสะสม'}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  {isDaily && (
                    <th
                      className="py-2.5 px-4 w-32 text-right cursor-pointer hover:bg-slate-200/70 transition-colors hidden sm:table-cell whitespace-nowrap"
                      onClick={() => handleSort('cumulative')}
                    >
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <span>สะสมรวม</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    </th>
                  )}
                  <th className="py-2.5 px-3 w-28 text-center whitespace-nowrap">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={isDaily ? 6 : 5} className="py-8 text-center text-slate-400 text-xs whitespace-nowrap">
                      ไม่พบคู่ธุรกิจที่ตรงกับคำค้นหา &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  displayedCompanies.map((company, index) => {
                    const isInternal = company.type === 'internal';
                    const hasAttendees = company.totalAttendees > 0;
                    const cumCount = company.cumulativeAttendees ?? company.totalAttendees;

                    return (
                      <tr
                        key={company.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Column 1: ลำดับ */}
                        <td className="py-2.5 px-3 text-center text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {index + 1}
                        </td>

                        {/* Column 2: ชื่อบริษัท/หจก. */}
                        <td className="py-2.5 px-4 min-w-[280px] whitespace-nowrap">
                          <div className="font-semibold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                            <span className="whitespace-nowrap">{company.name}</span>
                            {company.isCustom && (
                              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                                ADD เพิ่มใหม่
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Column 3: ประเภท (ปุ่มกดเปลี่ยนได้: เขียว=ภายใน, น้ำเงิน=นอก) */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onToggleCompanyType(company.id)}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer whitespace-nowrap shrink-0 ${
                              isInternal
                                ? 'bg-[#10b981] hover:bg-[#059669] text-white ring-1 ring-[#10b981]/30'
                                : 'bg-[#2563ab] hover:bg-[#1d4ed8] text-white ring-1 ring-[#2563ab]/30'
                            }`}
                            title={`คลิกเพื่อสลับประเภทเป็น ${isInternal ? 'นอกพื้นที่' : 'ภายในพื้นที่'}`}
                          >
                            <RefreshCw className="w-3 h-3 opacity-85 shrink-0" />
                            <span className="whitespace-nowrap">{isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่'}</span>
                          </button>
                        </td>

                        {/* Column 4: คนประจำวัน */}
                        <td className="py-2.5 px-4 text-right tabular-nums whitespace-nowrap">
                          {hasAttendees ? (
                            <span
                              className={`font-bold text-sm whitespace-nowrap ${
                                isInternal ? 'text-emerald-700' : 'text-blue-700'
                              }`}
                            >
                              {company.totalAttendees.toLocaleString()}
                              <span className="text-xs font-normal text-slate-500 ml-1 whitespace-nowrap">คน</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal text-sm whitespace-nowrap">
                              0 <span className="text-[11px] text-slate-300 ml-0.5 whitespace-nowrap">คน</span>
                            </span>
                          )}
                        </td>

                        {/* Column 5: สะสมรวม (ถ้าอยู่ในโหมดรายวัน) */}
                        {isDaily && (
                          <td className="py-2.5 px-4 text-right tabular-nums hidden sm:table-cell whitespace-nowrap">
                            {cumCount > 0 ? (
                              <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">
                                {cumCount.toLocaleString()}{' '}
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">คน</span>
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs whitespace-nowrap">0 คน</span>
                            )}
                          </td>
                        )}

                        {/* Column 6: การจัดการ */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onQuickRecord?.(company)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            title={`บันทึกยอด Morning Talk ให้บริษัทนี้ (${isDaily ? selectedDateLabel : 'วันนี้'})`}
                          >
                            <span className="whitespace-nowrap font-bold">+บันทึก</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Expand All Footer Notice when 10 rows are shown */}
          {!showAllRows && filteredCompanies.length > 10 && (
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAllRows(true)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                แสดงทั้งหมด ({filteredCompanies.length} แห่ง)
              </button>
            </div>
          )}

          {/* Summary Footer bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                แสดง {displayedCompanies.length} จากทั้งหมด {companies.length} บริษัท
              </span>
              <span>·</span>
              <span>
                {isDaily
                  ? `ยอดรวมในวัน (${selectedDateLabel}): ${totalViewAttendees.toLocaleString()} คน`
                  : `ยอดสะสมรวมทุกวัน: ${totalViewAttendees.toLocaleString()} คน`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span>ภายใน: {internalCount} แห่ง</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563ab]" />
                <span>นอกพื้นที่: {externalCount} แห่ง</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
