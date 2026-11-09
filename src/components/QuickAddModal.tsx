import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { SHUTDOWN_DATES } from '../data/initialData';
import { X, PlusCircle, Calendar, Users, FileText } from 'lucide-react';

interface QuickAddModalProps {
  company: Company | null;
  onClose: () => void;
  onSave: (payload: {
    date: string;
    companyName: string;
    attendees: number;
    notes?: string;
  }) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ company, onClose, onSave }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-21');
  const [attendees, setAttendees] = useState<string>('10');
  const [notes, setNotes] = useState<string>('Morning Talk ประจำวัน');

  useEffect(() => {
    if (company) {
      setAttendees('10');
      setNotes('Morning Talk ประจำวัน');
    }
  }, [company]);

  if (!company) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(attendees, 10);
    if (isNaN(count) || count <= 0) return;

    onSave({
      date: selectedDate,
      companyName: company.name,
      attendees: count,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              บันทึกการเข้าร่วม Morning Talk
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-semibold text-emerald-700 text-sm">{company.name}</span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  company.type === 'internal'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {company.type === 'internal' ? 'ภายในพื้นที่' : 'นอกพื้นที่'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>วันที่ดำเนินกิจกรรม</span>
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {SHUTDOWN_DATES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>จำนวนคนเข้าร่วมเพิ่มเติม</span>
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ยอดสะสมปัจจุบัน: <strong>{company.totalAttendees}</strong> คน จะกลายเป็น{' '}
              <strong>{company.totalAttendees + (parseInt(attendees, 10) || 0)}</strong> คน
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>หัวข้อ / ข้อความเน้นย้ำ</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกเพิ่มยอดสะสม</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
