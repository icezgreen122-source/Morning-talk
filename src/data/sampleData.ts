import { Company, AttendanceRecord } from '../types';
import { getInitialCompanies } from './initialData';

export const SAFETY_TOPICS = [
  'KYT ตรวจสอบความปลอดภัย 4 ขั้นตอนก่อนเริ่มงาน (Zero Accident)',
  'การทำงานบนที่สูงและการตรวจสอบนั่งร้าน (Working at Heights & Scaffolding)',
  'LOTO การตัดแยกแหล่งพลังงานอันตราย (Lockout / Tagout)',
  'การทำงานในที่อับอากาศและการระบายอากาศ (Confined Space Entry)',
  'การสวมใส่อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคล (PPE 100%)',
  'ความปลอดภัยในงานประกายไฟและงานเชื่อม (Hot Work Permit)',
  'การป้องกันอันตรายจากสารเคมีและวัตถุไวไฟ (Chemical Safety)',
  'ความปลอดภัยในการยกเคลื่อนย้ายและเครน (Rigging & Lifting)',
  'สุขอนามัย ความร้อน และการป้องกันภาวะ Heat Stroke',
  'การตรวจสอบระบบสายดินและอุปกรณ์ไฟฟ้าชั่วคราว (Electrical Safety)',
];

export function generateSampleData(): { companies: Company[]; records: AttendanceRecord[] } {
  const baseCompanies = getInitialCompanies();
  const sampleRecords: AttendanceRecord[] = [];

  // Historical dates ONLY (Oct 16 - Oct 20). Oct 21 is strictly UNSEEDED and empty!
  const dates = [
    '2026-10-16',
    '2026-10-17',
    '2026-10-18',
    '2026-10-19',
    '2026-10-20',
  ];

  const supervisors = [
    'จป.วิชาชีพ สมชาย (OHS PPPC)',
    'จป.วิชาชีพ กิตติศักดิ์ (Safety Team)',
    'จป.วิชาชีพ ปิยะวรรณ (Safety Supervisor)',
    'วิศวกรความปลอดภัย นพดล (Shutdown Lead)',
  ];

  const companyAttendeeMap = new Map<string, number>();

  // Generate historical records strictly for Oct 16 to Oct 20
  baseCompanies.forEach((company, index) => {
    const activeDaysCount = index % 5 === 0 ? 3 : index % 3 === 0 ? 4 : 5;
    const selectedDays = dates.slice(0, activeDaysCount);

    let cumulative = 0;

    selectedDays.forEach((date, dayIdx) => {
      const baseCount = company.type === 'internal' ? 12 + (index % 10) : 8 + (index % 12);
      const count = Math.max(5, baseCount + ((dayIdx % 3) * 2));
      cumulative += count;

      sampleRecords.push({
        id: `sample-${company.id}-${date}`,
        date,
        companyId: company.id,
        companyName: company.name,
        companyType: company.type,
        attendees: count,
        targetWorkers: count + 2,
        safetyTopic: SAFETY_TOPICS[(index + dayIdx) % SAFETY_TOPICS.length],
        supervisorName: supervisors[(index + dayIdx) % supervisors.length],
        notes: 'KYT ปฏิบัติตามมาตรฐานความปลอดภัย 100%',
        totalAfter: cumulative,
        createdAt: `${date}T08:15:00.000Z`,
      });
    });

    companyAttendeeMap.set(company.id, cumulative);
  });

  // Base companies start with 0 attendees by default; cumulative metrics computed dynamically
  const populatedCompanies = baseCompanies.map((c) => ({
    ...c,
    totalAttendees: 0,
  }));

  // Sort records latest date first
  sampleRecords.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    return cmp !== 0 ? cmp : b.createdAt.localeCompare(a.createdAt);
  });

  return {
    companies: populatedCompanies,
    records: sampleRecords,
  };
}
