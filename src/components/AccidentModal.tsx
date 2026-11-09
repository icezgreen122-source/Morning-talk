import React, { useState } from 'react';
import { IncidentRecord, IncidentType, Company } from '../types';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Calendar,
  Building2,
  CheckCircle2,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface AccidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentRecord[];
  onAddIncident: (incident: Omit<IncidentRecord, 'id' | 'createdAt'>) => void;
  onDeleteIncident: (id: string) => void;
  companies: Company[];
  selectedDate: string;
}

export const AccidentModal: React.FC<AccidentModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onAddIncident,
  onDeleteIncident,
  companies,
  selectedDate,
}) => {
  const [date, setDate] = useState(selectedDate || '2026-10-21');
  const [type, setType] = useState<IncidentType>('accident');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeNameMap: Record<IncidentType, string> = {
    accident: 'อุบัติเหตุ',
    'near-miss': 'ใกล้เคียงอุบัติเหตุ (Near-Miss)',
    'unsafe-condition': 'สภาพอันตราย (Unsafe Condition)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('กรุณากรอกรายละเอียดเหตุการณ์');
      return;
    }
    if (!companyName.trim()) {
      setFormError('กรุณากรอกหรือเลือกบริษัทที่เกี่ยวข้อง');
      return;
    }

    onAddIncident({
      date,
      type,
      typeName: typeNameMap[type] || 'อุบัติเหตุ',
      description: description.trim(),
      companyName: companyName.trim(),
      location: location.trim() || undefined,
    });

    setDescription('');
    setLocation('');
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-[#0c2340] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                บันทึกและจัดการรายการอุบัติเหตุ
              </h2>
              <p className="text-xs text-slate-300">
                เป้าหมายความปลอดภัย Zero Accident · โรงงาน PPPC ขอนแก่น
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Banner */}
          {incidents.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-emerald-950">✓ Zero Accident 100%</div>
                <div className="text-xs text-emerald-700">
                  ยังไม่มีรายงานการเกิดอุบัติเหตุในโครงการ สามารถบันทึกกรณีพบเหตุการณ์ได้ด้านล่าง
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-900">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-red-950">
                  ⚠️ มีรายการบันทึก {incidents.length} รายการ
                </div>
                <div className="text-xs text-red-700">
                  ล่าสุด: วันที่ {incidents[0].date} ({incidents[0].typeName}) — {incidents[0].companyName}
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <PlusCircle className="w-4 h-4 text-red-600" />
              <span>ฟอร์มบันทึกอุบัติเหตุ / ข้อควรระวังใหม่</span>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-100 text-red-800 text-xs rounded-lg font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่เกิดเหตุ
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทเหตุการณ์
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IncidentType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="accident">อุบัติเหตุ (Accident)</option>
                  <option value="near-miss">ใกล้เคียงอุบัติเหตุ (Near-Miss)</option>
                  <option value="unsafe-condition">สภาพอันตราย (Unsafe Condition)</option>
                </select>
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                บริษัทที่เกี่ยวข้อง
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  list="incident-companies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="พิมพ์หรือเลือกชื่อบริษัทคู่ธุรกิจ..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                />
                <datalist id="incident-companies">
                  {companies.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รายละเอียดเหตุการณ์
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="ระบุรายละเอียดเหตุการณ์ เช่น อุปกรณ์ชำรุด, พลัดตก, การแก้ไขเบื้องต้น..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานที่ / พื้นที่ปฏิบัติงาน (ถ้ามี)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น บริเวณ Recovery Boiler, ลานเก็บไม้, ท่าส่งของ..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>บันทึกรายการอุบัติเหตุ</span>
              </button>
            </div>
          </form>

          {/* History List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>ประวัติรายการทั้งหมด ({incidents.length} รายการ)</span>
              </h3>
            </div>

            {incidents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                ไม่มีประวัติอุบัติเหตุ ระบบคงสถานะ Zero Accident
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-red-200 transition-colors flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            inc.type === 'accident'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : inc.type === 'near-miss'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {inc.typeName}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {inc.companyName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {inc.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {inc.description}
                      </p>
                      {inc.location && (
                        <div className="text-[11px] text-slate-400">
                          พื้นที่: {inc.location}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteIncident(inc.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
