import React from 'react';
import { Info, Sparkles } from 'lucide-react';

export const NoticeBanners: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 no-print">
      {/* Green Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs sm:text-sm">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="[word-break:keep-all] [line-break:strict]">
          <span className="font-bold text-emerald-900 whitespace-nowrap">คำแนะนำการบันทึก:</span>{' '}
          <span>ตัวเลขทั้งหมดเริ่มต้นที่ 0 ให้ลงข้อมูลจริงผ่านฟอร์มด้านล่าง ระบบจะคำนวณยอดสะสมและอัปเดตกราฟทันที</span>
        </div>
      </div>

      {/* Blue Banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-950 text-xs sm:text-sm">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="[word-break:keep-all] [line-break:strict]">
          <span className="font-bold text-blue-900 whitespace-nowrap">การจัดกลุ่มคู่ธุรกิจ:</span>{' '}
          <span>กดเปลี่ยนประเภทใน/นอกได้ในตารางมาสเตอร์ลิสต์ด้านล่าง หรือเลือกตอนเพิ่มบริษัทใหม่ ระบบจะสลับกราฟทันที</span>
        </div>
      </div>
    </div>
  );
};
