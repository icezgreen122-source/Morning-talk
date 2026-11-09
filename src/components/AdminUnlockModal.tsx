import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { toThaiDateBuddhist, toCanonicalDate } from '../utils/dateUtils';
import { verifyAdminPin } from '../utils/lockService';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  onConfirmUnlock: (date: string) => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  onConfirmUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canon = toCanonicalDate(targetDate);
  const thaiDate = toThaiDateBuddhist(canon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่าน Super Admin');
      return;
    }

    if (!verifyAdminPin(pin)) {
      setErrorMsg('❌ รหัสผ่านไม่ถูกต้อง เฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น (รหัสผ่านเริ่มต้น: 1234)');
      return;
    }

    onConfirmUnlock(canon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0c2340] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">ยืนยันสิทธิ์ Admin เพื่อปลดล็อค</h3>
              <p className="text-xs text-slate-300">Admin Security Authorization</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>ข้อมูลประจำวันที่: {thaiDate}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ข้อมูลของวันนี้ถูกล็อคตามนโยบายความปลอดภัย OHS เพื่อป้องกันการแก้ไขหรือลบย้อนหลัง หากมีความจำเป็นต้องแก้ไขยอดหรือข้อมูล ให้ใส่รหัสผ่าน Super Admin เพื่อปลดล็อคชั่วคราว
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>รหัสผ่าน Super Admin:</span>
              <span className="text-[11px] text-slate-400 font-normal">รหัสเริ่มต้น: 1234 หรือ 9999</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="กรอกรหัสผ่าน (เช่น 1234)"
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>ยืนยันปลดล็อค</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
