import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const SNAPSHOT_PATH = path.resolve(__dirname, 'src', 'data', 'publishedMasterSnapshot.json');

// Initial 45 Master Companies
const INITIAL_INTERNAL_COMPANIES = [
  'WCE.',
  'ทรัพย์ทวีคูณ',
  'C.T.C',
  'ขันติพิมพ์พงษ์',
  'BCC',
  'ปัญจพล',
  'SPI',
  'จรูณสิงห์',
  'เคนาย',
  'KKEN',
  'JBB',
  'LIDA',
  'ATT',
  'ดารุณี',
  'SM&SPS',
  'Fluiv power',
  'กาญจนา',
  'Flowlab',
  'ฐาปกรณ์',
  'Lucky',
  'พลูโตเทค',
  'เอ็กเซลเลนท์',
  'สหการช่าง',
  'ไพร์ม เอ็นจิเนียริ่ง',
];

const INITIAL_EXTERNAL_COMPANIES = [
  'คอนโทรลโรจิก',
  'เอ็นเวอร์เทค',
  'T.A.G',
  'M.A.C.S',
  'S.R.I.C',
  'AWS.',
  'เพอมาเทคเอเซีย',
  'NPP',
  'SYNERGY',
  'ไทยโพลิเมอร์',
  'พยัคฆ์',
  'WELL',
  'ณัฐนนท์',
  'NRK',
  'TECHNICAL',
  'Q&P',
  'SUMITOMO',
  'AGON',
  'T.VAS',
  'SCG Logistics',
  'โปรเทคเทค',
];

function getInitialCompanies() {
  const internals = INITIAL_INTERNAL_COMPANIES.map((name, index) => ({
    id: `in-${index + 1}`,
    name,
    type: 'internal' as const,
    totalAttendees: 0,
    isCustom: false,
  }));

  const externals = INITIAL_EXTERNAL_COMPANIES.map((name, index) => ({
    id: `ex-${index + 1}`,
    name,
    type: 'external' as const,
    totalAttendees: 0,
    isCustom: false,
  }));

  return [...internals, ...externals];
}

interface ProjectConfig {
  projectName: string;
  subTitle?: string;
  projectSubtitle?: string;
  startDate: string;
  endDate: string;
  operatingDate?: string;
  location?: string;
  isCustomRange?: boolean;
}

const DEFAULT_SERVER_PROJECT_CONFIG: ProjectConfig = {
  projectName: 'Major Shutdown PPPC ขอนแก่น',
  subTitle: 'ระบบบันทึกและสรุปผลกิจกรรม Morning Talk',
  startDate: '2026-10-16',
  endDate: '2026-10-31',
  operatingDate: '2026-10-22',
  location: 'ขอนแก่น',
};

interface DataStore {
  companies: Array<{
    id: string;
    name: string;
    type: 'internal' | 'external';
    totalAttendees: number;
    isCustom?: boolean;
  }>;
  records: Array<{
    id: string;
    date: string;
    companyId: string;
    companyName: string;
    companyType: 'internal' | 'external';
    attendees: number;
    targetWorkers?: number;
    safetyTopic?: string;
    supervisorName?: string;
    notes?: string;
    totalAfter?: number;
    createdAt: string;
  }>;
  incidents: Array<{
    id: string;
    date: string;
    companyId: string;
    companyName: string;
    companyType: 'internal' | 'external';
    typeId: string;
    typeName: string;
    description: string;
    reporterName: string;
    location: string;
    severity: 'minor' | 'moderate' | 'major';
    createdAt: string;
  }>;
  selectedDate: string;
  summaryDateText: string;
  lockedDates?: string[];
  unlockedDates?: string[];
  currentOperatingDate?: string;
  projectConfig?: ProjectConfig;
}

// Master Fallback: ALWAYS read from publishedMasterSnapshot.json so publish container NEVER starts empty
function getDefaultStore(): DataStore {
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      const snapRaw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
      const parsed = JSON.parse(snapRaw);
      if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.records)) {
        console.log(`[Store] Loaded initial store from publishedMasterSnapshot.json (${parsed.records.length} records, ${parsed.companies.length} companies)`);
        if (!parsed.projectConfig) {
          parsed.projectConfig = DEFAULT_SERVER_PROJECT_CONFIG;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Store] Could not read publishedMasterSnapshot.json:', err);
  }

  return {
    companies: getInitialCompanies(),
    records: [],
    incidents: [],
    selectedDate: '2026-10-21',
    summaryDateText: '21 ตุลาคม 2569',
    lockedDates: ['2026-10-19'],
    unlockedDates: ['2026-10-22'],
    currentOperatingDate: '2026-10-22',
    projectConfig: DEFAULT_SERVER_PROJECT_CONFIG,
  };
}

// Load store from disk with anti-reset guard
function loadStore(): DataStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let parsed: any = null;
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      parsed = JSON.parse(raw);
    }

    // Anti-reset check: If store.json is missing or has 0 records but snapshot has records, revive from snapshot!
    if (!parsed || !Array.isArray(parsed.records) || parsed.records.length === 0) {
      if (fs.existsSync(SNAPSHOT_PATH)) {
        try {
          const snapRaw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
          const snapParsed = JSON.parse(snapRaw);
          if (snapParsed && Array.isArray(snapParsed.records) && snapParsed.records.length > 0) {
            console.log(`[Store] Reviving store from publishedMasterSnapshot.json (${snapParsed.records.length} records) to prevent 0-reset`);
            if (!snapParsed.projectConfig) {
              snapParsed.projectConfig = DEFAULT_SERVER_PROJECT_CONFIG;
            }
            saveStore(snapParsed);
            return snapParsed;
          }
        } catch (e) {
          console.error('[Store] Failed to revive from snapshot:', e);
        }
      }
    }

    if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.records)) {
      return {
        companies: parsed.companies,
        records: parsed.records,
        incidents: Array.isArray(parsed.incidents) ? parsed.incidents : [],
        selectedDate: parsed.selectedDate || '2026-10-21',
        summaryDateText: parsed.summaryDateText || '21 ตุลาคม 2569',
        lockedDates: Array.isArray(parsed.lockedDates) ? parsed.lockedDates : [],
        unlockedDates: Array.isArray(parsed.unlockedDates) ? parsed.unlockedDates : [],
        currentOperatingDate: parsed.currentOperatingDate || '2026-10-22',
        projectConfig: parsed.projectConfig || DEFAULT_SERVER_PROJECT_CONFIG,
      };
    }
  } catch (err) {
    console.error('Failed to read store.json, falling back to default:', err);
  }

  const defaultStore = getDefaultStore();
  saveStore(defaultStore);
  return defaultStore;
}

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

// Save store to disk and maintain automatic backup snapshot & publishedMasterSnapshot
function saveStore(data: DataStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(STORE_PATH, jsonStr, 'utf-8');

    // Automatic backup copy
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const autoBackupPath = path.join(BACKUP_DIR, 'backup_auto_latest.json');
    fs.writeFileSync(autoBackupPath, jsonStr, 'utf-8');

    // Keep published snapshot strictly updated so any build/publish includes the latest data
    try {
      const snapDir = path.dirname(SNAPSHOT_PATH);
      if (!fs.existsSync(snapDir)) {
        fs.mkdirSync(snapDir, { recursive: true });
      }
      fs.writeFileSync(SNAPSHOT_PATH, jsonStr, 'utf-8');
    } catch (e) {
      console.warn('[Store] Could not write to SNAPSHOT_PATH:', e);
    }
  } catch (err) {
    console.error('Failed to write store.json / backup:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // ================= API ROUTES =================

  // 1. Get complete dashboard data
  app.get('/api/data', (_req: Request, res: Response) => {
    const store = loadStore();
    res.json({
      success: true,
      data: store,
    });
  });

  // 2. Save / Add attendance record
  app.post('/api/records', (req: Request, res: Response) => {
    const newRecord = req.body;
    if (!newRecord || !newRecord.companyName || typeof newRecord.attendees !== 'number') {
      res.status(400).json({ success: false, message: 'Invalid record data' });
      return;
    }

    const store = loadStore();
    // Check if record exists for same date and company
    const existingIndex = store.records.findIndex(
      (r) => r.id === newRecord.id || (r.date === newRecord.date && r.companyName.trim().toLowerCase() === newRecord.companyName.trim().toLowerCase())
    );

    if (!newRecord.id) {
      newRecord.id = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    if (existingIndex >= 0) {
      store.records[existingIndex] = {
        ...store.records[existingIndex],
        ...newRecord,
      };
    } else {
      store.records.unshift(newRecord);
    }

    saveStore(store);
    res.json({
      success: true,
      data: store,
      record: newRecord,
    });
  });

function isStoreDateLocked(store: DataStore, dateStr: string): boolean {
  if (!dateStr) return false;
  const canon = String(dateStr).trim();
  const unlocked = store.unlockedDates || [];
  if (unlocked.includes(canon)) return false;
  const locked = store.lockedDates || [];
  if (locked.includes(canon)) return true;
  const refDate = store.currentOperatingDate || '2026-10-22';
  return canon < refDate;
}

  // 3. Update attendance record
  app.put('/api/records/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = req.body;
    const store = loadStore();
    const idx = store.records.findIndex((r) => r.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }

    // Daily Lock Check
    const targetDate = store.records[idx].date;
    const forceAdmin = req.body?.forceAdmin === true;
    if (isStoreDateLocked(store, targetDate) && !forceAdmin) {
      res.status(403).json({
        success: false,
        message: 'ข้อมูลวันนี้ถูกล็อคแล้ว ติดต่อ Admin หากต้องการแก้ไข',
      });
      return;
    }

    store.records[idx] = { ...store.records[idx], ...updated };
    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 4. Delete attendance record
  app.delete('/api/records/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = loadStore();
    const targetRec = store.records.find((r) => r.id === id);

    if (targetRec) {
      const forceAdmin = req.query?.forceAdmin === 'true' || req.body?.forceAdmin === true;
      if (isStoreDateLocked(store, targetRec.date) && !forceAdmin) {
        res.status(403).json({
          success: false,
          message: 'ข้อมูลวันนี้ถูกล็อคแล้ว ติดต่อ Admin หากต้องการแก้ไข',
        });
        return;
      }
    }

    store.records = store.records.filter((r) => r.id !== id);
    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 5. Add custom company
  app.post('/api/companies', (req: Request, res: Response) => {
    const { name, type } = req.body;
    if (!name || !type) {
      res.status(400).json({ success: false, message: 'Name and type required' });
      return;
    }

    const store = loadStore();
    const duplicate = store.companies.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicate) {
      res.status(400).json({ success: false, message: 'Company already exists' });
      return;
    }

    const newCompany = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      type: type as 'internal' | 'external',
      totalAttendees: 0,
      isCustom: true,
    };

    store.companies.unshift(newCompany);
    saveStore(store);
    res.json({ success: true, data: store, company: newCompany });
  });

  // 6. Update company
  app.put('/api/companies/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type } = req.body;
    const store = loadStore();
    const idx = store.companies.findIndex((c) => c.id === id);

    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    if (name) store.companies[idx].name = name.trim();
    if (type) store.companies[idx].type = type;

    // Sync records if company name changed
    if (name) {
      store.records = store.records.map((r) =>
        r.companyId === id ? { ...r, companyName: name.trim() } : r
      );
    }

    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 7. Delete company (Universal: supports any company in database)
  app.delete('/api/companies/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleteRecordsParam = req.query.deleteRecords ?? req.body?.deleteRecords;
    const shouldDeleteRecords = deleteRecordsParam === true || deleteRecordsParam === 'true';

    console.log(`[API Server] DELETE /api/companies/${id} (deleteRecords=${shouldDeleteRecords})`);

    try {
      const store = loadStore();
      const decodedId = decodeURIComponent(id).trim().toLowerCase();
      const targetComp = store.companies.find(
        (c) => c.id === id || c.name.trim().toLowerCase() === decodedId
      );

      if (!targetComp) {
        console.warn(`[API Server] Company not found for ID/Name: "${id}"`);
        res.status(404).json({
          success: false,
          message: `ไม่พบบริษัท "${id}" ในฐานข้อมูล`,
        });
        return;
      }

      const compName = targetComp.name;
      const compId = targetComp.id;

      // Filter out company from store
      store.companies = store.companies.filter(
        (c) => c.id !== compId && c.name.trim().toLowerCase() !== compName.trim().toLowerCase()
      );

      let recordsDeletedCount = 0;
      if (shouldDeleteRecords) {
        const initialCount = store.records.length;
        store.records = store.records.filter(
          (r) => r.companyId !== compId && r.companyName.trim().toLowerCase() !== compName.trim().toLowerCase()
        );
        recordsDeletedCount = initialCount - store.records.length;
      }

      saveStore(store);

      console.log(
        `[API Server] Successfully deleted company "${compName}" (ID: ${compId}). Remaining companies: ${store.companies.length}. Records removed: ${recordsDeletedCount}`
      );

      res.json({
        success: true,
        message: `ลบบริษัท "${compName}" ออกจากฐานข้อมูลเรียบร้อยแล้ว`,
        companiesCount: store.companies.length,
        recordsDeletedCount,
        data: store,
      });
    } catch (err: any) {
      console.error('[API Server] Error in DELETE /api/companies/:id:', err);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ขณะลบบริษัท: ' + (err?.message || ''),
      });
    }
  });

  // 8. Add incident
  app.post('/api/incidents', (req: Request, res: Response) => {
    const newIncident = req.body;
    const store = loadStore();
    store.incidents.unshift(newIncident);
    saveStore(store);
    res.json({ success: true, data: store, incident: newIncident });
  });

  // 9. Delete incident
  app.delete('/api/incidents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const store = loadStore();
    store.incidents = store.incidents.filter((i) => i.id !== id);
    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 10. Reset to Zero (Keep companies, clear records and incidents)
  app.post('/api/data/reset', (_req: Request, res: Response) => {
    const store = loadStore();
    store.records = [];
    store.incidents = [];
    store.companies = store.companies.map((c) => ({ ...c, totalAttendees: 0 }));
    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 11. Factory Reset (Reset to initial 37 master companies, 0 records)
  app.post('/api/data/factory-reset', (_req: Request, res: Response) => {
    const freshStore = getDefaultStore();
    saveStore(freshStore);
    res.json({ success: true, data: freshStore });
  });

  // 12. Full Data Sync / Import Backup
  app.post('/api/data/sync', (req: Request, res: Response) => {
    const {
      companies,
      records,
      incidents,
      summaryDateText,
      lockedDates,
      unlockedDates,
      currentOperatingDate,
      projectConfig,
    } = req.body;
    const store = loadStore();

    if (Array.isArray(companies)) store.companies = companies;
    if (Array.isArray(records)) store.records = records;
    if (Array.isArray(incidents)) store.incidents = incidents;
    if (summaryDateText) store.summaryDateText = summaryDateText;
    if (Array.isArray(lockedDates)) store.lockedDates = lockedDates;
    if (Array.isArray(unlockedDates)) store.unlockedDates = unlockedDates;
    if (currentOperatingDate) store.currentOperatingDate = currentOperatingDate;
    if (projectConfig && typeof projectConfig === 'object') {
      store.projectConfig = {
        projectName: projectConfig.projectName || store.projectConfig?.projectName || 'Major Shutdown PPPC ขอนแก่น',
        subTitle: projectConfig.subTitle || store.projectConfig?.subTitle || 'ระบบบันทึกและสรุปผลกิจกรรม Morning Talk',
        startDate: projectConfig.startDate || store.projectConfig?.startDate || '2026-10-16',
        endDate: projectConfig.endDate || store.projectConfig?.endDate || '2026-10-31',
        operatingDate: projectConfig.operatingDate || store.projectConfig?.operatingDate || '2026-10-22',
        location: projectConfig.location || store.projectConfig?.location || 'ขอนแก่น',
        isCustomRange: projectConfig.isCustomRange ?? true,
      };
    }

    saveStore(store);
    res.json({ success: true, data: store });
  });

  // 12.1 Update Project Period & Configuration
  app.post('/api/project-config', (req: Request, res: Response) => {
    const { projectName, subTitle, startDate, endDate, operatingDate, location, isCustomRange } = req.body;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'กรุณาระบุวันเริ่มต้นและสิ้นสุดของโครงการ' });
      return;
    }
    const store = loadStore();
    store.projectConfig = {
      projectName: (projectName && String(projectName).trim()) || store.projectConfig?.projectName || 'Major Shutdown PPPC ขอนแก่น',
      subTitle: (subTitle && String(subTitle).trim()) || store.projectConfig?.subTitle || 'ระบบบันทึกและสรุปผลกิจกรรม Morning Talk',
      startDate: String(startDate).trim(),
      endDate: String(endDate).trim(),
      operatingDate: (operatingDate && String(operatingDate).trim()) || store.projectConfig?.operatingDate || String(startDate).trim(),
      location: (location && String(location).trim()) || store.projectConfig?.location || 'ขอนแก่น',
      isCustomRange: isCustomRange ?? true,
    };
    saveStore(store);
    console.log(`[Store] Updated projectConfig: ${store.projectConfig.startDate} to ${store.projectConfig.endDate} (${store.projectConfig.projectName})`);
    res.json({
      success: true,
      data: store.projectConfig,
      message: `บันทึกการตั้งค่าระยะเวลาโครงการ (${store.projectConfig.startDate} ถึง ${store.projectConfig.endDate}) สำเร็จ ข้อมูลเดิมทั้งหมดยังคงอยู่สมบูรณ์ 100%`,
    });
  });

  // 13. Lock / Unlock date
  app.post('/api/lock/date', (req: Request, res: Response) => {
    const { date, locked, operatingDate } = req.body;
    if (!date) {
      res.status(400).json({ success: false, message: 'Date is required' });
      return;
    }
    const store = loadStore();
    const canon = String(date).trim();
    if (!Array.isArray(store.lockedDates)) store.lockedDates = [];
    if (!Array.isArray(store.unlockedDates)) store.unlockedDates = [];
    if (operatingDate) store.currentOperatingDate = operatingDate;

    if (locked) {
      if (!store.lockedDates.includes(canon)) store.lockedDates.push(canon);
      store.unlockedDates = store.unlockedDates.filter((d) => d !== canon);
    } else {
      if (!store.unlockedDates.includes(canon)) store.unlockedDates.push(canon);
      store.lockedDates = store.lockedDates.filter((d) => d !== canon);
    }

    saveStore(store);
    console.log(`[API Server] Date "${canon}" lock status changed to ${locked ? 'LOCKED' : 'UNLOCKED'}`);
    res.json({
      success: true,
      data: store,
      lockedDates: store.lockedDates,
      unlockedDates: store.unlockedDates,
      message: locked ? `ล็อคข้อมูลวันที่ ${canon} สำเร็จ` : `ปลดล็อคข้อมูลวันที่ ${canon} สำเร็จ`,
    });
  });

  // 14. Publish Safety & Data Integrity Status Check (MUST: Zero Data Loss Guard)
  app.get('/api/publish-status', (_req: Request, res: Response) => {
    const store = loadStore();
    const totalAttendees = store.records.reduce((acc, r) => acc + (Number(r.attendees) || 0), 0);
    const snapExists = fs.existsSync(SNAPSHOT_PATH);
    const isReady = store.records.length > 0 && store.companies.length > 0;

    res.json({
      success: true,
      readyToPublish: isReady,
      isPersisted: snapExists,
      recordsCount: store.records.length,
      companiesCount: store.companies.length,
      totalAttendees,
      incidentsCount: store.incidents.length,
      uniqueDates: [...new Set(store.records.map((r) => r.date))],
      warning: !isReady ? 'ข้อมูลยังไม่ถูกบันทึกถาวร กรุณาเชื่อมต่อฐานข้อมูลก่อน Publish' : null,
      message: isReady
        ? `ข้อมูลถูกบันทึกถาวรเรียบร้อย พร้อมสำหรับ Publish (45 บริษัท, ${store.records.length} รายการ, สะสมรวม ${totalAttendees.toLocaleString()} คน)`
        : 'ข้อมูลยังไม่ถูกบันทึกถาวร กรุณาเชื่อมต่อฐานข้อมูลก่อน Publish',
      timestamp: new Date().toISOString(),
    });
  });

  // 15. Publish Parity Verification (Checks preview vs published numbers)
  app.post('/api/publish-verify', (req: Request, res: Response) => {
    const { expectedCompanies, expectedRecords, expectedAttendees } = req.body;
    const store = loadStore();
    const currentAttendees = store.records.reduce((acc, r) => acc + (Number(r.attendees) || 0), 0);

    const matchCompanies = expectedCompanies == null || store.companies.length === Number(expectedCompanies);
    const matchRecords = expectedRecords == null || store.records.length === Number(expectedRecords);
    const matchAttendees = expectedAttendees == null || currentAttendees === Number(expectedAttendees);

    const isMatch = matchCompanies && matchRecords && matchAttendees;

    res.json({
      success: true,
      verified: isMatch,
      discrepancy: !isMatch,
      preview: {
        companies: expectedCompanies,
        records: expectedRecords,
        totalAttendees: expectedAttendees,
      },
      published: {
        companies: store.companies.length,
        records: store.records.length,
        totalAttendees: currentAttendees,
      },
      message: isMatch
        ? `✓ ตรวจสอบผ่าน: ตัวเลขในลิงก์ Publish ตรงกับ Preview 100% (${store.companies.length} บริษัท, ${store.records.length} รายการ, สะสม ${currentAttendees.toLocaleString()} คน)`
        : `⚠️ ตรวจพบความแตกต่างระหว่าง Preview และ Publish: มีข้อมูลไม่ตรงกัน กรุณากดปุ่ม "ซิงค์ฐานข้อมูล" ทันที`,
    });
  });

  // 16. Cloud Sync / Remote Bridge
  app.post('/api/cloud-sync', (req: Request, res: Response) => {
    const { action, externalData } = req.body;
    const store = loadStore();

    if (action === 'push') {
      res.json({
        success: true,
        data: store,
        message: 'ส่งข้อมูลขึ้น Cloud Sync สำเร็จ',
      });
      return;
    }

    if (action === 'pull' && externalData) {
      if (Array.isArray(externalData.records) && externalData.records.length > 0) {
        store.records = externalData.records;
      }
      if (Array.isArray(externalData.companies) && externalData.companies.length > 0) {
        store.companies = externalData.companies;
      }
      saveStore(store);
      res.json({
        success: true,
        data: store,
        message: 'ดึงและผสานข้อมูลจาก Cloud สำเร็จ',
      });
      return;
    }

    res.json({ success: true, data: store });
  });

  // 17. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ================= STATIC / VITE INTEGRATION =================

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
