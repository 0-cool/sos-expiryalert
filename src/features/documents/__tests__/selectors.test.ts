import { computeStats, decorateDocuments, normalizeForSearch, queryDocuments, upcomingDocuments } from '@/features/documents/selectors';
import type { DocumentRecord } from '@/features/documents/types';

const today = { year: 2026, month: 11, day: 4 };

function doc(id: string, overrides: Partial<DocumentRecord>): DocumentRecord {
  return {
    id,
    userId: 'user',
    documentType: 'passport',
    documentName: `Doc ${id}`,
    expirationDate: '2030-01-01',
    notes: null,
    reminderDays: [90, 30, 7, 1],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const documents = decorateDocuments(
  [
    doc('a', { documentName: 'José Pérez', documentType: 'drivers_license', expirationDate: '2026-11-20' }),
    doc('b', { documentName: 'Family car', documentType: 'vehicle_insurance', expirationDate: '2026-10-01' }),
    doc('c', { documentName: 'Juan Rojas', documentType: 'passport', expirationDate: '2031-05-05', notes: 'consulate' }),
    doc('d', { documentName: 'Ana', documentType: 'visa', expirationDate: '2027-06-30' }),
  ],
  today,
);

const typeLabel = (document: { documentType: string }) =>
  ({ drivers_license: 'Licencia de conducir', vehicle_insurance: 'Seguro del vehículo', passport: 'Pasaporte', visa: 'Visa' })[
    document.documentType
  ] ?? document.documentType;

describe('computeStats', () => {
  it('counts statuses', () => {
    expect(computeStats(documents)).toEqual({ total: 4, active: 2, expiring_soon: 1, expired: 1 });
  });
});

describe('queryDocuments', () => {
  it('sorts soonest first by default and latest first on demand', () => {
    expect(queryDocuments(documents, { search: '', status: 'all', sort: 'soonest', typeLabel }).map((d) => d.id)).toEqual([
      'b',
      'a',
      'd',
      'c',
    ]);
    expect(queryDocuments(documents, { search: '', status: 'all', sort: 'latest', typeLabel }).map((d) => d.id)).toEqual([
      'c',
      'd',
      'a',
      'b',
    ]);
  });

  it('filters by status', () => {
    expect(queryDocuments(documents, { search: '', status: 'expired', sort: 'soonest', typeLabel }).map((d) => d.id)).toEqual([
      'b',
    ]);
  });

  it('searches names, translated type labels and notes, ignoring accents and case', () => {
    const search = (text: string) =>
      queryDocuments(documents, { search: text, status: 'all', sort: 'soonest', typeLabel }).map((d) => d.id);
    expect(search('jose')).toEqual(['a']);
    expect(search('PASAPORTE')).toEqual(['c']);
    expect(search('vehiculo')).toEqual(['b']);
    expect(search('consulate')).toEqual(['c']);
    expect(search('nothing')).toEqual([]);
  });
});

describe('upcomingDocuments', () => {
  it('excludes expired documents and limits the list', () => {
    expect(upcomingDocuments(documents, 2).map((d) => d.id)).toEqual(['a', 'd']);
  });
});

describe('normalizeForSearch', () => {
  it('strips accents', () => {
    expect(normalizeForSearch('  Ação Éxito ')).toBe('acao exito');
  });
});
