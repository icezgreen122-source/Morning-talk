import React from 'react';
import { X, UserCheck, Shield, Mail, Building, Key, CheckCircle } from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#0c2340] text-white">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">โปรไฟล์ผู้ดูแลระบบความปลอดภัย</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-700 font-bold text-xl shadow-xs shrink-0">
              SC
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
                Safety Supervisor PPPC
              </div>
              <div className="text-xs text-slate-500">
                เจ้าหน้าที่ความปลอดภัยในการทำงานระดับวิชาชีพ (จป.วิชาชีพ)
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-emerald-700">เข้าสู่ระบบแล้ว (Online)</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span>สังกัด: <strong>ฝ่ายความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม (OHS & Safety)</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>อีเมล: <strong>safety.admin@pppc.scg.com</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>บทบาท: <strong>ผู้ดูแลระบบสูงสุด (Super Admin)</strong></span>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Key className="w-4 h-4 text-slate-400 shrink-0" />
              <span>สิทธิ์การใช้งาน: <strong>จัดการข้อมูลคู่ธุรกิจ, บันทึกยอด, สลับประเภท, ส่งออกรายงาน</strong></span>
            </div>
          </div>

          {/* Standards note */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>นโยบาย Care For All:</strong> ร่วมสร้างความปลอดภัย ทุกที่ ทุกเวลา สื่อสาร Morning Talk ครบ 100% ตลอดช่วง Major Shutdown
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            >
              ออกจากระบบ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
