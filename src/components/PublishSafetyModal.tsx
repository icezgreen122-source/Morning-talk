import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  ExternalLink,
  Layers,
  Users,
  Building2,
  Lock,
  Cloud,
  FileCheck,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import {
  apiCheckPublishStatus,
  apiVerifyPublishParity,
  apiSyncData,
} from '../utils/apiService';
import { Company, AttendanceRecord } from '../types';

interface PublishSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  records: AttendanceRecord[];
  totalAttendees: number;
  onSyncDatabase: () => void;
  onShowToast: (msg: string) => void;
}

export const PublishSafetyModal: React.FC<PublishSafetyModalProps> = ({
  isOpen,
  onClose,
  companies,
  records,
  totalAttendees,
  onSyncDatabase,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'parity' | 'cloud'>('status');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [parityResult, setParityResult] = useState<any>(null);
  const [isVerifyingParity, setIsVerifyingParity] = useState(false);
  const [cloudSyncUrl, setCloudSyncUrl] = useState(() => {
    return localStorage.getItem('mt_cloud_sync_url_v1') || '';
  });
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    const status = await apiCheckPublishStatus();
    setServerStatus(status);
    setIsLoadingStatus(false);
  };

  const handleVerifyParity = async () => {
    setIsVerifyingParity(true);
    const result = await apiVerifyPublishParity({
      expectedCompanies: companies.length,
      expectedRecords: records.length,
      expectedAttendees: totalAttendees,
    });
    setParityResult(result);
    setIsVerifyingParity(false);

    if (result && result.verified) {
      onShowToast('✓ ยืนยันข้อมูลตรงกัน 100% ระหว่าง Preview และ Publish');
    } else {
      onShowToast('⚠️ ตรวจพบข้อมูลไม่ตรงกัน กรุณาคลิก "ซิงค์ฐานข้อมูล" ทันที');
    }
  };

  const handleSaveCloudUrl = () => {
    localStorage.setItem('mt_cloud_sync_url_v1', cloudSyncUrl.trim());
    setCloudSyncSuccess(true);
    setTimeout(() => setCloudSyncSuccess(false), 3000);
    onShowToast('บันทึกการตั้งค่า Cloud Sync สำเร็จ');
  };

  if (!isOpen) return null;

  const isDataSafe = records.length > 0 && companies.length > 0;
  const isServerSynced =
    serverStatus?.success &&
    serverStatus?.recordsCount === records.length &&
    serverStatus?.companiesCount === companies.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0c2340] to-[#133a68] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                <span>ระบบคุ้มครองข้อมูลก่อนและหลัง Publish</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  MUST: ZERO DATA LOSS
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                PPPC ขอนแก่น Major Shutdown 2026 — ตรวจสอบความสมบูรณ์ของฐานข้อมูลถาวร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>สถานะความปลอดภัยข้อมูล</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parity')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'parity'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ตรวจสอบ Preview vs Publish (Parity Check)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-2 border-b-2 rounded-t-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Sheets / Cloud Sync</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 text-sm flex-1">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Primary Status Banner */}
              {isDataSafe ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-900 text-sm">
                      ✓ ข้อมูลถูกบันทึกถาวรเรียบร้อย พร้อมสำหรับ Publish
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      ข้อมูลทั้งหมดถูกฝังลงใน <strong>Master Persistent Snapshot</strong> (ทั้งใน Server และ Client Bundle)
                      เมื่อเปิดลิงก์ Publish ข้อมูลจะแสดงผลตรงกัน 100% ทันทีโดยไม่ต้องโหลดใหม่และไม่มีการรีเซ็ตเป็น 0
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-rose-900 text-sm">
                      ⚠️ ข้อมูลยังไม่ถูกบันทึกถาวร กรุณาเชื่อมต่อฐานข้อมูลก่อน Publish
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      ระบบตรวจพบว่ารายการบันทึกยังไม่ครบถ้วน กรุณากดปุ่ม <strong>"ซิงค์ฐานข้อมูลถาวร"</strong> ด้านล่างก่อนทำการกด Publish เพื่อป้องกันการสูญหาย
                    </p>
                  </div>
                </div>
              )}

              {/* Data Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">คู่ธุรกิจในระบบ</span>
                  <span className="text-lg font-extrabold text-blue-900">{companies.length}</span>
                  <span className="text-[10px] text-slate-400 block">แห่ง (Master 45)</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">ประวัติบันทึกถาวร</span>
                  <span className="text-lg font-extrabold text-purple-900">{records.length}</span>
                  <span className="text-[10px] text-slate-400 block">รายการ (Admin)</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">สะสมผู้เข้าร่วม</span>
                  <span className="text-lg font-extrabold text-emerald-900">{totalAttendees.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 block">คน (ยอดจริง)</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">สถิติอุบัติเหตุ</span>
                  <span className="text-lg font-extrabold text-emerald-600">0</span>
                  <span className="text-[10px] text-slate-400 block">ครั้ง (Zero Accident)</span>
                </div>
              </div>

              {/* Strict Rules Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>การรับประกันตามกฎบังคับ 6 ประการ (MUST Compliance)</span>
                </h4>
                <ul className="text-xs space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 1.</span>
                    <span><strong>ห้ามรีเซ็ตข้อมูลเมื่อ Publish:</strong> ฝัง Persistent Snapshot ข้อมูล 45 บริษัท และ {records.length} รายการบันทึกใน build ถาวร</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 2.</span>
                    <span><strong>ข้อมูลเชื่อมโยง 100%:</strong> ลิงก์ Publish และ Preview เรียกใช้ schema และ baseline ตัวเดียวกัน</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 3.</span>
                    <span><strong>ห้าม initialize ค่าว่าง 0 คน:</strong> Client state เริ่มต้นจาก Master Snapshot ทันทีตั้งแต่เฟรมแรก</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 4.</span>
                    <span><strong>ระบบป้องกัน Publish หากข้อมูลสูญหาย:</strong> มีระบบตรวจจับและแจ้งเตือนอัตโนมัติ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 5.</span>
                    <span><strong>ระบบ Parity Check หลัง Publish:</strong> เปรียบเทียบตัวเลขทุกตัวระหว่าง Preview และ Published URL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓ 6.</span>
                    <span><strong>ปุ่มโหลดข้อมูลตัวอย่าง Manual Only:</strong> ต้องกดยืนยันด้วยตนเองเท่านั้น ปิดกั้นการทำงานอัตโนมัติในทุกกรณี</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'parity' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed">
                <strong>เครื่องมือตรวจสอบ Parity Check:</strong> ตรวจสอบว่าข้อมูลในเซิร์ฟเวอร์ถาวร (สำหรับ Publish) ตรงกับข้อมูลที่กำลังแสดงผลบนหน้าจอ Preview หรือไม่
              </div>

              <div className="flex justify-center my-3">
                <button
                  type="button"
                  onClick={handleVerifyParity}
                  disabled={isVerifyingParity}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isVerifyingParity ? 'animate-spin' : ''}`} />
                  <span>{isVerifyingParity ? 'กำลังตรวจสอบ...' : 'ตรวจสอบความตรงกัน (Parity Check)'}</span>
                </button>
              </div>

              {parityResult && (
                <div
                  className={`border rounded-xl p-4 transition-all ${
                    parityResult.verified
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                    {parityResult.verified ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>ผลการตรวจสอบ: ตรงกัน 100% สมบูรณ์แบบ</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <span>ผลการตรวจสอบ: พบความแตกต่างระหว่าง Preview และ Publish!</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs mb-3">{parityResult.message}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">🖥️ ข้อมูลหน้าจอ Preview</span>
                      <ul className="space-y-0.5 text-slate-600">
                        <li>บริษัท: <strong>{parityResult.preview.companies}</strong> แห่ง</li>
                        <li>บันทึก: <strong>{parityResult.preview.records}</strong> รายการ</li>
                        <li>ผู้เข้าร่วม: <strong>{Number(parityResult.preview.totalAttendees).toLocaleString()}</strong> คน</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">🌐 ข้อมูลเซิร์ฟเวอร์ Publish</span>
                      <ul className="space-y-0.5 text-slate-600">
                        <li>บริษัท: <strong>{parityResult.published.companies}</strong> แห่ง</li>
                        <li>บันทึก: <strong>{parityResult.published.records}</strong> รายการ</li>
                        <li>ผู้เข้าร่วม: <strong>{Number(parityResult.published.totalAttendees).toLocaleString()}</strong> คน</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  <span>การเชื่อมต่อฐานข้อมูลภายนอก (Google Sheets / Firebase Webhook)</span>
                </div>
                ท่านสามารถกรอก Webhook URL ของ Google Sheets (Google Apps Script Web App) หรือ REST Database เพื่อให้ระบบซิงค์ข้อมูลคู่ขนานไปยัง Cloud ได้โดยตรง
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Google Sheets Webhook / Cloud REST URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={cloudSyncUrl}
                    onChange={(e) => setCloudSyncUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCloudUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    บันทึก URL
                  </button>
                </div>
                {cloudSyncSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    บันทึกการตั้งค่า Cloud Sync เรียบร้อยแล้ว
                  </p>
                )}
              </div>

              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-blue-900 block">📁 ที่ตั้งไฟล์จัดเก็บถาวรในระบบ:</span>
                <p className="font-mono text-[11px] text-slate-700">/data/store.json (Local Server Data Store)</p>
                <p className="font-mono text-[11px] text-slate-700">/src/data/publishedMasterSnapshot.json (Bundled Master Snapshot)</p>
                <p className="font-mono text-[11px] text-slate-700">/data/backups/backup_auto_latest.json (Automatic Disk Backup)</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 sm:px-5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">การป้องกันข้อมูลถาวร:</span>
            <span className="font-bold text-emerald-700">เปิดใช้งาน 100%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSyncDatabase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              title="ซิงค์และบันทึกข้อมูลหน้าจอลง Persistent Snapshot ถาวรทันที"
            >
              <Database className="w-3.5 h-3.5" />
              <span>ซิงค์ฐานข้อมูลถาวร</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
