import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DocumentRecord } from '../../types/document';

interface TermsWatchDatabase extends DBSchema {
  analysisCache: { key: string; value: CachedAnalysis };
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: {
      'by-created': string;
      'by-url': string;
      'by-type': string;
    };
  };
}

export interface CachedAnalysis {
  key: string;
  createdAt: string;
  summary: string[];
  entries: Array<{ sourceText: string; finding: DocumentRecord['findings'][number] }>;
}

let databasePromise: Promise<IDBPDatabase<TermsWatchDatabase>> | undefined;

function database() {
  databasePromise ??= openDB<TermsWatchDatabase>('termswatch', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('analysisCache')) db.createObjectStore('analysisCache', { keyPath: 'key' });
      if (db.objectStoreNames.contains('documents')) return;
      const store = db.createObjectStore('documents', { keyPath: 'id' });
      store.createIndex('by-created', 'createdAt');
      store.createIndex('by-url', 'url');
      store.createIndex('by-type', 'type');
    },
  }).catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

export async function saveDocument(record: DocumentRecord): Promise<void> {
  await (await database()).put('documents', record);
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  return (await database()).get('documents', id);
}

export async function listDocuments(limit = 30): Promise<DocumentRecord[]> {
  const db = await database();
  const values: DocumentRecord[] = [];
  let cursor = await db.transaction('documents').store.index('by-created').openCursor(null, 'prev');
  while (cursor && values.length < limit) { values.push(cursor.value); cursor = await cursor.continue(); }
  return values;
}

export async function countDocuments(): Promise<number> { return (await database()).count('documents'); }

export async function getLatestByUrl(url: string): Promise<DocumentRecord | undefined> {
  const values = await (await database()).getAllFromIndex('documents', 'by-url', url);
  return values.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function clearDocuments(): Promise<void> {
  const db = await database();
  const transaction = db.transaction(['documents', 'analysisCache'], 'readwrite');
  await transaction.objectStore('documents').clear();
  await transaction.objectStore('analysisCache').clear();
  await transaction.done;
}

export async function deleteDocument(id: string) { await (await database()).delete('documents', id); }
export async function readAnalysisCache(key: string) { return (await database()).get('analysisCache', key); }
export async function writeAnalysisCache(value: CachedAnalysis) {
  const db = await database();
  await db.put('analysisCache', value);
  const values = await db.getAll('analysisCache');
  const oldest = values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const entry of oldest.slice(0, Math.max(0, oldest.length - 20))) await db.delete('analysisCache', entry.key);
}
