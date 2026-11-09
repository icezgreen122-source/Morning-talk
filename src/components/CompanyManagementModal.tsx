import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Company, CompanyType, AttendanceRecord } from '../types';

interface CompanyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  records: AttendanceRecord[];
  onAddCompany: (company: { name: string; type: CompanyType }) => { success: boolean; message: string };
  onUpdateCompanyName: (companyId: string, newName: string) => { success: boolean; message: string };
  onToggleCompanyType: (companyId: string) => void;
  onDeleteCompany: (companyId: string, deleteRecords: boolean) => Promise<{ success: boolean; message: string }>;
  onQuickRecord: (company: Company) => void;
}

export const CompanyManagementModal: React.FC<CompanyManagementModalProps> = ({
  isOpen,
  onClose,
  companies,
  records,
  onAddCompany,
  onUpdateCompanyName,
  onToggleCompanyType,
  onDeleteCompany,
  onQuickRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | CompanyType | 'active' | 'zero'>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<CompanyType>('internal');
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Editing company name state
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Delete confirm state
  const [companyPendingDelete, setCompanyPendingDelete] = useState<{ company: Company; recordsCount: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Map companyId to record count
  const recordCountMap = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => {
      const cName = c.name.trim().toLowerCase();
      const count = records.filter(
        (r) => r.companyId === c.id || r.companyName.trim().toLowerCase() === cName
      ).length;
      map.set(c.id, count);
    });
    return map;
  }, [records, companies]);

  const handleExecuteDelete = async (companyId: string, deleteRecords: boolean) => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    setDeleteFeedback(null);

    console.log(`[CompanyManagementModal] Executing delete for companyId: ${companyId}, deleteRecords: ${deleteRecords}`);

    try {
      const res = await onDeleteCompany(companyId, deleteRecords);
      if (res.success) {
        setCompanyPendingDelete(null);
        setDeleteFeedback({ type: 'success', message: res.message });
      } else {
        setDeleteErrorMessage(res.message || 'ไม่สามารถลบบริษัทได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setDeleteErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesFilter = true;
        if (filterType === 'internal') matchesFilter = c.type === 'internal';
        if (filterType === 'external') matchesFilter = c.type === 'external';
        if (filterType === 'active') matchesFilter = c.totalAttendees > 0;
        if (filterType === 'zero') matchesFilter = c.totalAttendees === 0;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Thai alphabetical order
        return a.name.localeCompare(b.name, 'th');
      });
  }, [companies, searchTerm, filterType]);

  const internalCount = companies.filter((c) => c.type === 'internal').length;
  const externalCount = companies.filter((c) => c.type === 'external').length;
  const activeCount = companies.filter((c) => c.totalAttendees > 0).length;

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddFeedback(null);
    const trimmed = newCompanyName.trim();
    if (!trimmed) {
      setAddFeedback({ type: 'error', message: 'กรุณากรอกชื่อบริษัท / หจก.' });
      return;
    }

    const res = onAddCompany({
      name: trimmed,
      type: newCompanyType,
    });

    if (res.success) {
      setAddFeedback({ type: 'success', message: res.message });
      setNewCompanyName('');
      setIsAddingNew(false);
    } else {
      setAddFeedback({ type: 'error', message: res.message });
    }
  };

  const startEditName = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditingNameValue(company.name);
    setEditFeedback(null);
  };

  const saveEditName = (companyId: string) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      setEditFeedback('ชื่อบริษัทต้องไม่ว่างเปล่า');
      return;
    }

    const res = onUpdateCompanyName(companyId, trimmed);
    if (res.success) {
      setEditingCompanyId(null);
      setEditFeedback(null);
    } else {
      setEditFeedback(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                จัดการข้อมูลบริษัท / หจก. คู่ธุรกิจ ({companies.length} แห่ง)
              </h2>
              <p className="text-xs text-slate-300">
                Single Source of Truth · กำหนดประเภท แก้ไขชื่อ เพิ่มคู่ธุรกิจใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Stats */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600">
              รวม: <strong className="text-slate-900">{companies.length}</strong> แห่ง
            </span>
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ภายในพื้นที่: <strong>{internalCount}</strong> แห่ง
            </span>
            <span className="text-blue-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              นอกพื้นที่: <strong>{externalCount}</strong> แห่ง
            </span>
            <span className="text-slate-600">
              มีคนเข้าแล้ว: <strong className="text-slate-900">{activeCount}</strong> แห่ง
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'ปิดฟอร์มเพิ่ม' : 'เพิ่มบริษัทใหม่ (ADD)'}</span>
          </button>
        </div>

        {/* Add New Company Collapsible Form */}
        {isAddingNew && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-blue-50/70 border-b border-blue-200 animate-in slide-in-from-top-2 duration-150 space-y-3"
          >
            <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>เพิ่มบริษัท / หจก. คู่ธุรกิจใหม่เข้าสู่มาสเตอร์ลิสต์</span>
            </div>

            {addFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  addFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span>{addFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="พิมพ์ชื่อบริษัท / หจก. (ตรวจสอบชื่อซ้ำอัตโนมัติ)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewCompanyType('internal')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    newCompanyType === 'internal'
                      ? 'bg-[#10b981] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ภายในพื้นที่
                </button>
                <button
                  type="button"
                  onClick={() => setNewCompanyType('external')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    newCompanyType === 'external'
                      ? 'bg-[#2563ab] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  นอกพื้นที่
                </button>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer transition-all"
                >
                  ยืนยันบันทึก
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อบริษัท..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({companies.length})
            </button>
            <button
              onClick={() => setFilterType('internal')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                filterType === 'internal'
                  ? 'bg-[#10b981] text-white shadow-2xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              ภายใน ({internalCount})
            </button>
            <button
              onClick={() => setFilterType('external')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                filterType === 'external'
                  ? 'bg-[#2563ab] text-white shadow-2xs'
                  : 'text-blue-700 hover:text-blue-900'
              }`}
            >
              นอก ({externalCount})
            </button>
            <button
              onClick={() => setFilterType('active')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                filterType === 'active'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              มีคนเข้า ({activeCount})
            </button>
          </div>
        </div>

        {/* Company List Table */}
        <div className="flex-1 overflow-y-auto max-h-[460px]">
          {deleteFeedback && (
            <div
              className={`m-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
                deleteFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                  : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2">
                {deleteFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{deleteFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteFeedback(null)}
                className="text-slate-500 hover:text-slate-800 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {editFeedback && (
            <div className="m-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {editFeedback}
            </div>
          )}

          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 shadow-2xs z-10">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-4">ชื่อบริษัท / หจก.</th>
                <th className="py-2.5 px-3 text-center w-36">ประเภท (คลิกสลับ)</th>
                <th className="py-2.5 px-3 text-right w-28">คนสะสม</th>
                <th className="py-2.5 px-3 text-center w-24">บันทึก</th>
                <th className="py-2.5 px-3 text-center w-36">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ไม่พบคู่ธุรกิจที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company, index) => {
                  const isInternal = company.type === 'internal';
                  const logCount = recordCountMap.get(company.id) || 0;
                  const isEditingThis = editingCompanyId === company.id;

                  return (
                    <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 tabular-nums">
                        {index + 1}
                      </td>

                      {/* Name or Edit Name Input */}
                      <td className="py-2.5 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              className="px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => saveEditName(company.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              title="บันทึกชื่อ"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCompanyId(null)}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                              title="ยกเลิก"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{company.name}</span>
                            {company.isCustom && (
                              <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded">
                                ADD ใหม่
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Type Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleCompanyType(company.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                            isInternal
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          title="คลิกเพื่อสลับประเภท"
                        >
                          <RefreshCw className="w-2.5 h-2.5 opacity-80" />
                          <span>{isInternal ? 'ภายในพื้นที่' : 'นอกพื้นที่'}</span>
                        </button>
                      </td>

                      {/* Cumulative Attendees */}
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        <span
                          className={`font-bold ${
                            company.totalAttendees > 0
                              ? isInternal
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                              : 'text-slate-300'
                          }`}
                        >
                          {company.totalAttendees.toLocaleString()} คน
                        </span>
                      </td>

                      {/* Records Count */}
                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className="text-slate-600 font-medium">
                          {logCount} ครั้ง
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditName(company)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="แก้ไขชื่อบริษัท"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onQuickRecord(company);
                            }}
                            className="p-1 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors font-medium text-[11px] cursor-pointer"
                            title="บันทึกยอด Morning Talk ให้บริษัทนี้"
                          >
                            +ยอด
                          </button>

                          {/* 🗑️ ลบบริษัท (ทำงานกับทุกบริษัท 46 แห่ง) */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteErrorMessage(null);
                              setCompanyPendingDelete({
                                company,
                                recordsCount: logCount,
                              });
                            }}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`ลบบริษัท "${company.name}" ออกจากระบบ`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal with Records Check */}
        {companyPendingDelete && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ยืนยันการลบบริษัทคู่ธุรกิจ
                  </h3>
                  <p className="text-xs text-slate-500">
                    {companyPendingDelete.company.name} ({companyPendingDelete.company.type === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'})
                  </p>
                </div>
              </div>

              {deleteErrorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{deleteErrorMessage}</span>
                </div>
              )}

              {companyPendingDelete.recordsCount > 0 ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span>ตรวจพบประวัติการบันทึก Morning Talk</span>
                    </div>
                    <p className="leading-relaxed">
                      บริษัทนี้มีประวัติการบันทึกจำนวน <strong>{companyPendingDelete.recordsCount} รายการ</strong> (สะสม {companyPendingDelete.company.totalAttendees.toLocaleString()} คน) ในฐานข้อมูล
                    </p>
                    <p className="font-semibold text-amber-900">
                      กรุณาเลือกรูปแบบที่ต้องการดำเนินการ:
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleExecuteDelete(companyPendingDelete.company.id, true)}
                      className="w-full text-left p-3 rounded-xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50/60 hover:bg-rose-100/70 transition-all cursor-pointer group disabled:opacity-50"
                    >
                      <div className="text-xs font-bold text-rose-800 flex items-center justify-between">
                        <span>ลบทั้งหมด (ลบรายชื่อและประวัติทั้ง {companyPendingDelete.recordsCount} รายการ)</span>
                        <Trash2 className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ลบข้อมูลของบริษัทนี้ออกทั้งระบบ 100% รวมทั้งประวัติบันทึกในทุกวัน
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleExecuteDelete(companyPendingDelete.company.id, false)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer group disabled:opacity-50"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-800 flex items-center justify-between">
                        <span>ลบแต่รายชื่อ (เก็บประวัติบันทึกไว้ในระบบ)</span>
                        <Building2 className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        เอาชื่อบริษัทออกจากมาสเตอร์ลิสต์ แต่คงรายการประวัติที่เคยบันทึกไว้เพื่อการตรวจสอบ
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setCompanyPendingDelete(null);
                        setDeleteErrorMessage(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    คุณต้องการลบบริษัท &quot;<strong>{companyPendingDelete.company.name}</strong>&quot; ออกจากระบบและฐานข้อมูลถาวรใช่หรือไม่?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    (ไม่มีประวัติการบันทึก Morning Talk สำหรับบริษัทนี้ สามารถลบได้อย่างปลอดภัย)
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setCompanyPendingDelete(null);
                        setDeleteErrorMessage(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleExecuteDelete(companyPendingDelete.company.id, true)}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? 'กำลังลบจากฐานข้อมูล...' : 'ยืนยันลบบริษัท'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            แสดง {filteredCompanies.length} จาก {companies.length} แห่ง
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
