import React from 'react';
import { ShieldCheck, Calendar, MapPin, Building2, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white py-6 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Source & Project info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ระบบกำกับดูแลความปลอดภัยและกิจกรรม Morning Talk ประจำวัน</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                สถานที่: โรงงาน PPPC ขอนแก่น (Phoenix Pulp & Paper)
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                โครงการ Major Shutdown: 16 ถึง 31 ตุลาคม 2026
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                ฝ่ายความปลอดภัยและอาชีวอนามัย (Safety & Environment)
              </span>
            </div>
          </div>

          {/* Standards & copyright */}
          <div className="text-right text-slate-400 text-[11px] space-y-1">
            <div className="flex items-center md:justify-end gap-1.5 text-slate-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>เกณฑ์ความปลอดภัยสูงสุด (Zero Accident Target)</span>
            </div>
            <div>ข้อมูลบันทึกและคำนวณแบบ Real-time พร้อมจัดเก็บในหน่วยความจำเบราว์เซอร์</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
